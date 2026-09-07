<?php
declare(strict_types=1);
require_once __DIR__ . '/uploads.php';

function importExport(PDO $db, string $directory): array
{
    $manifest = json_decode(file_get_contents($directory . '/manifest.json'), true, 64, JSON_THROW_ON_ERROR);
    $dataFile = $directory . '/data.json';
    if (($manifest['version'] ?? null) !== 1 || !hash_equals($manifest['data_sha256'], hash_file('sha256', $dataFile))) throw new RuntimeException('Export checksum mismatch.');
    $data = json_decode(file_get_contents($dataFile), true, 64, JSON_THROW_ON_ERROR);
    if (($data['version'] ?? null) !== 1 || array_diff(array_keys(tables()), array_keys($data['tables']))) throw new RuntimeException('Incomplete export.');
    foreach ($manifest['media'] as $path => $metadata) {
        if (str_contains($path, '\\') || str_starts_with($path, '/') || preg_match('~(?:^|/)\.{1,2}(?:/|$)~', $path)) throw new RuntimeException('Invalid media path.');
        $file = $directory . '/uploads/' . $path;
        if (!is_file($file) || filesize($file) !== $metadata['bytes'] || !hash_equals($metadata['sha256'], hash_file('sha256', $file))) throw new RuntimeException('Media checksum mismatch.');
        validateMedia($path, $file);
    }
    foreach (['cms_users', ...array_keys(tables()), 'cms_mail_queue'] as $table) {
        if (execute($db, "SELECT COUNT(*) FROM `$table`")->fetchColumn() != 0) throw new RuntimeException('Import requires an empty destination database.');
    }
    $db->beginTransaction();
    try {
        foreach ($data['users'] as $user) {
            validateValue('id', $user['id']);
            validateValue('email', $user['email']);
            insertRow($db, 'cms_users', ['id' => $user['id'], 'email' => strtolower($user['email']), 'created_at' => $user['created_at'], 'password_hash' => password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT)]);
        }
        $counts = [];
        foreach (tables() as $table => $fields) {
            $records = $data['tables'][$table];
            if (count($records) !== $manifest['counts'][$table]) throw new RuntimeException('Export count mismatch.');
            foreach ($records as $record) {
                $row = validateRow($table, $record, true);
                if ($table === 'site_settings') validateSetting($row);
                insertRow($db, $table, $row);
            }
            $counts[$table] = (int) execute($db, "SELECT COUNT(*) FROM `$table`")->fetchColumn();
            if ($counts[$table] !== count($records)) throw new RuntimeException('Imported count mismatch.');
        }
        $db->commit();
        return $counts;
    } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
}