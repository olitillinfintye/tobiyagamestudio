# cPanel CMS Migration

Status: a fresh cPanel installation is deployed at https://tobiyastudio.com with 14 MariaDB tables and no imported Supabase content. The live API connection, anonymous read restrictions and CSRF checks passed. Initial admin password setup and SMTP delivery acceptance remain outstanding. GitHub automatic deployment has not been enabled or verified.

## Architecture

React uses a same-origin PHP API at `/api/index.php`. MariaDB holds CMS data, PHP sessions authenticate admins, and uploaded media lives under `/uploads`. Only the small API entrypoint belongs in the document root. Backend code, SMTP credentials, exports, and backups must remain outside it.

Requirements: PHP 8.4 with PDO MySQL, fileinfo, mbstring and OpenSSL; MariaDB 11.4; HTTPS; a working SMTP account; and cPanel Cron Jobs or a hosting-provider CLI facility. PHP Selector is not required. Visitor analytics are unavailable; the overview shows actual content, message, and mail-queue counts.

## Fresh Installation Without Data Import

Data import is optional. For a fresh CMS, create a dedicated empty database and user, install the schema, then bootstrap the initial admin. Leave existing Supabase data untouched. Never run the importer over a CMS that already contains new content.

For hosting without an interactive terminal, a one-time private Cron Job can run `php backend/console.php bootstrap-link ADMIN_EMAIL /home/ACCOUNT/tobiya-cms/admin-setup-link.txt` with `TOBIYA_CONFIG` pointing to the private configuration. The output file must be outside every document root. This creates an unusable random initial password and a single-use setup link valid for one hour; retrieve the link through authenticated cPanel File Manager, set your password in the website, then delete the private link file and cron entry. No public installer is needed. SMTP must still be configured and tested for subsequent password recovery and notifications.

## Local Development

1. Run `npm ci` and `composer install --working-dir=backend`.
2. Create an empty local MariaDB database. Copy `backend/config.example.php` to ignored `backend/config.php`, then enter database and SMTP settings directly in the editor. Set origin to `http://localhost:8080` and `secure_cookies` to false for local HTTP only. Use an absolute upload root ending in this workspace's `public/uploads`.
3. Run `php backend/console.php schema`.
4. Run `php backend/console.php bootstrap YOUR_EMAIL` only for a new empty CMS. Type the initial password directly into your own terminal, never into chat. Imported installations use password recovery instead.
5. Set `TOBIYA_BACKEND` to the absolute path of `backend/api.php`. Start `php -S 127.0.0.1:8081 -t public`, then `npm run dev`. Vite proxies API and uploads to PHP.

Never use the PHP development server on a public network. Passwords are 12-72 bytes; existing imported admins receive unusable random password hashes and must reset their passwords.

## Export and Import

1. Take a Supabase database backup, auth export, and full Storage backup first. Freeze content, admin changes, and contact writes for the final export. The JSON exporter is paginated, not a database snapshot, and downloads referenced public media only. Unreferenced media and other buckets need a separate Storage backup. Do not delete Supabase until those files are reconciled.
2. Create a private JSON configuration outside the repository containing `url` (Supabase HTTPS project URL) and `serviceRoleKey`. Enter the key directly in your editor. Never put it in a `VITE_*` variable, browser code, command arguments, Git, or chat.
3. Run `node scripts/export-supabase.mjs PRIVATE_CONFIG_PATH NEW_EXPORT_DIRECTORY`. Keep the output private: it contains inquiries, notification recipients, and admin identities. The exporter preserves IDs, rewrites referenced public Storage URLs, and writes row counts and SHA-256 checksums. It fails on inaccessible files and unexpected paths.
4. Create a separate staging database and user in cPanel, grant that user access only to that database, and use `utf8mb4`. Configure an HTTPS staging domain outside `public_html`. Do not reuse a production database.
5. Install the private backend and dependencies outside the staging document root. Place `config.php` beside the backend code, with the exact staging origin, staging database, staging upload root, secure cookies enabled, and SMTP settings. Restrict private directories and files to the account owner.
6. Run `php backend/console.php schema`, then `php backend/console.php import PRIVATE_EXPORT_DIRECTORY` through your hosting CLI or a one-time private Cron Job. Remove one-time cron entries afterwards. No public setup endpoint is provided. Import refuses a nonempty database and rolls back record changes on failure; schema DDL is separate and is not transactional.
7. The importer validates checksums and media types before inserting data. SVG, executables, and GLTF files with external resources are deliberately rejected. Convert/reconcile such files and regenerate the export; do not bypass validation.
8. Copy the verified export's uploads contents into the configured upload root. Preserve the supplied uploads `.htaccess`. Verify every manifest file's size/hash at the destination before proceeding.
9. Run the private mail worker once per minute using cPanel Cron Jobs: `/path/to/php /home/ACCOUNT/tobiya-cms/current/mail-worker.php`. Use private logs, never logs in `public_html`. Delivery is at least once; a crash after SMTP acceptance can cause duplicate mail. Jobs stop after eight failed attempts and remain visible as pending; inspect and resolve failures privately.

## Staging Acceptance

- Compare every source/export/import table count and IDs; inspect Unicode, nulls, arrays, rich text, drafts, settings, and private inquiries.
- Confirm all media references use the new host, including nested rich-text/settings URLs, 3D models, galleries and showreels. Check unreferenced Storage inventory separately.
- Verify anonymous users cannot read drafts, inactive partners, notification recipients, admin identities, or inquiries, and cannot mutate CMS data.
- Test login, logout, idle expiry, role revocation, password recovery delivery/single use/expiry, and atomic admin create/update/delete. Confirm the intended super-admin email from the exported identities before making account changes.
- Test content create/edit/delete, contact submission/rate limits, actual SMTP delivery and notification status, image/model/video uploads, mobile/desktop routes, and direct deep links.
- Confirm `.php`, SVG and HTML cannot execute from uploads, missing API paths do not return the SPA, and private config/exports/backups are unreachable over HTTP.
- Rehearse restoring the site files, private backend, database backup and uploads backup. Record a maintenance window for final write freeze and cutover.

## Production Release Gate

The GitHub workflow builds/tests but does not publish `deploy` until repository variable `CPANEL_MIGRATION_APPROVED` equals `true`. Leave it unset until staging acceptance is complete. This gate does not mean deployment has happened.

Before enabling it, place verified production settings at `/home/ACCOUNT/tobiya-cms/config.php` and create the private `MIGRATION_APPROVED` marker in that same directory. The cPanel deployment script requires both, packages backend code under private timestamped releases, switches the `current` symlink, and copies only the built frontend to `public_html`. It never clears uploads or migrates schemas automatically. Site-file backups exclude uploads; take separate database and upload backups before cutover. Copy deployment is not atomic, so use a maintenance window.

In cPanel Git Version Control, choose the `deploy` branch, update from remote, then deploy HEAD. An API deployment trigger alone does not prove cPanel fetched the latest commit. Verify the checked-out SHA against the GitHub build before deployment. Do not deploy `main` or use the legacy copy-only cron from the old deployment guide.

For rollback, disable publishing, restore the previous site-file backup and private backend symlink, then restore the matching database/uploads snapshots if needed. Keep the original Supabase site build and service available through acceptance. Do not restore an old database over newer writes without reconciling those writes first.

## Validation Commands

```sh
npx tsc --noEmit -p tsconfig.app.json
npm test
node --test scripts/export-supabase.test.mjs
php backend/tests/policy.php
composer audit --working-dir=backend
npm run build
```

Database integration tests require a disposable, empty `tobiya_test` database and `TOBIYA_TEST_DSN`, `TOBIYA_TEST_USER`, and `TOBIYA_TEST_PASSWORD`. Run `php backend/tests/integration.php`. Tests intentionally leave their database intact for inspection and refuse a nonempty database on rerun. CI provisions its own MariaDB service.