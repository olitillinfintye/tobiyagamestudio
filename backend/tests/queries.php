<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/database.php';

$db = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$db->exec('CREATE TABLE blog_posts (id TEXT PRIMARY KEY, title TEXT, slug TEXT, content TEXT, excerpt TEXT, cover_image_url TEXT, author_name TEXT, category TEXT, published INTEGER DEFAULT 0, published_at TEXT, created_at TEXT, updated_at TEXT)');
$db->exec('CREATE TABLE site_settings (id TEXT PRIMARY KEY, `key` TEXT UNIQUE, value TEXT, label TEXT, created_at TEXT, updated_at TEXT)');
$super = ['id' => uuid(), 'is_super_admin' => true, 'permissions' => []];
function checkQuery(bool $condition, string $name): void {
    if (!$condition) throw new RuntimeException($name);
    echo "PASS: $name\n";
}
function rejectQuery(callable $operation, string $name): void {
    try { $operation(); } catch (ApiFailure $error) { checkQuery(true, $name); return; }
    throw new RuntimeException($name);
}
$post = queryContent($db, ['table' => 'blog_posts', 'operation' => 'insert', 'values' => ['title' => 'Draft', 'slug' => 'draft', 'content' => '<p>Content</p>', 'published' => false], 'cardinality' => 'one'], $super);
checkQuery($post['published'] === false, 'Insert and hydration preserve false');
checkQuery(queryContent($db, ['table' => 'blog_posts'], null) === [], 'Anonymous SQL reads hide drafts');
queryContent($db, ['table' => 'blog_posts', 'operation' => 'update', 'values' => ['published' => true], 'filters' => [['column' => 'id', 'operator' => 'eq', 'value' => $post['id']]]], $super);
checkQuery(count(queryContent($db, ['table' => 'blog_posts'], null)) === 1, 'Publishing changes public visibility');
rejectQuery(fn() => queryContent($db, ['table' => 'blog_posts', 'operation' => 'delete'], $super), 'Unbounded deletion rejected');
rejectQuery(fn() => queryContent($db, ['table' => 'blog_posts', 'columns' => 'id; DROP TABLE blog_posts'], null), 'SQL projection injection rejected');
rejectQuery(fn() => queryContent($db, ['table' => 'blog_posts', 'cardinality' => 'invalid'], null), 'Unknown cardinality rejected');
queryContent($db, ['table' => 'site_settings', 'operation' => 'insert', 'values' => ['key' => 'notification_recipients', 'value' => '["admin@example.com"]']], $super);
checkQuery(queryContent($db, ['table' => 'site_settings'], null) === [], 'Private settings filtered by SQL');
queryContent($db, ['table' => 'site_settings', 'operation' => 'insert', 'values' => ['key' => 'hero_3d_model', 'value' => '/models/test.glb']], $super);
rejectQuery(fn() => queryContent($db, ['table' => 'site_settings', 'operation' => 'update', 'values' => ['value' => 'javascript:alert(1)'], 'filters' => [['column' => 'key', 'operator' => 'eq', 'value' => 'hero_3d_model']]], $super), 'Updating a setting cannot bypass URL validation');