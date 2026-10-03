<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/api.php';

$dsn = getenv('TOBIYA_TEST_DSN');
if (!$dsn || !preg_match('/(?:^mysql:|;)dbname=(?:[a-z0-9]+_)?tobiya_test(?:;|$)/D', $dsn)) throw new RuntimeException('Use a disposable tobiya_test database (an account prefix is allowed).');
$db = new PDO($dsn, getenv('TOBIYA_TEST_USER') ?: 'root', getenv('TOBIYA_TEST_PASSWORD') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
if (execute($db, 'SHOW TABLES')->fetch()) throw new RuntimeException('Test database must be empty.');
$db->exec(file_get_contents(dirname(__DIR__) . '/schema.sql'));
migrateSchema($db);
migrateSchema($db);
$passed = 0;
function verify(bool $condition, string $name): void {
    global $passed;
    if (!$condition) throw new RuntimeException($name);
    $passed++;
    echo "PASS: $name\n";
}
function denied(callable $operation, string $name): void {
    try { $operation(); } catch (ApiFailure $error) { verify(true, $name); return; }
    throw new RuntimeException($name);
}
$super = ['id' => uuid(), 'is_super_admin' => true, 'permissions' => []];
insertRow($db, 'cms_users', ['id' => $super['id'], 'email' => 'test@example.com', 'password_hash' => password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT), 'created_at' => gmdate('c')]);
insertRow($db, 'admin_users', ['id' => uuid(), 'user_id' => $super['id'], 'is_super_admin' => 1, 'created_at' => gmdate('c')]);
$post = queryContent($db, ['table' => 'blog_posts', 'operation' => 'insert', 'values' => ['title' => 'Draft', 'slug' => 'draft', 'content' => 'Test content', 'published' => false], 'cardinality' => 'one'], $super);
verify($post['published'] === false, 'Database booleans preserve false');
verify(queryContent($db, ['table' => 'blog_posts'], null) === [], 'Anonymous query hides drafts');
queryContent($db, ['table' => 'blog_posts', 'operation' => 'update', 'values' => ['published' => true], 'filters' => [['column' => 'id', 'operator' => 'eq', 'value' => $post['id']]]], $super);
verify(count(queryContent($db, ['table' => 'blog_posts'], null)) === 1, 'Published post becomes public');
$product = queryContent($db, ['table' => 'products', 'operation' => 'insert', 'values' => ['title' => 'Quest Game', 'slug' => 'quest-game', 'status' => 'draft', 'platforms' => ['Meta Quest'], 'store_links' => [['platform' => 'meta', 'url' => 'https://www.meta.com/experiences/1']]], 'cardinality' => 'one'], $super);
verify($product['platforms'] === ['Meta Quest'], 'Product platforms round-trip as a list');
verify(queryContent($db, ['table' => 'products'], null) === [], 'Anonymous query hides draft products');
queryContent($db, ['table' => 'products', 'operation' => 'update', 'values' => ['status' => 'published'], 'filters' => [['column' => 'id', 'operator' => 'eq', 'value' => $product['id']]]], $super);
verify(count(queryContent($db, ['table' => 'products'], null)) === 1, 'Published product becomes public');
verify(count(queryContent($db, ['table' => 'project_categories'], null)) === 4, 'Migration seeds default categories once');
queryContent($db, ['table' => 'project_categories', 'operation' => 'insert', 'values' => ['name' => 'Games', 'slug' => 'game', 'display_order' => 5]], $super);
$project = queryContent($db, ['table' => 'projects', 'operation' => 'insert', 'values' => ['title' => 'Runner', 'slug' => 'runner', 'category' => 'game', 'video_url' => 'https://youtu.be/abc', 'video_urls' => ['https://vimeo.com/1'], 'featured' => true], 'cardinality' => 'one'], $super);
verify($project['category'] === 'game' && $project['video_urls'] === ['https://vimeo.com/1'], 'Projects accept custom categories and extra videos');
denied(fn() => queryContent($db, ['table' => 'project_categories', 'operation' => 'insert', 'values' => ['name' => 'X', 'slug' => 'x']], null), 'Anonymous users cannot add categories');
queryContent($db, ['table' => 'site_settings', 'operation' => 'upsert', 'conflict' => 'key', 'values' => ['key' => 'hidden_sections', 'value' => '["objectives","blog"]']], $super);
denied(fn() => queryContent($db, ['table' => 'site_settings', 'operation' => 'upsert', 'conflict' => 'key', 'values' => ['key' => 'hidden_sections', 'value' => '["admin"]']], $super), 'Unknown sections cannot be hidden');
denied(fn() => queryContent($db, ['table' => 'blog_posts', 'operation' => 'delete'], $super), 'Unfiltered deletes rejected');
denied(fn() => queryContent($db, ['table' => 'blog_posts', 'columns' => 'id,(SELECT password_hash FROM cms_users)'], null), 'Projection injection rejected');
queryContent($db, ['table' => 'site_settings', 'operation' => 'upsert', 'conflict' => 'key', 'values' => ['key' => 'hero_3d_model', 'value' => '/models/test.glb']], $super);
denied(fn() => queryContent($db, ['table' => 'site_settings', 'operation' => 'update', 'values' => ['value' => 'javascript:alert(1)'], 'filters' => [['column' => 'key', 'operator' => 'eq', 'value' => 'hero_3d_model']]], $super), 'Settings updates validate merged values');
$created = manageUser($db, 'users-create', ['email' => 'editor@example.com', 'password' => bin2hex(random_bytes(16)), 'permissions' => ['blog']], $super);
$editor = ['id' => $created['user_id'], 'is_super_admin' => false, 'permissions' => ['blog']];
denied(fn() => manageUser($db, 'users-list', [], $editor), 'Editors cannot enumerate other accounts');
verify(count(queryContent($db, ['table' => 'admin_users'], $editor)) === 1, 'Editor sees only own membership');
denied(fn() => manageUser($db, 'users-delete', ['user_id' => $super['id']], $super), 'Own super-admin removal rejected');
denied(fn() => manageUser($db, 'users-update', [], $super), 'Missing user identifiers rejected');
$submission = dispatch($db, [], 'contact', ['name' => 'Test Person', 'email' => 'sender@example.com', 'subject' => 'Project request', 'message' => str_repeat('Project details ', 3)], null);
verify(isset($submission['id']), 'Contact submission saved');
denied(fn() => queryContent($db, ['table' => 'contact_submissions'], null), 'Private inquiries are not public');
rateLimit($db, 'test', 'local', 1, 60);
denied(fn() => rateLimit($db, 'test', 'local', 1, 60), 'Persistent rate limit enforced');
manageUser($db, 'users-delete', ['user_id' => $editor['id']], $super);
verify((int) execute($db, 'SELECT COUNT(*) FROM admin_permissions WHERE user_id = ?', [$editor['id']])->fetchColumn() === 0, 'Deleting user cascades permissions');
echo "$passed integration checks passed.\n";