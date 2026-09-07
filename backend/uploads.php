<?php
declare(strict_types=1);
require_once __DIR__ . '/database.php';

function validateMedia(string $filename, string $temporary): void
{
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($temporary);
    $allowed = [
        'jpg' => ['image/jpeg'], 'jpeg' => ['image/jpeg'], 'png' => ['image/png'],
        'webp' => ['image/webp'], 'gif' => ['image/gif'],
        'mp4' => ['video/mp4', 'application/mp4'], 'webm' => ['video/webm'],
        'mov' => ['video/quicktime'], 'glb' => ['model/gltf-binary', 'application/octet-stream'],
        'gltf' => ['model/gltf+json', 'application/json', 'text/plain'],
    ];
    if (!in_array($mime, $allowed[$extension] ?? [], true)) throw new ApiFailure('Unsupported media type. Use PNG, JPEG, WebP, GIF, MP4, WebM, MOV, GLB or embedded GLTF.');
    if ($extension === 'glb' && file_get_contents($temporary, false, null, 0, 4) !== 'glTF') throw new ApiFailure('Invalid GLB model.');
    if ($extension === 'gltf') {
        if (filesize($temporary) > 20 * 1024 * 1024) throw new ApiFailure('Use GLB for models larger than 20 MB.');
        $model = json_decode(file_get_contents($temporary), true, 64, JSON_THROW_ON_ERROR);
        if (($model['asset']['version'] ?? '') !== '2.0') throw new ApiFailure('Only GLTF 2.0 is supported.');
        foreach ([...($model['buffers'] ?? []), ...($model['images'] ?? [])] as $resource) {
            if (isset($resource['uri']) && !str_starts_with($resource['uri'], 'data:')) throw new ApiFailure('GLTF must embed its resources; use GLB for bundled models.');
        }
    }
}

function uploadMedia(PDO $db, array $config, ?array $user): array
{
    if (!$user) throw new ApiFailure('Please sign in.', 401);
    $permitted = false;
    foreach (['projects', 'team', 'awards', 'blog', 'settings'] as $permission) $permitted = $permitted || can($user, $permission);
    if (!$permitted) throw new ApiFailure('Permission denied.', 403);
    rateLimit($db, 'upload', $user['id'], 100, 3600);
    if (($_POST['bucket'] ?? '') !== 'project-images') throw new ApiFailure('Invalid media bucket.');
    $path = $_POST['path'] ?? '';
    if (!is_string($path) || strlen($path) > 200 || !preg_match('~^(?:3d-models/|showreel/)?[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$~D', $path)) throw new ApiFailure('Invalid media path.');
    $file = $_FILES['file'] ?? [];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'] ?? '')) throw new ApiFailure('Upload failed or exceeded the hosting limit.', 413);
    if ($file['size'] > 100 * 1024 * 1024 || $file['size'] < 1) throw new ApiFailure('Files must be between 1 byte and 100 MB.', 413);
    validateMedia($path, $file['tmp_name']);
    $root = rtrim($config['upload_root'], '/\\');
    $destination = $root . '/project-images/' . $path;
    if (!is_dir(dirname($destination)) && !mkdir(dirname($destination), 0755, true)) throw new ApiFailure('Upload storage unavailable.', 503);
    $output = @fopen($destination, 'x+b');
    if (!$output) throw new ApiFailure('This media path already exists or cannot be written.', 409);
    $source = fopen($file['tmp_name'], 'rb');
    try {
        $written = stream_copy_to_stream($source, $output);
        if ($written !== $file['size']) { unlink($destination); throw new ApiFailure('Upload could not be saved.', 503); }
    } finally { fclose($source); fclose($output); }
    chmod($destination, 0644);
    return ['path' => $path];
}