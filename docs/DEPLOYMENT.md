# Deployment

The site is a static Vite build with Supabase as its backend. It is served from
cPanel shared hosting at `tobiyastudio.com`.

## Why the server pulls instead of GitHub pushing

Two push-based approaches were tried against this host and both failed:

| Method | Port | Result |
|---|---|---|
| `appleboy/scp-action` (SCP over SSH) | 22 | `connection refused` — the host runs no SSH |
| `SamKirkland/FTP-Deploy-Action` (FTPS) | 21 | `Timeout (control socket)` |

Port 21 answers instantly from an ordinary connection — a probe returns
`220 Welcome to Pure-FTPd [privsep] [TLS]` and `AUTH TLS` is accepted with `234`.
It only times out from GitHub's runners. Meanwhile port 22 returns *refused*
rather than timing out, which proves the runner's packets do reach the host. A
port that is refused on 22 but silently dropped on 21 is a firewall filtering by
source IP — standard CSF behaviour on cPanel hosts (this one is
`core.etsecureserver.com`, Hetzner Finland).

Opening port 21 to GitHub Actions would mean allowlisting thousands of rotating
Azure CIDRs, plus the passive data-port range. **Outbound** connections from the
server are not filtered, so the server pulls instead.

```
push to main ──▶ GitHub Actions ──▶ builds site ──▶ force-pushes to `deploy` branch
                                                                │
                          cPanel git pull ◀───────────────────────┘
                                  │
                                  └─▶ copies dist/ into public_html
```

The `deploy` branch is an **orphan** branch holding only the built site plus
`.cpanel.yml` — no source history, so it stays small however often you deploy.

## One-time cPanel setup

### 1. Create the repository

cPanel → **Git™ Version Control** → *Create*:

| Field | Value |
|---|---|
| Clone a Repository | **On** |
| Clone URL | `https://github.com/olitillinfintye/tobiyagamestudio.git` |
| Repository Path | `repositories/tobiyagamestudio` |
| Repository Name | `tobiyagamestudio` |

The repo is public, so no credentials are needed.

### 2. Point it at the `deploy` branch

Push to `main` once first so the `deploy` branch exists. Then in cPanel →
**Manage** the repository → set the checked-out branch to `deploy`.

> The `deploy` branch carries the built site. `main` carries source, and the
> server has no Node.js to build it.

### 3. Deploy

**Manually:** cPanel → Git Version Control → *Manage* → **Update from Remote**,
then **Deploy HEAD Commit**. This runs `.cpanel.yml`, which copies `dist/` into
`public_html`.

**Automatically (recommended):** cPanel → **Cron Jobs**, every 5 minutes:

```bash
cd $HOME/repositories/tobiyagamestudio && /usr/local/cpanel/3rdparty/bin/git fetch origin deploy --quiet && /usr/local/cpanel/3rdparty/bin/git reset --hard origin/deploy --quiet && /bin/cp -R ./dist/. $HOME/public_html/
```

This needs no inbound connection at all, so the firewall is irrelevant. If the
git binary is elsewhere, find it with `which git` in cPanel's Terminal (if
available) and substitute the path.

### 4. Optional — immediate deploys instead of waiting for cron

Only worth doing if port 2083 is reachable from GitHub's runners. The
`Connectivity report` step at the end of each workflow run tells you: look for
`port 2083: OPEN`.

If it is open, create a cPanel API token (cPanel → **Manage API Tokens**) and add
these GitHub repository secrets:

| Secret | Value |
|---|---|
| `CPANEL_HOST` | `tobiyastudio.com` |
| `CPANEL_USER` | your cPanel username (not the FTP login) |
| `CPANEL_API_TOKEN` | the token you generated |
| `CPANEL_REPO_ROOT` | `repositories/tobiyagamestudio` |

The workflow then triggers the deployment directly. It soft-fails, so a blocked
port can never fail an otherwise good build — the cron still catches it.

## Required GitHub secrets

| Secret | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Baked into the build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Baked into the build |

Both are **mandatory**. Vite inlines `VITE_*` at build time and
`src/integrations/supabase/client.ts` has no fallback — `createClient(undefined,
undefined)` throws `supabaseUrl is required` at module load. A missing secret
would produce a build that passes CI and then white-screens in production, so
the workflow fails up front if either is absent.

`ftp_password` is no longer used and can be deleted.

## SPA routing

`public/.htaccess` rewrites unmatched paths to `index.html` so `/admin` and
`/blog/:slug` work on direct load. Vite copies it into `dist/`, and the workflow
fails the build if it is missing. `.cpanel.yml` uses `cp -R ./dist/.` — the
trailing `/.` is what copies dotfiles, so do not simplify it to `./dist/*`.

## Troubleshooting

**Site does not update after a push.** Check the `deploy` branch on GitHub for a
fresh commit. If it is there, the problem is server-side: run the cron command
manually and read its output.

**Deep links 404 but the homepage works.** `.htaccess` did not reach
`public_html`. Confirm `dist/.htaccess` exists on the `deploy` branch.

**Old assets linger in `public_html`.** `cp -R` overwrites but never deletes.
Hashed filenames make stale files harmless, but to clean up, swap the cron's `cp`
for `rsync -a --delete ./dist/ $HOME/public_html/` — verify `rsync` exists first,
and note `--delete` will remove anything in `public_html` not in the build.
