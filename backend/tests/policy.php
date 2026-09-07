<?php
require dirname(__DIR__) . '/policy.php';

function check(bool $condition, string $name): void
{
    if (!$condition) throw new RuntimeException($name);
    echo "PASS: $name\n";
}
function rejects(callable $action, string $name): void
{
    try { $action(); } catch (ApiFailure) { check(true, $name); return; }
    throw new RuntimeException($name);
}
$editor = ['id' => uuid(), 'is_super_admin' => false, 'permissions' => ['blog']];
check(readPolicy('blog_posts', null)[0]['value'] === true, 'Anonymous visitors cannot read drafts');
check(readPolicy('blog_posts', $editor) === [], 'Blog editor can read drafts');
check(!in_array('notification_recipients', readPolicy('site_settings', null)[0]['value'], true), 'Notification recipients are private');
check(readPolicy('admin_users', $editor)[0]['value'] === $editor['id'], 'Non-super admins only read own membership');
rejects(fn() => readPolicy('contact_submissions', null), 'Contact messages are private');
rejects(fn() => authorizeWrite('projects', $editor), 'Permission enforced per resource');
rejects(fn() => authorizeWrite('admin_users', ['is_super_admin' => true, 'permissions' => []]), 'Generic role mutation forbidden');
rejects(fn() => validateRow('projects', ['id' => uuid()]), 'Cannot overwrite primary keys');
rejects(fn() => validateRow('projects', ['password_hash' => 'x']), 'Unknown columns rejected');
rejects(fn() => validateValue('url', 'javascript:alert(1)'), 'Script URLs rejected');
rejects(fn() => validateValue('url', '//example.com'), 'Protocol-relative URLs rejected');
rejects(fn() => validateValue('bool', 'false'), 'Boolean strings rejected');
rejects(fn() => validateContact(['name' => 'Name', 'email' => 'bad', 'subject' => 'Hello', 'message' => str_repeat('a', 20)]), 'Invalid contact email rejected');
check(validateValue('url', '/uploads/project-images/demo.png') !== null, 'Local media URLs accepted');
check(validateValue('strings', ['Unity', 'C#']) === '["Unity","C#"]', 'Array values preserve JSON');
check(validateContact(['name' => ' Name ', 'email' => 'test@example.com', 'subject' => 'Hello', 'message' => str_repeat('a', 20)])['name'] === 'Name', 'Contact validation trims fields');