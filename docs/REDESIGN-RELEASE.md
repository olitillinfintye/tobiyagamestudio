# Tobiya Redesign Release

Release: `frontend-20260908T020000Z`, deployed to https://tobiyastudio.com/.

## Restoration Status (2026-09-19)

At the user's request, the local public frontend has been restored to the pre-redesign version from `5291597`, retaining the project dialog's accessibility labels. The original navigation, theme toggle, hero statistics, 3D presentation, section layouts, and blog styling are active again. Redesign drafts and their unused stylesheet and reflection hook remain available for reference.

The production build, TypeScript check, all 12 frontend tests, and desktop/mobile browser checks passed. The CMS, backend, uploads, and database were not changed.

The live site was restored from the pre-redesign backup as `frontend-20260919T152309Z`. Its entrypoint is `/assets/index-BJ5lXvrK.js`. All four services and four awards remain present. Live desktop rendering, animated 3D pixels, image loading, mobile navigation, theme switching, and viewport overflow checks passed.

Before the switch, the current frontend was backed up to `/home/tobiyast/tobiya-cms/backups/frontend-20260919T152309Z/frontend.tar.gz` with permissions `0600`. The checksum-verified rollback helper ran once; its cron was removed, and the uploaded helper and lock were moved to the account trash. The private completion log remains at `/home/tobiyast/tobiya-cms/rollback-frontend-20260919T152309Z.log`. Only the existing mail-worker cron remains active.

The host's existing HTML cache policy is `Cache-Control: public, max-age=2592000`. A browser with the redesign cached may need a hard refresh (`Ctrl+F5`). A fresh request and a cache-reloading request both return the restored site. No hosting cache configuration was changed. The remaining sections describe the historical redesign deployment.

## Historical Release

The public React site now uses the approved white, navy, and restrained red direction. CMS content remains connected, including the four services and four awards supplied by the studio. Admin styling and the private PHP backend were not replaced.

## Interaction

- Full-width Three.js headset scene with pointer tracking, floating motion, and a pause/resume control. Rendering pauses when the hero leaves the viewport.
- Static artwork remains available while loading, after a scene error, and for reduced-motion users.
- Staggered hero entrance, scroll-triggered section and card reveals, scroll progress, hover feedback, and mobile navigation with Escape handling and focus wrapping.
- Contact validation, submissions, project dialogs, and CMS showreel configuration remain connected. The showreel control appears only when a URL is configured.

Nexa Heavy is used when installed locally. Licensed webfont files were not present in the repository; missing Nexa weights use the brand's approved system fallback stack. Supply licensed webfonts for consistent typography on all devices.

## Verification

- Production build, TypeScript check, eight existing frontend tests, and Bash deployment syntax passed.
- Layout checks at 320, 390, 768, 1440, and 1920 pixels found no text or document overflow.
- Local desktop/mobile canvas-pixel checks confirmed nonblank geometry; frame samples confirmed movement. Pause control, mobile drawer, scroll reveal, contact validation, reduced-motion behavior, and failed-model artwork fallback passed.
- Live release entrypoint `/assets/index-CNVmq1S4.js` returns 200. A visible production tab initialized 3D successfully; mobile canvas contained rendered pixels. All four services and awards load, and authenticated admin navigation remains available.
- The integrated browser suspends rendering in hidden tabs. One combined live scroll-reveal check timed out after the tab became hidden; the visible local check passed. No live contact test message was sent during this frontend release.

## Deployment And Rollback

`scripts/deploy-frontend-cpanel.sh` accepts an archive containing only `index.html` and `assets/`, its SHA256 checksum, and a unique `frontend-...` release ID. Use it only for trusted frontend-only builds; backend changes require the full deployment procedure.

The archive checksum was verified on the server. Existing frontend files were backed up to `/home/tobiyast/tobiya-cms/backups/frontend-20260908T020000Z/frontend.tar.gz`. New hashed assets were copied before the HTML entrypoint was replaced. Old assets were preserved for active browser sessions. The database, uploads, API entrypoint, private configuration, and current backend symlink were untouched.

The one-time deployment cron and uploaded archive/script were removed after success. The permanent mail-worker cron remains. `scripts/rollback-frontend-cpanel.sh` accepts a source frontend backup ID and a new unique frontend release ID. It extracts the private backup into a private staging directory, backs up the current frontend, restores archived assets, and atomically replaces the public HTML entrypoint. Its Bash syntax and a disposable-site test covering backups, existing assets, backend files, uploads, configuration, and duplicate/invalid IDs passed. Do not restore database or uploads for this frontend-only rollback.

GitHub automatic publishing remains disabled/unverified. No Git commit or push was performed for this release. The existing large Three.js bundle warning and previously documented dependency audit findings remain.