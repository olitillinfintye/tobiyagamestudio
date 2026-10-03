#!/usr/bin/env bash
set -euo pipefail
umask 077

archive="${1:?Frontend archive required}"
checksum="${2:?SHA256 checksum required}"
release_id="${3:?Unique frontend release ID required}"
[[ "$release_id" =~ ^frontend-[0-9TZ-]+$ ]] || exit 1
[[ "$checksum" =~ ^[a-fA-F0-9]{64}$ ]] || exit 1
private="$HOME/tobiya-cms"
destination="$HOME/public_html"
release="$private/releases/$release_id"
backup="$private/backups/$release_id"

test -f "$private/current/api.php"
test -f "$destination/index.html"
test ! -e "$release"
printf '%s  %s\n' "$checksum" "$archive" | sha256sum -c -
mkdir -p "$release" "$backup"
unzip -q "$archive" -d "$release"
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
echo "DEPLOYED $release_id"
echo "Frontend backup: $backup/frontend.tar.gz"