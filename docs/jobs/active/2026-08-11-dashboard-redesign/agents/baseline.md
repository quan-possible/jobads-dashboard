# Gate 0 baseline evidence

Captured 2026-08-11 at 19:15–19:24 MDT from the isolated worktree
`/Users/brucenguyen/.codex/worktrees/jobads-dashboard-redesign`. This record is
evidence only; no service, LaunchAgent, tunnel, deployment, remote ref, or
runtime configuration was changed.

## Repository and rollback identity

Commands: `git status --porcelain=v2 --branch`; `git branch -vv`; `git remote -v`;
`git rev-parse HEAD main origin/main`; `git rev-list --left-right --count HEAD...origin/main`.

- Worktree branch: `codex/dashboard-redesign-production` at `9152919ab49ac1417cd9e3200d9019088c20f8d6` (`docs: plan production dashboard redesign`).
- `main` resolves to the same `9152919a`; `origin/main` is `98edbe04c93f4e23d3d43425bc08daa18eab8b8e` (`Record new design as canonical main`). The worktree is **3 commits ahead, 0 behind**, not the stale “two commits ahead” wording in `JOB.md`.
- A reproducible rollback candidate for the redesign branch is `98edbe04` (the current remote-main tip). The older local recovery ref is `backup/main-pre-new-design-20260811-3b037d7d`.
- The worktree was not clean at entry: inherited modified `docs/jobs/active/2026-08-11-dashboard-redesign/JOB.md` and untracked `shared.md`, `agents/mobile-references.md`, and `evidence/` content were present. These were preserved and not edited.
- The canonical `/Volumes/ACLMR/jobads-dashboard` worktree is also dirty only in user-owned `AGENTS.md`, at the same `9152919a` commit.

## Local public topology

Commands: `curl` checks against the documented ports and route inventory.

- `http://127.0.0.1:8522/healthz` → `200`, `{"status":"ok","service":"web"}`.
- `http://127.0.0.1:8530/health` → `200`, `{"status":"ok"}`.
- `http://127.0.0.1:8522/api/auth` and `http://127.0.0.1:8530/api/auth` → `200`, `{"authenticated":false,"configured":true}`. No credential material was requested or exposed.
- All nine web routes returned `200`: `/`, `/geography`, `/occupations`, `/industries`, `/wages`, `/skills`, `/method`, `/developers`, and `/explore`; `/healthz` also returned `200`.
- Representative API surface was reachable: `/api/meta`, `/api/overview`, `/api/figures`, `/api/openapi.json`, and `/api/figure/pulse.demand_ribbon` returned `200`; protected `/api/postings` and `/api/explore/figure?...` correctly returned `401` without a session.
- Listener/process inspection showed the existing `com.aclmr.jobads-dashboard-public` topology: Next on `127.0.0.1:8522`, FastAPI on `127.0.0.1:8530`; no restart was performed.

## Build identity and pre-change verification

- `web/.next/BUILD_ID` was absent in the clean redesign worktree before the build and absent again after generated output cleanup. The currently running canonical local service has `/Volumes/ACLMR/jobads-dashboard/web/.next/BUILD_ID` = `v7zgJfywJYTW-kDsDSSx-` (mtime `2026-08-11T15:11:00-0600`); this is a separate deployed-runtime artifact, not proof of the redesign worktree bundle.
- Python dependencies were available through `/Volumes/ACLMR/jobads-dashboard/.venv`. `PYTHONPATH=src /Volumes/ACLMR/jobads-dashboard/.venv/bin/python -m pytest -q` passed: **348 passed, 1 warning** in 68.31 seconds.
- Node dependencies were available only in the canonical checkout. A temporary symlink from `web/node_modules` to `/Volumes/ACLMR/jobads-dashboard/web/node_modules` was used for the check and removed afterward. `npm --prefix web run build -- --webpack` passed with Next.js 16.2.9 (compile, TypeScript, static generation, and route optimization all completed). The default Turbopack build was not usable through that temporary external symlink (`Symlink [project]/node_modules is invalid`); no source change was made. A generated `.next` directory was moved to `/tmp` after the successful check, leaving no build artifact in the worktree.

## Cloudflare quick tunnel

Source: `/Users/brucenguyen/jobads-dashboard-logs/cloudflared-launchd.err.log`; the
latest hostname-bearing creation entry was `https://topics-marion-although-restore.trycloudflare.com`
(2026-08-10 06:52:56Z). Live check at capture time:

- `https://topics-marion-although-restore.trycloudflare.com/healthz` → `200`, `{"status":"ok","service":"web"}` (Cloudflare edge, dynamic response).

The hostname is ephemeral; the log and live response are the authority rather
than older URLs. No tunnel restart or mutation was attempted.

## Render/publication check

- `render.yaml` declares service `jobads-dashboard`, Docker runtime, `branch: main`, `healthCheckPath: /healthz`, and `autoDeployTrigger: commit`.
- The installed Render CLI is v2.15.0, but `render whoami` reported `unauthorized` and `render services --output json` reported an expired token. No login, service mutation, deploy, or restart was attempted.
- The discoverable hostname `https://jobads-dashboard.onrender.com` is reachable, but it is **not the current Next.js/FastAPI bundle**: `/healthz` returned plain-text `ok` (`text/html`) and `/` and `/api/auth` returned Streamlit HTML. This conflicts with the repository's current `render.yaml` and local topology, so the active Render service/auto-deploy state is unresolved and must not be treated as an authoritative redesign baseline.

## Gate 0 verdict

**NOT PASSED / publication-blocked.** The local base commit, rollback candidate,
local health/auth responses, route reachability, quick-tunnel hostname, and
pre-change Python/build checks are recorded. Gate 0 cannot be declared passed
because the documented production credential owner is unavailable (`security
find-generic-password -a jobads-dashboard-public -s jobads-dashboard-public-password -w`
exited **44**) and the reachable Render endpoint demonstrably serves an older
Streamlit deployment while its authenticated service inventory is unavailable.
The current local services remain healthy and untouched; resolving the Render
publication boundary and restoring/confirming the Keychain source are required
before production-auth verification or cutover.
