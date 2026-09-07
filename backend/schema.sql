CREATE TABLE IF NOT EXISTS cms_users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    session_version INT NOT NULL DEFAULT 1,
    created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS admin_users (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at VARCHAR(32) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS admin_permissions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    permission VARCHAR(32) NOT NULL,
    created_at VARCHAR(32) NOT NULL,
    UNIQUE (user_id, permission),
    FOREIGN KEY (user_id) REFERENCES admin_users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS projects (
    id CHAR(36) PRIMARY KEY, title VARCHAR(500) NOT NULL, slug VARCHAR(500) NOT NULL UNIQUE,
    category ENUM('vr','ar','interactive','award') NOT NULL DEFAULT 'interactive',
    short_description TEXT, full_description MEDIUMTEXT, cover_image_url TEXT,
    gallery_images JSON, tools_used JSON, video_url TEXT, project_link TEXT,
    featured BOOLEAN DEFAULT FALSE, display_order INT DEFAULT 0,
    created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS team_members (
    id CHAR(36) PRIMARY KEY, name VARCHAR(500) NOT NULL, role VARCHAR(500) NOT NULL,
    bio TEXT, photo_url TEXT, linkedin_url TEXT, twitter_url TEXT, social_links JSON,
    display_order INT DEFAULT 0, created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS awards (
    id CHAR(36) PRIMARY KEY, title VARCHAR(500) NOT NULL, description TEXT,
    image_url TEXT, year INT, display_order INT DEFAULT 0, created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS blog_posts (
    id CHAR(36) PRIMARY KEY, title VARCHAR(500) NOT NULL, slug VARCHAR(500) NOT NULL UNIQUE,
    content MEDIUMTEXT NOT NULL, excerpt TEXT, cover_image_url TEXT,
    author_name VARCHAR(500) NOT NULL DEFAULT 'Tobiya Studio', category VARCHAR(500),
    published BOOLEAN NOT NULL DEFAULT FALSE, published_at VARCHAR(32),
    created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS services (
    id CHAR(36) PRIMARY KEY, title VARCHAR(500) NOT NULL, description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL DEFAULT 'Gamepad2', features JSON, display_order INT DEFAULT 0,
    created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS partners (
    id CHAR(36) PRIMARY KEY, name VARCHAR(500) NOT NULL, logo_url TEXT NOT NULL,
    website_url TEXT, is_active BOOLEAN DEFAULT TRUE, display_order INT DEFAULT 0,
    created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS site_settings (
    id CHAR(36) PRIMARY KEY, `key` VARCHAR(100) NOT NULL UNIQUE,
    value MEDIUMTEXT NOT NULL, label VARCHAR(500),
    created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS contact_submissions (
    id CHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(200) NOT NULL,
    subject VARCHAR(150) NOT NULL, message TEXT NOT NULL,
    `read` BOOLEAN DEFAULT FALSE, notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cms_rate_limits (
    bucket CHAR(64) PRIMARY KEY, hits INT NOT NULL, expires_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cms_reset_tokens (
    token_hash CHAR(64) PRIMARY KEY, user_id CHAR(36) NOT NULL, expires_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES cms_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS cms_mail_queue (
    id CHAR(36) PRIMARY KEY, recipient VARCHAR(200) NOT NULL, subject VARCHAR(500) NOT NULL,
    body MEDIUMTEXT NOT NULL, attempts INT NOT NULL DEFAULT 0, available_at BIGINT NOT NULL,
    submission_id CHAR(36), created_at BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;