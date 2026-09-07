<?php
declare(strict_types=1);
require_once __DIR__ . '/policy.php';

function configuration(): array
{
    $path = getenv('TOBIYA_CONFIG') ?: __DIR__ . '/config.php';
    if (!is_file($path)) throw new ApiFailure('CMS setup is incomplete.', 503);
    $config = require $path;
    if (!is_array($config) || empty($config['dsn']) || empty($config['origin'])) throw new ApiFailure('CMS setup is incomplete.', 503);
    return $config;
}

function database(array $config): PDO
{
    return new PDO($config['dsn'], $config['db_user'], $config['db_password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function execute(PDO $db, string $sql, array $parameters = []): PDOStatement
{
    $statement = $db->prepare($sql);
    $statement->execute($parameters);
    return $statement;
}

function insertRow(PDO $db, string $table, array $row): void
{
    $columns = implode(',', array_map(fn($column) => '`' . $column . '`', array_keys($row)));
    $placeholders = implode(',', array_fill(0, count($row), '?'));
    execute($db, "INSERT INTO `$table` ($columns) VALUES ($placeholders)", array_values($row));
}

function hydrateRow(string $table, array $row): array
{
    foreach ($row as $column => &$value) {
        if ($value === null) continue;
        $type = tables()[$table][$column] ?? '';
        $value = match ($type) {
            'bool' => (bool) $value,
            'int' => (int) $value,
            'strings', 'urls', 'social' => json_decode($value, true, 64, JSON_THROW_ON_ERROR),
            default => $value,
        };
    }
    return $row;
}

function filtersSql(string $table, array $filters, array &$parameters): string
{
    if (count($filters) > 30) throw new ApiFailure('Too many filters.');
    $parts = [];
    foreach ($filters as $filter) {
        $column = $filter['column'] ?? '';
        $type = tables()[$table][$column] ?? throw new ApiFailure('Invalid filter field.');
        $operator = $filter['operator'] ?? '';
        $value = $filter['value'] ?? null;
        if ($operator === 'eq') {
            if ($value === null) $parts[] = "`$column` IS NULL";
            else { $parts[] = "`$column` = ?"; $parameters[] = validateValue($type, $value); }
        } elseif ($operator === 'in' && is_array($value) && count($value) <= 100) {
            $parts[] = $value ? "`$column` IN (" . implode(',', array_fill(0, count($value), '?')) . ')' : '1 = 0';
            foreach ($value as $item) $parameters[] = validateValue($type, $item);
        } else throw new ApiFailure('Invalid filter.');
    }
    return $parts ? ' WHERE ' . implode(' AND ', $parts) : '';
}

function queryContent(PDO $db, array $input, ?array $user): mixed
{
    $table = $input['table'] ?? '';
    $fields = tables()[$table] ?? throw new ApiFailure('Unknown resource.');
    $operation = $input['operation'] ?? 'select';
    $filters = $input['filters'] ?? [];
    if (!is_array($filters)) throw new ApiFailure('Invalid filters.');
    $parameters = [];
    if ($operation === 'select') {
        $columns = $input['columns'] ?? '*';
        if (!is_string($columns)) throw new ApiFailure('Invalid fields.');
        $names = $columns === '*' ? array_keys($fields) : array_map('trim', explode(',', $columns));
        foreach ($names as $column) if (!isset($fields[$column])) throw new ApiFailure('Invalid fields.');
        $projection = implode(',', array_map(fn($column) => '`' . $column . '`', $names));
        $where = filtersSql($table, [...$filters, ...readPolicy($table, $user)], $parameters);
        $order = [];
        foreach (($input['ordering'] ?? []) as $sorting) {
            $column = $sorting['column'] ?? '';
            if (!isset($fields[$column])) throw new ApiFailure('Invalid sorting.');
            $order[] = "`$column` " . (($sorting['ascending'] ?? true) ? 'ASC' : 'DESC');
        }
        $limit = $input['limit'] ?? 5000;
        if (!is_int($limit) || $limit < 1 || $limit > 5000) throw new ApiFailure('Invalid limit.');
        $cardinality = $input['cardinality'] ?? 'many';
        if (!in_array($cardinality, ['many', 'one', 'optional'], true)) throw new ApiFailure('Invalid cardinality.');
        $fetchLimit = $cardinality === 'many' ? $limit + 1 : 2;
        $sql = "SELECT $projection FROM `$table`" . $where . ($order ? ' ORDER BY ' . implode(',', $order) : '') . " LIMIT $fetchLimit";
        $rows = array_map(fn($row) => hydrateRow($table, $row), execute($db, $sql, $parameters)->fetchAll());
        if ($cardinality !== 'many') {
            if (count($rows) > 1 || ($cardinality === 'one' && count($rows) !== 1)) throw new ApiFailure('Expected exactly one record.', 404);
            return $rows[0] ?? null;
        }
        if (!isset($input['limit']) && count($rows) > $limit) throw new ApiFailure('Too many records. Export or archive records before continuing.', 413);
        return array_slice($rows, 0, $limit);
    }
    if (!in_array($operation, ['insert', 'update', 'upsert', 'delete'], true)) throw new ApiFailure('Invalid operation.');
    if ($table === 'contact_submissions' && in_array($operation, ['update', 'delete'], true)) {
        if (!can($user, 'messages')) throw new ApiFailure('Permission denied.', $user ? 403 : 401);
        if ($operation === 'update' && array_keys($input['values'] ?? []) !== ['read']) throw new ApiFailure('Only read status can be changed.');
    } else authorizeWrite($table, $user);
    if (in_array($operation, ['update', 'delete'], true)) {
        $identityFilters = array_filter($filters, fn($filter) => in_array($filter['column'] ?? '', ['id', 'key'], true) && ($filter['operator'] ?? '') === 'eq' && is_string($filter['value'] ?? null) && $filter['value'] !== '');
        if (count($identityFilters) !== 1) throw new ApiFailure('A single record identifier is required.');
        $where = filtersSql($table, $filters, $parameters);
        if ($operation === 'delete') execute($db, "DELETE FROM `$table`" . $where, $parameters);
        else {
            $row = validateRow($table, $input['values'] ?? []);
            if ($table === 'site_settings') {
                $existing = execute($db, 'SELECT * FROM site_settings' . $where, $parameters)->fetch();
                if (!$existing) throw new ApiFailure('Setting not found.', 404);
                validateSetting(array_replace($existing, $row));
            }
            if (isset($fields['updated_at'])) $row['updated_at'] = gmdate('c');
            $assignments = implode(',', array_map(fn($column) => "`$column` = ?", array_keys($row)));
            execute($db, "UPDATE `$table` SET $assignments" . $where, [...array_values($row), ...$parameters]);
        }
        return [];
    }
    if ($operation === 'upsert' && ($table !== 'site_settings' || ($input['conflict'] ?? '') !== 'key')) throw new ApiFailure('Unsupported upsert.');
    $values = $input['values'] ?? [];
    if (!is_array($values) || !$values) throw new ApiFailure('No records supplied.');
    $records = array_is_list($values) ? $values : [$values];
    if (count($records) > 100) throw new ApiFailure('Too many records.');
    $db->beginTransaction();
    try {
        $ids = [];
        foreach ($records as $record) {
            $row = validateRow($table, $record);
            if ($table === 'site_settings') validateSetting($row);
            $row['id'] = uuid();
            $row['created_at'] = gmdate('c');
            if (isset($fields['updated_at'])) $row['updated_at'] = gmdate('c');
            if ($operation === 'upsert') {
                $existing = execute($db, 'SELECT id FROM site_settings WHERE `key` = ? FOR UPDATE', [$row['key']])->fetchColumn();
                if ($existing) {
                    execute($db, 'UPDATE site_settings SET value = ?, label = COALESCE(?, label), updated_at = ? WHERE id = ?', [$row['value'], $row['label'] ?? null, $row['updated_at'], $existing]);
                    $ids[] = $existing;
                    continue;
                }
            }
            insertRow($db, $table, $row);
            $ids[] = $row['id'];
        }
        $db->commit();
        return queryContent($db, ['table' => $table, 'filters' => [['column' => 'id', 'operator' => 'in', 'value' => $ids]], 'cardinality' => $input['cardinality'] ?? 'many'], $user);
    } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
}

function validateSetting(array $row): void
{
    $key = $row['key'] ?? throw new ApiFailure('Setting key required.');
    $value = $row['value'] ?? throw new ApiFailure('Setting value required.');
    if (in_array($key, ['hero_3d_model', 'showreel_video_url'], true)) validateValue('url', $value);
    if ($key === 'notification_recipients') {
        $recipients = json_decode($value, true, 16, JSON_THROW_ON_ERROR);
        if (!is_array($recipients) || !array_is_list($recipients) || count($recipients) > 20) throw new ApiFailure('Invalid recipients.');
        foreach ($recipients as $recipient) validateValue('email', $recipient);
    }
    if ($key === 'social_links') {
        $links = json_decode($value, true, 16, JSON_THROW_ON_ERROR);
        if (!is_array($links)) throw new ApiFailure('Invalid social links.');
        foreach ($links as $link) validateValue('url', is_array($link) ? ($link['url'] ?? '') : $link);
    }
}

function rateLimit(PDO $db, string $scope, string $identity, int $maximum, int $seconds): void
{
    $bucket = hash('sha256', $scope . ':' . $identity);
    $now = time();
    execute($db, 'INSERT INTO cms_rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE hits = IF(expires_at <= ?, 1, hits + 1), expires_at = IF(expires_at <= ?, ?, expires_at)', [$bucket, $now + $seconds, $now, $now, $now + $seconds]);
    $hits = execute($db, 'SELECT hits FROM cms_rate_limits WHERE bucket = ?', [$bucket])->fetchColumn();
    if ($hits > $maximum) throw new ApiFailure('Too many attempts. Please try again later.', 429, 'rate_limit');
}

function queueMail(PDO $db, string $recipient, string $subject, string $body, ?string $submission = null): void
{
    insertRow($db, 'cms_mail_queue', ['id' => uuid(), 'recipient' => $recipient, 'subject' => $subject, 'body' => $body, 'available_at' => time(), 'created_at' => time(), 'submission_id' => $submission]);
}