<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/import.php';

try {
    $command = $argv[1] ?? '';
    $config = configuration();
    $db = database($config);
    if ($command === 'schema') {
        if (execute($db, 'SHOW TABLES')->fetch()) throw new RuntimeException('Schema installation requires an empty database.');
        $db->exec(file_get_contents(__DIR__ . '/schema.sql'));
        echo "Schema installed.\n";
    } elseif ($command === 'import') {
        $counts = importExport($db, $argv[2] ?? throw new RuntimeException('Export directory required.'));
        echo json_encode($counts, JSON_PRETTY_PRINT) . "\n";
        echo "Copy the verified uploads directory to upload_root before cutover. Admins must reset their passwords.\n";
    } elseif (in_array($command, ['bootstrap', 'bootstrap-link'], true)) {
        if (execute($db, 'SELECT COUNT(*) FROM admin_users')->fetchColumn() != 0) throw new RuntimeException('Bootstrap is only available before any admin exists.');
        $email = strtolower($argv[2] ?? '');
        validateValue('email', $email);
        $linkFile = null;
        $token = null;
        if ($command === 'bootstrap-link') {
            $linkPath = $argv[3] ?? throw new RuntimeException('Private output file required.');
            umask(0077);
            $linkFile = fopen($linkPath, 'x');
            if (!$linkFile) throw new RuntimeException('Cannot create private setup link file.');
            $password = bin2hex(random_bytes(32));
            $token = bin2hex(random_bytes(32));
        } else {
            fwrite(STDERR, "Enter initial password directly in this terminal (input may be visible): ");
            $password = validatePassword(rtrim(fgets(STDIN), "\r\n"));
        }
        $id = uuid();
        $db->beginTransaction();
        try {
            insertRow($db, 'cms_users', ['id' => $id, 'email' => $email, 'password_hash' => password_hash($password, PASSWORD_DEFAULT), 'created_at' => gmdate('c')]);
            insertRow($db, 'admin_users', ['id' => uuid(), 'user_id' => $id, 'is_super_admin' => 1, 'created_at' => gmdate('c')]);
            if ($token !== null) {
                insertRow($db, 'cms_reset_tokens', ['token_hash' => hash('sha256', $token), 'user_id' => $id, 'expires_at' => time() + 3600]);
                $link = $config['origin'] . '/admin#recovery_token=' . $token . "\n";
                if (fwrite($linkFile, $link) !== strlen($link) || !fflush($linkFile)) throw new RuntimeException('Cannot write setup link.');
                fclose($linkFile);
            }
            $db->commit();
        } catch (Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            if (is_resource($linkFile)) fclose($linkFile);
            if ($token !== null) unlink($linkPath);
            throw $error;
        }
        echo "Initial super admin created.\n";
        if ($token !== null) echo "Setup link saved privately; expires in one hour. Delete the file after use.\n";
    } else throw new RuntimeException('Commands: schema | import PRIVATE_EXPORT_DIRECTORY | bootstrap ADMIN_EMAIL | bootstrap-link ADMIN_EMAIL PRIVATE_OUTPUT_FILE');
} catch (Throwable $error) {
    fwrite(STDERR, 'Operation failed: ' . ($error instanceof PDOException ? 'Database error; inspect private server logs.' : $error->getMessage()) . "\n");
    exit(1);
}