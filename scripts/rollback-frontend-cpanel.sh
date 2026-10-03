#!/usr/bin/env bash
set -euo pipefail
umask 077

source_id="${1:?Source frontend backup ID required}"
release_id="${2:?Unique frontend rollback ID required}"
[[ "$source_id" =~ ^frontend-[0-9TZ-]+$ ]] || exit 1
[[ "$release_id" =~ ^frontend-[0-9TZ-]+$ ]] || exit 1
private="$HOME/tobiya-cms"
destination="$HOME/public_html"
archive="$private/backups/$source_id/frontend.tar.gz"
release="$private/releases/$release_id"
backup="$private/backups/$release_id"

test -f "$private/current/api.php"
test -f "$destination/index.html"
test -f "$archive"
test ! -e "$release"
test ! -e "$backup"
mkdir -p "$release" "$backup"
tar -xzf "$archive" -C "$release" --no-same-owner --no-same-permissions index.html assets
test -f "$release/index.html"
test -d "$release/assets"
tar -czf "$backup/frontend.tar.gz" -C "$destination" index.html assets

umask 022
mkdir -p "$destination/assets"
find "$release/assets" -type d -exec chmod 755 {} +
find "$release/assets" -type f -exec chmod 644 {} +
cp -R "$release/assets/." "$destination/assets/"
install -m 644 "$release/index.html" "$destination/index.html.next"
mv -f "$destination/index.html.next" "$destination/index.html"
cmp "$release/index.html" "$destination/index.html"
echo "RESTORED $source_id AS $release_id"
echo "Frontend backup: $backup/frontend.tar.gz"
