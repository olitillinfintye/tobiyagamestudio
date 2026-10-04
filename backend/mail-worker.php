<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/vendor/autoload.php';

$config = configuration();
$db = database($config);
if (!execute($db, "SELECT GET_LOCK('tobiya_mail_worker', 0)")->fetchColumn()) exit;
try {
    $smtp = $config['smtp'];
    if (empty($smtp['host'])) throw new RuntimeException('SMTP is not configured.');
    $jobs = execute($db, 'SELECT * FROM cms_mail_queue WHERE available_at <= ? AND attempts < 8 ORDER BY created_at LIMIT 20', [time()])->fetchAll();
    foreach ($jobs as $job) {
        if (!$job['submission_id'] && $job['created_at'] < time() - 3600) {
            execute($db, 'DELETE FROM cms_mail_queue WHERE id = ?', [$job['id']]);
            continue;
        }
        try {
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $smtp['host'];
            $mail->Port = $smtp['port'];
            $mail->SMTPAuth = true;
            $mail->Username = $smtp['username'];
            $mail->Password = $smtp['password'];
            $mail->SMTPSecure = $smtp['encryption'];
            $mail->Timeout = 20;
            $mail->CharSet = 'UTF-8';
            $mail->setFrom($smtp['from'], 'Tobiya Studio');
            $mail->addAddress($job['recipient']);
            $mail->Subject = $job['subject'];
            $mail->Body = $job['body'];
            $mail->send();
            $db->beginTransaction();
            execute($db, 'DELETE FROM cms_mail_queue WHERE id = ?', [$job['id']]);
            if ($job['submission_id']) execute($db, 'UPDATE contact_submissions SET notification_sent = 1 WHERE id = ? AND NOT EXISTS (SELECT 1 FROM cms_mail_queue WHERE submission_id = ?)', [$job['submission_id'], $job['submission_id']]);
            $db->commit();
        } catch (Throwable $error) {
            if ($db->inTransaction()) $db->rollBack();
            execute($db, 'UPDATE cms_mail_queue SET attempts = attempts + 1, available_at = ? WHERE id = ?', [time() + min(86400, 60 * (2 ** $job['attempts'])), $job['id']]);
            fwrite(STDERR, "Mail delivery failed for job {$job['id']}; queued for retry.\n");
        }
    }
    execute($db, 'DELETE FROM cms_rate_limits WHERE expires_at < ?', [time()]);
    execute($db, 'DELETE FROM cms_reset_tokens WHERE expires_at < ?', [time()]);
    execute($db, 'DELETE FROM cms_mail_queue WHERE submission_id IS NULL AND created_at < ?', [time() - 3600]);
} finally { execute($db, "SELECT RELEASE_LOCK('tobiya_mail_worker')"); }