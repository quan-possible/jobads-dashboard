# JOB — 2026-06-20 deep audit

**Status:** DONE — fixes implemented, merged to `main`, pushed, and redeployed (2026-06-20).
**Date:** 2026-06-20
**Type:** deep audit (defects + design-craft/UX); fixes applied (see Implementation below).

## Close-out (2026-06-20)
- Committed `01eacb4`, merged to `main` via `9ee4869` (`--no-ff`), **pushed** to `origin/main`.
- Post-merge gate on `main`: `py_compile` OK, `pytest -q` **34 passed**.
- **Redeployed**: `launchctl kickstart -k` of `com.aclmr.jobads-dashboard-public` (pid
  79917→27254), `/_stcore/health` `200`, gate page `200`. Serves the merged repo +
  `.streamlit/config.toml` (FIX-B). Tunnels left running (URLs preserved):
  ngrok `https://1ba0-2001-56a-f068-c900-1db6-5234-a48b-514f.ngrok-free.app`,
  cloudflared `https://invitation-discount-refuse-nonprofit.trycloudflare.com`.
- Deferred items (S23, S27, U02, U08, L06 residual edge-clip) recorded below; not blockers.

## Goal
Audit the `jobads-dashboard` Streamlit app on two fronts — (1) real defects across the
rendered UI, backend/data logic, and code correctness; (2) design-craft & UX-standards
quality — and write a concrete fix for every confirmed item. Adapted the `deep-audit`
skill (templated for the React "Prism" app) to this Python/Streamlit project: same four
phases and job-file structure, with Streamlit/pytest/preview substituted for
React/npm/Vite.

## Outcome
- **Defects: 31 confirmed + 2 uncertain** (0 HIGH, 11 MEDIUM, 20 LOW).
  - Static code (`S01–S25`, +S26/S27 uncertain): 9 MEDIUM, 16 LOW.
  - Live UI (`L01–L06`): 2 MEDIUM, 4 LOW.
- **Design-craft / UX (`U01–U09`)**: 1 P1, 4 P2, 4 P3.
- **10 candidates refuted** by the adversarial pass (+1 live false positive), recorded
  in `rejected.md` so they aren't re-litigated.

### Highest-value clusters (across both fronts)
1. **Wide-table overlap (L01)** — `table-layout: fixed` makes 6/10-column tables
   illegible (Geography local-areas, Occupations LQ heatmap, Explore results),
   catastrophic on mobile. One systemic fix (FIX-A).
2. **Dark-mode invisible metric labels (L02)** — white-on-white labels for any
   dark-color-scheme browser; one-line systemic fix (FIX-B: pin `color-scheme: light`).
3. **Security/injection batch (S01 LIKE escaping, S03 Markdown injection in posting
   detail, S02 no auth rate-limit, S04 unbounded PBKDF2 iters)** — all MEDIUM/LOW,
   gated, but real and cheap to fix.
4. **Robustness/fail-closed (S05 empty-bundle crash, S06 metadata I/O escapes the
   branded panel)** — raw tracebacks instead of the intended error UI on abnormal
   bundles.
5. **Data-display semantics (S08 duplicate month card [also live], S09/S10 misleading
   share denominators)** — wrong/confusing numbers in real paths.
6. **ETL hardening (S15 schema validation covers 2 of ~13 files, S16 untrimmed
   NOC/NAICS, S21 unconditional lookup scan)**.

## Pointers
- Defects + severities: [`findings.md`](findings.md)
- Design-craft/UX: [`ux-audit.md`](ux-audit.md)
- How to fix every item: [`fix-spec.md`](fix-spec.md)
- Batching/order: [`remediation-plan.md`](remediation-plan.md)
- Refuted candidates: [`rejected.md`](rejected.md)
- Evidence: [`evidence/live-capture.md`](evidence/live-capture.md),
  [`evidence/code-audit-findings.md`](evidence/code-audit-findings.md)

## Evidence / method
- **Live walk (Phase 1)**: ungated local Streamlit on `127.0.0.1:8530` (repo `.venv`,
  streamlit 1.58.0; password gate bypassed by not setting the auth env). All 8 tabs +
  interactive Explore posting lookup (searched id `65563604`, opened full description),
  sidebar expand/collapse, mobile 375px drawer, light/dark color-scheme. Console clean.
  Screenshots were viewed inline by the orchestrator (no PNGs persisted — playwright
  unavailable, preview MCP is inline-only); durable evidence is the walkthrough notes +
  DOM/eval extracts + `getComputedStyle` checks. The user supplied the public password
  in-session (used only to reason about the gate; not written to any file — it stays in
  Keychain per AGENTS.md).
- **Code fan-out (Phases 2-3)**: Workflow `wf_63feaafc-18b` — 11 Sonnet auditors over
  `src/**` slices, each candidate adversarially re-verified by a separate Sonnet pass
  (53 agents total). Orchestrator (Opus) owned the final UI/UX judgment, severity calls,
  and dedupe.
- **Baseline gate (audit-time, not fixed)**: `python -m py_compile` all src → OK;
  `PYTHONPATH=src .venv/bin/pytest -q` → **29 passed** (~30s). `npm`/e2e not applicable
  (Python project; the project also treats e2e counts as unreliable).

## Coverage gaps / caveats
- Live UI + UX coverage was done locally (not deferred). Markets/province data oddities
  surfaced (e.g. posting `65563604` coded `NT` but described as Whitehorse/`YT`; an odd
  `DC`-looking province legend entry) are **upstream data** issues the dashboard
  faithfully displays — flagged for upstream verification, not filed as dashboard bugs.
- A transient `.claude/launch.json` was created to drive the preview tooling and
  **removed at end of run**; the spare local Streamlit instance on `:8530` was stopped.
  Final repo footprint is only this job folder — no app code/config changed.

## Implementation (2026-06-20, branch `audit/fixes-2026-06-20`)
Fixes applied per `fix-spec.md` / `remediation-plan.md` order. Branch is **uncommitted**
(awaiting the owner's commit/deploy decision per the repo commit rule).

**Applied + verified (29 of 31 defects, 6 of 9 craft):**
- Security: S01 (LIKE escape + `ESCAPE`), S02 (session rate-limit + edge-auth note),
  S03 (`escape_markdown` for posting-detail text), S04 (PBKDF2 iteration bounds).
- Robustness: S05 (empty-bundle branded panel), S06 (`load_metadata` OSError/Unicode),
  S07 (CLI Ctrl+C/returncode), S25 (CLI JSON output).
- Data/display: S08+U03 (Data-Quality two cards, consistent `YYYY-MM`), S09 (heatmap
  caption), S10 (chart title "share of NOC-coded postings"), S11 (single-province mix
  guard, occ + ind), S12 (`UNKNOWN_PROVINCE` excluded from wage chart + dropdown),
  S13 (`month_label` NaT→n/a), S14 (inspect selectbox keyed by unique index),
  S26 (`latest_month` NaT guard).
- ETL: S15 (schema validation now covers all 15 files), S16 (TRIM noc/naics before
  regex, both builders), S17 (drop blank skill codes), S18 (falsy-zero totals),
  S19 (`COVERAGE_FIELDS` drift tripwire), S20 (materialized cutoff CTE),
  S22 (cache `ttl=600`), S24 (drop redundant cast), S21 (lookup gated behind Search).
- UI/craft: L01/FIX-A (tables auto-layout + `overflow-x:auto`), L02/FIX-B/U07
  (`.streamlit/config.toml [theme] base=light` + `color-scheme:light` + `!important`),
  L03/FIX-C (Explore window split into start/end cards), L04/L05/U05 (multi-series
  legends moved to bottom, threshold 2), U01 (semantic teal/orange change-column color),
  U04 (card `min-height` 8.5→6rem), U06 (drop "National label" column), U09 (shorter tab
  labels). New tests: S01, S03, S04, S13/S26, S25.

**Not applied (deliberate):**
- S27 — wage `>0` guard: current data has no zeros (p25 min $9.50); not applied (data-dependent).
- S23 — lazy tabs: inherent to Streamlit's render model; accepted, not fixed.
- U02 — skills labels: no code→name source available; documented limitation.
- U08 — self-host font: needs binary woff2 bundling + static serving config; deferred.
- L06 — mobile chevron clip: the legend-to-bottom move removes the overlap; the residual
  edge-clip needs live mobile tuning, deferred.

**Verification:** `py_compile` OK; `pytest -q` **34 passed** (29 baseline + 5 new). Live
render on ungated `127.0.0.1:8531` confirmed: FIX-B labels stay dark in emulated dark mode
(`getComputedStyle` label `rgb(49,51,63)` on white; value navy), FIX-A tables `table-layout:auto`
+ `overflow-x:auto`, U01 colors (teal `rgb(52,89,97)` / orange `rgb(207,119,48)`), legends below
plots, U06 column gone, U09 labels shortened, U04 card 96px. AppTest confirmed S08/S11/S12/S21
behavior with zero exceptions. Public `:8522` service left running and healthy; transient
`.claude/launch.json` removed; `.streamlit/config.toml` is a kept fix.

## Next step
Owner decision: review the branch `audit/fixes-2026-06-20`, then **commit** the diff and
**redeploy** the page through the ngrok/Cloudflare path (AGENTS.md rule 6, UI changed).
After deploy, close this job to `docs/jobs/done/2026-06-20-deep-audit/`.
**Leave this job OPEN until commit + deploy land.**
