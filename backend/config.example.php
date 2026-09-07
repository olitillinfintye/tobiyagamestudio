<?php
return [
    'dsn' => 'mysql:host=localhost;dbname=ACCOUNT_cms;charset=utf8mb4',
    'db_user' => 'ACCOUNT_cms',
    'db_password' => '',
    'origin' => 'https://staging.tobiyastudio.com',
    'upload_root' => '/home/ACCOUNT/staging/uploads',
    'secure_cookies' => true,
    'smtp' => [
        'host' => '',
        'port' => 587,
        'username' => '',
        'password' => '',
        'encryption' => 'tls',
        'from' => 'noreply@tobiyastudio.com',
    ],
];