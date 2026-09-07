<?php
$backend = getenv('TOBIYA_BACKEND') ?: dirname(__DIR__, 2) . '/tobiya-cms/current/api.php';
if (!is_file($backend)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['data' => null, 'error' => ['message' => 'CMS setup is incomplete.']]);
    exit;
}
require $backend;
runApi();