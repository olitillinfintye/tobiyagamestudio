<?php
declare(strict_types=1);
require_once __DIR__ . '/database.php';

function currentUser(PDO $db): ?array
{
    if (empty($_SESSION['user_id'])) return null;
    if (time() - ($_SESSION['last_seen'] ?? 0) > 1800 || time() - ($_SESSION['signed_in'] ?? 0) > 43200) { unset($_SESSION['user_id']); return null; }
    $user = execute($db, 'SELECT u.id, u.email, u.session_version, a.is_super_admin FROM cms_users u JOIN admin_users a ON a.user_id = u.id WHERE u.id = ?', [$_SESSION['user_id']])->fetch();
    if (!$user || (int) $user['session_version'] !== ($_SESSION['version'] ?? 0)) { unset($_SESSION['user_id']); return null; }
    $_SESSION['last_seen'] = time();
    $user['is_super_admin'] = (bool) $user['is_super_admin'];
    $user['permissions'] = execute($db, 'SELECT permission FROM admin_permissions WHERE user_id = ?', [$user['id']])->fetchAll(PDO::FETCH_COLUMN);
    return $user;
}

function sessionPayload(?array $user): array
{
    return ['csrf' => $_SESSION['csrf'], 'session' => $user ? ['user' => ['id' => $user['id'], 'email' => $user['email']]] : null];
}

function signIn(array $user): array
{
    session_regenerate_id(true);
    $_SESSION = ['csrf' => bin2hex(random_bytes(32)), 'user_id' => $user['id'], 'version' => (int) $user['session_version'], 'signed_in' => time(), 'last_seen' => time()];
    return sessionPayload($user);
}

function validatePassword(mixed $password): string
{
    if (!is_string($password) || strlen($password) < 12 || strlen($password) > 72 || str_contains($password, "\0")) throw new ApiFailure('Password must be between 12 and 72 bytes.');
    return $password;
}

function requireSuper(?array $user): void
{
    if (!$user || !$user['is_super_admin']) throw new ApiFailure('Super-admin access required.', $user ? 403 : 401);
}

function manageUser(PDO $db, string $action, array $input, ?array $user): mixed
{
    requireSuper($user);
    if ($action === 'users-list') {
        $rows = execute($db, 'SELECT a.*, u.email FROM admin_users a JOIN cms_users u ON u.id = a.user_id ORDER BY a.created_at')->fetchAll();
        foreach ($rows as &$row) {
            $row['is_super_admin'] = (bool) $row['is_super_admin'];
            $row['permissions'] = execute($db, 'SELECT permission FROM admin_permissions WHERE user_id = ?', [$row['user_id']])->fetchAll(PDO::FETCH_COLUMN);
        }
        return $rows;
    }
    if (!in_array($action, ['users-create', 'users-update', 'users-delete'], true)) throw new ApiFailure('Unknown user action.');
    $target = $action === 'users-create' ? uuid() : ($input['user_id'] ?? throw new ApiFailure('User identifier required.'));
    validateValue('id', $target);
    if ($target === $user['id']) throw new ApiFailure('Use another super admin to change your own access.', 403);
    $super = $input['is_super_admin'] ?? false;
    validateValue('bool', $super);
    $grants = $input['permissions'] ?? [];
    if (!is_array($grants) || !array_is_list($grants) || count($grants) > count(permissions())) throw new ApiFailure('Invalid permissions.');
    foreach ($grants as $grant) validateValue('permission', $grant);
    $db->beginTransaction();
    try {
        $admins = execute($db, 'SELECT user_id FROM admin_users WHERE is_super_admin = 1 FOR UPDATE')->fetchAll(PDO::FETCH_COLUMN);
        if (($action === 'users-delete' || !$super) && in_array($target, $admins, true) && count($admins) < 2) throw new ApiFailure('The last super admin cannot be removed.', 409);
        if ($action === 'users-create') {
            $email = strtolower(trim($input['email'] ?? ''));
            validateValue('email', $email);
            $password = validatePassword($input['password'] ?? null);
            insertRow($db, 'cms_users', ['id' => $target, 'email' => $email, 'password_hash' => password_hash($password, PASSWORD_DEFAULT), 'created_at' => gmdate('c')]);
            insertRow($db, 'admin_users', ['id' => uuid(), 'user_id' => $target, 'is_super_admin' => (int) $super, 'created_at' => gmdate('c')]);
        } elseif ($action === 'users-update') {
            if (!execute($db, 'SELECT id FROM admin_users WHERE user_id = ?', [$target])->fetchColumn()) throw new ApiFailure('Admin not found.', 404);
            execute($db, 'UPDATE admin_users SET is_super_admin = ? WHERE user_id = ?', [(int) $super, $target]);
            execute($db, 'UPDATE cms_users SET session_version = session_version + 1 WHERE id = ?', [$target]);
            execute($db, 'DELETE FROM admin_permissions WHERE user_id = ?', [$target]);
        } elseif ($action === 'users-delete') {
            execute($db, 'DELETE FROM cms_users WHERE id = ?', [$target]);
        } else throw new ApiFailure('Unknown user action.');
        if ($action !== 'users-delete' && !$super) foreach (array_unique($grants) as $grant) {
            insertRow($db, 'admin_permissions', ['id' => uuid(), 'user_id' => $target, 'permission' => $grant, 'created_at' => gmdate('c')]);
        }
        $db->commit();
        return ['user_id' => $target];
    } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
}

function authAction(PDO $db, array $config, string $action, array $input, ?array $user): mixed
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if ($action === 'logout') {
        session_regenerate_id(true);
        $_SESSION = ['csrf' => bin2hex(random_bytes(32))];
        return sessionPayload(null);
    }
    if ($action === 'login') {
        rateLimit($db, 'login-ip', $ip, 30, 900);
        $email = strtolower(trim($input['email'] ?? ''));
        rateLimit($db, 'login-email', $email, 10, 900);
        $password = $input['password'] ?? '';
        if (!is_string($password) || strlen($password) > 72) throw new ApiFailure('Invalid email or password.', 401);
        $record = execute($db, 'SELECT u.* FROM cms_users u JOIN admin_users a ON a.user_id = u.id WHERE u.email = ?', [$email])->fetch();
        $verified = password_verify($password, $record['password_hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.');
        if (!$record || !$verified) throw new ApiFailure('Invalid email or password.', 401);
        if (password_needs_rehash($record['password_hash'], PASSWORD_DEFAULT)) execute($db, 'UPDATE cms_users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $record['id']]);
        return signIn($record);
    }
    if ($action === 'request-reset') {
        rateLimit($db, 'reset-ip', $ip, 5, 900);
        $email = strtolower(trim($input['email'] ?? ''));
        validateValue('email', $email);
        rateLimit($db, 'reset-email', $email, 3, 3600);
        if (empty($config['smtp']['host'])) throw new ApiFailure('Password recovery is temporarily unavailable.', 503);
        $record = execute($db, 'SELECT u.id FROM cms_users u JOIN admin_users a ON a.user_id = u.id WHERE u.email = ?', [$email])->fetch();
        if ($record) {
            $token = bin2hex(random_bytes(32));
            $db->beginTransaction();
            try {
                execute($db, 'DELETE FROM cms_reset_tokens WHERE user_id = ?', [$record['id']]);
                insertRow($db, 'cms_reset_tokens', ['token_hash' => hash('sha256', $token), 'user_id' => $record['id'], 'expires_at' => time() + 3600]);
                queueMail($db, $email, 'Reset your Tobiya CMS password', "Use this link within one hour:\n" . $config['origin'] . '/admin#recovery_token=' . $token . "\n\nIgnore this email if you did not request it.");
                $db->commit();
            } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
        }
        return ['accepted' => true];
    }
    if ($action === 'reset-password') {
        rateLimit($db, 'reset-use', $ip, 10, 900);
        $password = validatePassword($input['password'] ?? null);
        $token = $input['token'] ?? '';
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) throw new ApiFailure('The reset link is invalid or expired.', 400);
        $db->beginTransaction();
        try {
            $record = execute($db, 'SELECT u.* FROM cms_reset_tokens t JOIN cms_users u ON u.id = t.user_id JOIN admin_users a ON a.user_id = u.id WHERE t.token_hash = ? AND t.expires_at > ? FOR UPDATE', [hash('sha256', $token), time()])->fetch();
            if (!$record) throw new ApiFailure('The reset link is invalid or expired.', 400);
            execute($db, 'UPDATE cms_users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $record['id']]);
            execute($db, 'DELETE FROM cms_reset_tokens WHERE user_id = ?', [$record['id']]);
            $record['session_version']++;
            $db->commit();
            return signIn($record);
        } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
    }
    throw new ApiFailure('Unknown authentication action.', 404);
}