#!/usr/bin/env bash
set -euo pipefail
umask 077
private="$HOME/tobiya-cms"
destination="$HOME/public_html"
test -f "$private/config.php" || { echo 'Private CMS configuration missing; deployment stopped.'; exit 1; }
test -f "$private/MIGRATION_APPROVED" || { echo 'Migration has not been approved; deployment stopped.'; exit 1; }
test -f dist/api/index.php
test -f backend/vendor/autoload.php
release="$private/releases/$(date -u +%Y%m%dT%H%M%SZ)-$$"
backup="$private/backups/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$release" "$backup"
cp -R backend/. "$release/"
cp "$private/config.php" "$release/config.php"
if test -L "$private/current"; then readlink "$private/current" > "$backup/backend-target"; fi
if test -d "$destination"; then tar --exclude='./uploads' -czf "$backup/site.tar.gz" -C "$destination" .; fi
umask 022
mkdir -p "$destination"
ln -s "$release" "$private/current-next"
mv -Tf "$private/current-next" "$private/current"
cp -R dist/. "$destination/"
echo "Published site and private backend. Backup: $backup"