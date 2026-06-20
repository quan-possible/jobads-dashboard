# Remediation plan — 2026-06-20 deep audit

Batched, ordered plan for applying [`fix-spec.md`](fix-spec.md). Highest-value /
highest-risk first; group items that touch the same code so each branch is a coherent,
testable unit. **Apply on a branch, not `main`.** After each batch: `py_compile` →
`PYTHONPATH=src .venv/bin/pytest -q` (baseline 29) → ungated live re-walk of the
touched screen → `/_stcore/health` `ok` → redeploy through the ngrok/Cloudflare path
per AGENTS.md rule 6 (UI changes) → commit. Re-confirm line numbers before editing.

## The systemic levers (do these first — they clear the most for the least code)
- **FIX-B (color-scheme pin)** → kills **L02** and the uncontrolled part of **U07**, ~3
  lines + optional `.streamlit/config.toml`. Lowest risk, high visible payoff.
- **FIX-A (wide tables)** → kills **L01** across three tables and eases **U06**. One
  `show_table` change (or one CSS block). Medium effort, high payoff; the single biggest
  readability win, especially on mobile.
- **FIX-C / S08 (metric truncation + duplicate month card)** → **L03**, **S08**, **U03**.

## Batch 1 — Security & injection (branch `audit/security`)
- **S01** escape LIKE metacharacters · **S03** stop Markdown injection in posting detail
  · **S04** bound PBKDF2 iterations · **S02** password rate-limit (or document edge-auth
  requirement).
- All in `app.py` auth/Explore region (1342-1449, 2357-2368). Add unit tests in
  `tests/test_posting_lookup.py` for S01 (a `%` search) and S03 (Markdown in a title).
- Verify: gated re-walk of Explore; wrong-password lockout behavior.

## Batch 2 — Robustness / fail-closed (branch `audit/robustness`)
- **S05** empty-`monthly_overall` guard · **S06** `load_metadata` I/O except · **S07**
  CLI Ctrl+C · **S25** CLI emit JSON. Touches `app.py:3079-3082`, `data.py:53-61`,
  `cli.py:100-130`.
- Verify: point at an empty/unreadable bundle → branded panel (regression test next to
  the existing partial-bundle test); Ctrl+C exits cleanly; `validate` output parses as
  JSON (CLI test).

## Batch 3 — UI defects & craft, systemic (branch `audit/ui-systemic`)
- **FIX-B** (L02, U07) · **FIX-A** (L01, U06) · **FIX-C** + **S08** (L03, S08, U03) ·
  **L04** legends · **L05/U05** chart legends · **L06** mobile chevron · **U04** card
  density · **U09** tab labels · **U08** self-host font.
- All CSS/`render_*` in `app.py`. This is the "UI polish wave" — do as one branch and
  re-run the full responsive walk (1440/1024/768/375, light + dark) per the standing
  sidebar/overflow check in `MEMORY.md` Next Actions #7.

## Batch 4 — Data correctness & display semantics (branch `audit/data-semantics`)
- **S09** + **S10** share-denominator semantics (decide intent, relabel or recompute) ·
  **S11** single-province mix guard · **S12** exclude 'Unknown' province · **S13**
  NaT→n/a · **S14** unique detail keys · **U01** semantic change color · **U02** skills
  labels.
- These change displayed numbers/labels — call each out in commits and update/extend
  `tests/test_metrics.py` / `tests/test_app_surface.py`. Confirm the share-denominator
  intent with the product owner (it's a product decision, not purely a bug).

## Batch 5 — ETL / prepare + caching (branch `audit/etl`)
- **S15** full schema validation · **S16** TRIM noc/naics · **S17** drop blank skills ·
  **S18** falsy-zero totals · **S19** use COVERAGE_FIELDS · **S20** cutoff CTE · **S21**
  gate lookup behind submit · **S22** cache mtime/ttl · **S24** redundant cast · **S23**
  (optional) lazy tabs.
- `prepare.py` + `app.py` lookup. **S16/S17/S15** want a small bundle rebuild to verify
  (keep it light per `MEMORY.md` Risks — avoid full-corpus scans where possible; use a
  trimmed source or the existing derived bundle for app-side checks). Extend
  `tests/test_refresh_contract.py`. **S21** changes Explore's auto-list UX — confirm
  intent first.

## Uncertain (optional, gated on data confirmation)
- **S26** (NaT guard) — cheap, pair with S13. **S27** (wage `> 0`) — only after
  confirming the upstream source actually emits `0` as "unknown"; current data shows no
  zeros, so do not apply blindly.

## Notes
- The whole batch changes **no** behavior the project marks intentional (10-item cap,
  bounded Explore, password gate, sparse-field caveats) — only the defects/craft above.
- `docs/jobs/active/` is gitignored, so `docs:check` should not flag this job; if it
  does, hold it out per AGENTS.md.
- When the batches land and verify, close this job to `docs/jobs/done/2026-06-20-deep-audit/`
  per the global close-out rule.
