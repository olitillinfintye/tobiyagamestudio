<?php
declare(strict_types=1);
$directory = sys_get_temp_dir() . '/tobiya-bootstrap-' . bin2hex(random_bytes(8));
mkdir($directory, 0700);
$db = new PDO('sqlite:' . $directory . '/test.sqlite');
$db->exec('CREATE TABLE cms_users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, created_at TEXT); CREATE TABLE admin_users (id TEXT PRIMARY KEY, user_id TEXT UNIQUE, is_super_admin INTEGER, created_at TEXT); CREATE TABLE cms_reset_tokens (token_hash TEXT PRIMARY KEY, user_id TEXT, expires_at INTEGER)');
$config = ['dsn' => 'sqlite:' . $directory . '/test.sqlite', 'db_user' => '', 'db_password' => '', 'origin' => 'https://example.com'];
file_put_contents($directory . '/config.php', '<?php return ' . var_export($config, true) . ';');
$previous = getenv('TOBIYA_CONFIG');
putenv('TOBIYA_CONFIG=' . $directory . '/config.php');
try {
    $command = [PHP_BINARY];
    if (PHP_OS_FAMILY === 'Windows') {
        $command = [...$command, '-d', 'extension_dir=' . ini_get('extension_dir'), '-d', 'extension=pdo_sqlite', '-d', 'extension=mbstring'];
    }
    $command = [...$command, dirname(__DIR__) . '/console.php', 'bootstrap-link', 'admin@example.com', $directory . '/link.txt'];
    $run = function () use ($command): int {
        $process = proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (!is_resource($process)) throw new RuntimeException('Cannot start bootstrap test.');
        fclose($pipes[0]);
        stream_get_contents($pipes[1]);
        stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        return proc_close($process);
    };
    if ($run() !== 0) throw new RuntimeException('Bootstrap failed.');
    $link = trim(file_get_contents($directory . '/link.txt'));
    $token = substr($link, strlen('https://example.com/admin#recovery_token='));
    $record = $db->query('SELECT * FROM cms_reset_tokens')->fetch(PDO::FETCH_ASSOC);
    if (!preg_match('/^[a-f0-9]{64}$/D', $token) || !hash_equals($record['token_hash'], hash('sha256', $token))) throw new RuntimeException('Setup token mismatch.');
    if ($record['expires_at'] < time() + 3500 || $record['expires_at'] > time() + 3600) throw new RuntimeException('Incorrect token expiry.');
    if ((int) $db->query('SELECT is_super_admin FROM admin_users')->fetchColumn() !== 1) throw new RuntimeException('Super admin was not created.');
    if ($run() === 0) throw new RuntimeException('Repeated bootstrap must fail.');
    if ((int) $db->query('SELECT COUNT(*) FROM cms_users')->fetchColumn() !== 1) throw new RuntimeException('Repeated bootstrap changed users.');
    echo "PASS: private bootstrap link, token hash, expiry, super admin and repeat protection.\n";
} finally {
    putenv($previous === false ? 'TOBIYA_CONFIG' : 'TOBIYA_CONFIG=' . $previous);
    $db = null;
    foreach (glob($directory . '/*') as $file) unlink($file);
    rmdir($directory);
}