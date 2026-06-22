# JOB — redesign2 deep audit

- **Status:** DONE — 47/48 fixes implemented on `redesign2-audit-fixes` (commit `a6be122`) + golden suite (`a38a7fc`); **merged into `redesign2`** on 2026-06-22 via the integration job ([2026-06-22-merge-simplification-and-audit](../2026-06-22-merge-simplification-and-audit/job.md)). U01 (small-text tokenization) remains the one deferred item. These docs were preserved here from the (now-pruned) `redesign2` worktree, where they had been left untracked.
- **Date:** 2026-06-22
- **Branch audited:** `redesign2` (worktree `.claude/worktrees/redesign2`), HEAD `5b9f099`
- **Slug note:** invoked as `/deep-audit redesign2 branch`; "redesign2 branch" was the target descriptor, not a usable folder name, so the job uses the conventional slug `2026-06-22-redesign2-deep-audit`.

## Goal
Audit the redesign2 greenfield rebuild (FastAPI `api/` + Python Plotly factories `src/jobads_dashboard/viz/` + Next.js 16/TS `web/`) on two fronts — **defects** (broken/wrong, across rendered UI, backend/data logic, code correctness) and **design craft / UX** (is it *good?* vs standards) — and write a concrete fix for every confirmed item. Do not apply changes.

## Outcome
**78 candidates → 58 confirmed, 20 refuted, 0 uncertain.**

Defects (`findings.md`): **1 HIGH · 20 MEDIUM · 18 LOW = 39** (37 static `S##` + 2 live `L##`, after deduping the 58 confirmed candidates).
Craft (`ux-audit.md`): **0 P1 · 5 P2 · 4 P3** (`U01–U09`). Total distinct items: **48**.

Highest-value items:
- **`S05` (HIGH):** `review.py` is broken — it calls 12 figure factories that were renamed/removed in the researcher-viz-redesign waves (`pulse.stl_panel` etc.); reproduced by running it. The served `tmp/review/index.html` is stale and can't be regenerated. Blast radius = the internal review/spec tool only; the production figure path (`api/figures.py`) is healthy.
- **`S01`/`S02` (MED):** silently-wrong KPI YoY for sparse scopes (positional `series[-13]`), and `requirements` silently substitutes national data with no flag — both bad fits for an honesty-first product.
- **`S11`/`S22`/`S24`/`S25` (MED):** production defaults — auth cookie not `Secure`, `metadataBase`/OG → localhost, dead `/docs` link, dev API-port drift.
- **`S23` (MED):** one failing figure factory blanks an entire page (no per-figure degradation).
- **i18n cluster (`S16–S21`):** the advertised EN/FR mode is visibly broken in FR (English months, doubled `$`, English hero, untranslated dev page + tooltips).
- **a11y (`S30–S35`):** Explore drawer has no focus trap, table rows misuse `role="button"`, closed mobile nav stays focusable, no skip link.

The design system itself is strong (coherent tokens, named heading scale, CVD-safe palette, visible focus, reduced-motion) — craft findings are polish/consistency (typography tokenization, KPI mobile sparkline + delta convention, chart font, dark-mode decision), not foundational.

## Pointers
- Defects + severities → `findings.md`
- Craft/UX (`U##`) → `ux-audit.md`
- How to fix every item → `fix-spec.md`
- Batch plan / order → `remediation-plan.md`
- Refuted candidates (don't re-file) → `rejected.md`

## Evidence (`evidence/`)
- `live-capture.md` — per-screen render notes (all 9 pages, light/dark/mobile), runtime health, candidate issues.
- `orchestrator-code-read.md` — the orchestrator's hand-read of the highest-risk files (the final severity calls rest on this).
- `fanout-confirmed.md` / `fanout-refuted.md` — full subagent findings + adversarial verdicts.
- `eslint-baseline.txt`, `pytest-baseline.txt`, `next-build-baseline.txt` — baseline gate state.
- Audit method: live render (FastAPI :8530, Next dev :3000, static review :8533) walked end to end; 11-agent Sonnet fan-out (8 code + 3 UI/UX) with one adversarial refuter per candidate (89 agents total); orchestrator owned dedup + final severity + craft/design judgment.

## Baseline checks (audit-time)
`pytest` 155 passed (1 deprecation warning) · `tsc --noEmit` clean · `next build` success · `eslint` 6 errors + 1 warning (mostly Next-16 lint-noise; see `rejected.md`) · live runtime console + network clean across all 9 pages.

## Coverage gaps / caveats
- The Explore **private posting flow (search → drawer)** couldn't be exercised live (auth secret not configured locally; AuthGate blocks gracefully) — reviewed from source only; `S30`/`S31` rest on source.
- **Static review-page scroll screenshots** came back blank below the first viewport (headless capture/scroll-sync quirk); charts confirmed painted via DOM and the top section verified visually; chart craft judged mainly from factory source.
- Dark/mobile spot-checked on home, not exhaustively per page.

## Next step
Apply the fixes in `fix-spec.md` in the order from `remediation-plan.md` (start with FIX-PROD-DEFAULTS + the data-honesty unit + `S05`), on a branch off `redesign2`; add the named regression tests; then close this job to `docs/done/2026-06-22-redesign2-deep-audit/`.
