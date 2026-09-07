<?php
declare(strict_types=1);

final class ApiFailure extends RuntimeException
{
    public function __construct(string $message, public int $status = 400, public string $errorCode = 'invalid_request')
    {
        parent::__construct($message);
    }
}

function tables(): array
{
    $base = ['id' => 'id', 'created_at' => 'date'];
    $updated = $base + ['updated_at' => 'date'];
    return [
        'projects' => $updated + ['title' => 'short', 'slug' => 'slug', 'category' => 'category', 'short_description' => 'text', 'full_description' => 'html', 'cover_image_url' => 'url', 'gallery_images' => 'urls', 'tools_used' => 'strings', 'video_url' => 'url', 'project_link' => 'url', 'featured' => 'bool', 'display_order' => 'int'],
        'team_members' => $base + ['name' => 'short', 'role' => 'short', 'bio' => 'text', 'photo_url' => 'url', 'linkedin_url' => 'url', 'twitter_url' => 'url', 'social_links' => 'social', 'display_order' => 'int'],
        'awards' => $base + ['title' => 'short', 'description' => 'text', 'image_url' => 'url', 'year' => 'int', 'display_order' => 'int'],
        'blog_posts' => $updated + ['title' => 'short', 'slug' => 'slug', 'content' => 'html', 'excerpt' => 'text', 'cover_image_url' => 'url', 'author_name' => 'short', 'category' => 'short', 'published' => 'bool', 'published_at' => 'date'],
        'services' => $updated + ['title' => 'short', 'description' => 'text', 'icon' => 'short', 'features' => 'strings', 'display_order' => 'int'],
        'partners' => $updated + ['name' => 'short', 'logo_url' => 'url', 'website_url' => 'url', 'is_active' => 'bool', 'display_order' => 'int'],
        'site_settings' => $updated + ['key' => 'key', 'value' => 'text', 'label' => 'short'],
        'contact_submissions' => $base + ['name' => 'short', 'email' => 'email', 'subject' => 'short', 'message' => 'text', 'read' => 'bool', 'notification_sent' => 'bool'],
        'admin_users' => $base + ['user_id' => 'id', 'is_super_admin' => 'bool'],
        'admin_permissions' => $base + ['user_id' => 'id', 'permission' => 'permission'],
    ];
}

function permissions(): array
{
    return ['messages', 'blog', 'projects', 'team', 'awards', 'settings', 'analytics', 'users', 'services'];
}

function publicSettings(): array
{
    return ['hero_projects', 'hero_team_members', 'hero_awards', 'hero_years', 'hero_3d_model', 'showreel_video_url', 'social_links', 'contact_email', 'contact_phone', 'contact_location', 'contact_website'];
}

function can(?array $user, string $permission): bool
{
    return $user !== null && ($user['is_super_admin'] || in_array($permission, $user['permissions'], true));
}

function tablePermission(string $table): string
{
    return ['projects' => 'projects', 'team_members' => 'team', 'awards' => 'awards', 'blog_posts' => 'blog', 'services' => 'services', 'partners' => 'settings', 'site_settings' => 'settings', 'contact_submissions' => 'messages', 'admin_users' => 'users', 'admin_permissions' => 'users'][$table] ?? throw new ApiFailure('Unknown resource.');
}

function validateValue(string $type, mixed $value): mixed
{
    if ($value === null) return null;
    if ($type === 'bool') {
        if (!is_bool($value)) throw new ApiFailure('Expected a boolean.');
        return (int) $value;
    }
    if ($type === 'int') {
        if (!is_int($value) || abs($value) > 2147483647) throw new ApiFailure('Expected an integer.');
        return $value;
    }
    if (in_array($type, ['strings', 'urls', 'social'], true)) {
        if (!is_array($value) || count($value) > 100) throw new ApiFailure('Invalid list.');
        if ($type !== 'social' && !array_is_list($value)) throw new ApiFailure('Expected a list.');
        foreach ($value as $item) {
            if ($type === 'social') {
                if (!is_array($item) || !isset($item['platform'], $item['url'])) throw new ApiFailure('Invalid social link.');
                validateValue('short', $item['platform']);
                if (($item['platform'] ?? '') === 'email' && str_starts_with($item['url'], 'mailto:')) validateValue('email', substr($item['url'], 7));
                else validateValue('url', $item['url']);
            } else validateValue($type === 'urls' ? 'url' : 'short', $item);
        }
        return json_encode($value, JSON_THROW_ON_ERROR);
    }
    if (!is_string($value)) throw new ApiFailure('Expected text.');
    $max = match ($type) { 'html' => 1000000, 'text' => 65535, 'url' => 2048, 'email' => 200, 'key' => 100, 'date' => 32, default => 500 };
    if (strlen($value) > $max || str_contains($value, "\0")) throw new ApiFailure('Text is too long or invalid.');
    $valid = match ($type) {
        'url' => $value === '' || preg_match('~^/(?!/)[^\s\\\\]*$~D', $value) || (filter_var($value, FILTER_VALIDATE_URL) && in_array(strtolower((string) parse_url($value, PHP_URL_SCHEME)), ['https', 'http'], true)),
        'email' => filter_var($value, FILTER_VALIDATE_EMAIL),
        'id' => preg_match('/^[a-f0-9-]{36}$/Di', $value),
        'slug' => preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $value),
        'key' => in_array($value, [...publicSettings(), 'notification_recipients'], true),
        'category' => in_array($value, ['vr', 'ar', 'interactive', 'award'], true),
        'permission' => in_array($value, permissions(), true),
        'date' => $value === '' || strtotime($value) !== false,
        default => true,
    };
    if (!$valid) throw new ApiFailure('Invalid ' . $type . ' value.');
    return $value;
}

function validateRow(string $table, array $row, bool $import = false): array
{
    $fields = tables()[$table] ?? throw new ApiFailure('Unknown resource.');
    if (!$row || array_is_list($row)) throw new ApiFailure('Expected a record.');
    $result = [];
    foreach ($row as $column => $value) {
        if (!isset($fields[$column])) throw new ApiFailure('Unknown field.');
        if (!$import && in_array($column, ['id', 'created_at', 'updated_at', 'notification_sent', 'user_id'], true)) throw new ApiFailure('Read-only field.');
        $result[$column] = validateValue($fields[$column], $value);
    }
    return $result;
}

function readPolicy(string $table, ?array $user): array
{
    if (!isset(tables()[$table])) throw new ApiFailure('Unknown resource.');
    if (in_array($table, ['admin_users', 'admin_permissions'], true)) {
        if (!$user) throw new ApiFailure('Please sign in.', 401);
        return $user['is_super_admin'] ? [] : [['column' => 'user_id', 'operator' => 'eq', 'value' => $user['id']]];
    }
    if ($table === 'contact_submissions' && !can($user, 'messages')) throw new ApiFailure('Permission denied.', $user ? 403 : 401);
    if ($table === 'blog_posts' && !can($user, 'blog')) return [['column' => 'published', 'operator' => 'eq', 'value' => true]];
    if ($table === 'partners' && !can($user, 'settings')) return [['column' => 'is_active', 'operator' => 'eq', 'value' => true]];
    if ($table === 'site_settings' && !can($user, 'settings')) return [['column' => 'key', 'operator' => 'in', 'value' => publicSettings()]];
    return [];
}

function authorizeWrite(string $table, ?array $user): void
{
    if (in_array($table, ['admin_users', 'admin_permissions', 'contact_submissions'], true)) throw new ApiFailure('Use the dedicated endpoint.', 403);
    if (!can($user, tablePermission($table))) throw new ApiFailure('Permission denied.', $user ? 403 : 401);
}

function validateContact(array $input): array
{
    $output = [];
    foreach (['name' => [2, 100], 'email' => [3, 200], 'subject' => [3, 150], 'message' => [20, 4000]] as $field => [$minimum, $maximum]) {
        if (!is_string($input[$field] ?? null)) throw new ApiFailure('Invalid contact fields.');
        $value = trim($input[$field]);
        if (mb_strlen($value) < $minimum || mb_strlen($value) > $maximum) throw new ApiFailure('Invalid ' . $field . ' length.');
        $output[$field] = $value;
    }
    validateValue('email', $output['email']);
    return $output;
}

function uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
}