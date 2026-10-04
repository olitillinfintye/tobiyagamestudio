<?php
declare(strict_types=1);
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/uploads.php';

function dispatch(PDO $db, array $config, string $action, array $input, ?array $user): mixed
{
    if ($action === 'query') return queryContent($db, $input, $user);
    if ($action === 'overview') {
        if (!can($user, 'analytics')) throw new ApiFailure('Permission denied.', $user ? 403 : 401);
        return [
            'projects' => (int) execute($db, 'SELECT COUNT(*) FROM projects')->fetchColumn(),
            'publishedPosts' => (int) execute($db, 'SELECT COUNT(*) FROM blog_posts WHERE published = 1')->fetchColumn(),
            'unreadMessages' => (int) execute($db, 'SELECT COUNT(*) FROM contact_submissions WHERE `read` = 0')->fetchColumn(),
            'pendingEmails' => (int) execute($db, 'SELECT COUNT(*) FROM cms_mail_queue')->fetchColumn(),
        ];
    }
    if (str_starts_with($action, 'users-')) return manageUser($db, $action, $input, $user);
    if ($action === 'upload') return uploadMedia($db, $config, $user);
    if ($action === 'contact') {
        rateLimit($db, 'contact', $_SERVER['REMOTE_ADDR'] ?? 'unknown', 5, 3600);
        $row = validateContact($input);
        $row['id'] = uuid();
        $row['created_at'] = gmdate('c');
        $db->beginTransaction();
        try {
            insertRow($db, 'contact_submissions', $row);
            $value = execute($db, "SELECT value FROM site_settings WHERE `key` = 'notification_recipients'")->fetchColumn();
            $recipients = $value ? json_decode($value, true, 16, JSON_THROW_ON_ERROR) : [];
            foreach ($recipients as $recipient) {
                validateValue('email', $recipient);
                queueMail($db, $recipient, 'New website inquiry', "From: {$row['name']} <{$row['email']}>\nSubject: {$row['subject']}\n\n{$row['message']}", $row['id']);
            }
            $db->commit();
            return ['id' => $row['id']];
        } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
    }
    return authAction($db, $config, $action, $input, $user);
}

function runApi(): void
{
    ini_set('display_errors', '0');
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    try {
        $config = configuration();
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        session_name('tobiya_cms');
        session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $config['secure_cookies'] ?? true, 'httponly' => true, 'samesite' => 'Strict']);
        session_start();
        $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
        $action = $_GET['action'] ?? '';
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if ($method !== 'POST' && !($method === 'GET' && $action === 'session')) throw new ApiFailure('Method not allowed.', 405);
        if ($method === 'POST') {
            if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== $config['origin']) throw new ApiFailure('Origin not allowed.', 403);
            if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) throw new ApiFailure('Session expired. Please retry.', 403, 'csrf');
        }
        $db = database($config);
        $user = currentUser($db);
        if ($action === 'session') $data = sessionPayload($user);
        else {
            $input = [];
            if ($action !== 'upload') {
                if (($_SERVER['CONTENT_LENGTH'] ?? 0) > 1500000) throw new ApiFailure('Request too large.', 413);
                $raw = file_get_contents('php://input', false, null, 0, 1500001);
                if (strlen($raw) > 1500000) throw new ApiFailure('Request too large.', 413);
                $input = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
                if (!is_array($input)) throw new ApiFailure('Expected a JSON object.');
            }
            $data = dispatch($db, $config, $action, $input, $user);
        }
        echo json_encode(['data' => $data, 'error' => null], JSON_THROW_ON_ERROR);
    } catch (ApiFailure $error) {
        http_response_code($error->status);
        echo json_encode(['data' => null, 'error' => ['message' => $error->getMessage(), 'code' => $error->errorCode]]);
    } catch (JsonException | TypeError $error) {
        http_response_code(400);
        echo json_encode(['data' => null, 'error' => ['message' => 'Invalid request data.']]);
    } catch (Throwable $error) {
        $duplicate = $error instanceof PDOException && $error->getCode() === '23000';
        http_response_code($duplicate ? 409 : 503);
        error_log('CMS request failed: ' . get_class($error) . ' [' . $error->getCode() . ']');
        echo json_encode(['data' => null, 'error' => ['message' => $duplicate ? 'A conflicting or incomplete record was supplied.' : 'The CMS is temporarily unavailable.']]);
    }
}