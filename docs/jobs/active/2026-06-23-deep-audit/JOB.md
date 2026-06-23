# JOB — deep audit 2026-06-23

- **Status:** FIXES APPLIED on branch `fix/deep-audit-2026-06-23` (off `redesign2`) — awaiting review/commit. Audit findings below are unchanged for the record; see "Fixes applied" at the bottom.
- **Date:** 2026-06-23
- **Branch audited:** `redesign2`, HEAD `653edd01` (Editorial redesign + Explore "Build a chart")
- **Slug:** invoked as `/deep-audit` with no argument → conventional `2026-06-23-deep-audit`.

## Goal
Audit the jobads-dashboard ("ACLMR Labour Market" — FastAPI `api/` + Plotly factories `src/jobads_dashboard/viz/` + Next.js 16 `web/`) on two fronts — **defects** (broken/wrong across rendered UI, backend/data logic, code correctness) and **design craft / UX** (is it *good?* vs standards) — with emphasis on the surface added in HEAD (the new Explore builder, year-anchored "make charts general" plumbing, `skill_churn` rework, de-"demand" i18n). Write a concrete fix for every confirmed item. Do not apply changes.

## Outcome
**57 candidates → 48 confirmed, 8 refuted, 1 uncertain.** After dedup: **23 distinct defects (0 HIGH · 15 MEDIUM · 8 LOW)** + **9 craft items (0 P1 · 5 P2 · 4 P3)**.

The app is mature: the prior audit's HIGH/MED defects are **fixed and confirmed holding live** (cma 8× → 439k, malformed-param → graceful, provisional bands, FR hero, per-figure degradation, mobile nav `inert`, distinct landmarks, mobile KPI sparkline, skills period, per-capita/coverage caveats). No HIGH this run.

**Three dominant clusters:**
1. **i18n — the FR locale still leaks English in ~9 places** (`S04` seasonality Oct/Nov · `S05` home key-points narrative · `S07` filter sentinels + occupation/industry category labels [systemic, curated + Explore] · `S08` scope summary · `S09` number separators · `S10` KeyPoints note · `S11` error boundaries · `S12` AuthGate error). The largest, mostly-mechanical cluster.
2. **Explore "Build a chart" data-honesty edges** (`S02` share denominator overstates shares — **hand-verified 35% vs the treemap's 28%** · `S03` `two_year`+time draws a raw postings line under a "change a→b" axis · `S01` YoY positional `shift(12)` on the sparse cube · `S16` equal-year → all-0% chart).
3. **a11y of the new interactive controls** (`S13` TunableFigure year-pickers have no accessible name — hand-verified · `S14` ExploreTabs incomplete tab pattern).
Plus one security hardening item (`S06` `X-Forwarded-For` trusted → login rate-limit bypass).

## Pointers
- Defects + severities → `findings.md`
- Craft/UX (`U##`) → `ux-audit.md`
- How to fix every item → `fix-spec.md`
- Batch plan / order → `remediation-plan.md`
- Refuted candidates (don't re-file) → `rejected.md`

## Evidence (`evidence/`)
- `live-capture.md` — per-screen render notes (EN+FR, desktop+mobile, light+dark), runtime health, prior-fix confirmations, candidate findings, capture quirks.
- `fanout-confirmed.md` — full detail (whatWrong/rootCause/evidence/verdict) for all 48 confirmed candidates.
- `fanout-refuted.md` — the 8 refuted + 1 uncertain with verifier reasoning.
- `next-build-baseline.txt`, `pytest-baseline.txt`, `eslint-baseline.txt`, `typecheck-build-baseline.txt`.
- **Method:** live render (FastAPI :8530 reused + Next dev :3000) walked end to end in both locales; API gates/error paths probed directly; **8-agent Sonnet fan-out** (6 code + 2 UI/UX) with **one adversarial refuter per candidate** (65 agents, ~2.08M subagent tokens); orchestrator hand-read `explore.py` in full + `figures.py` params + `TunableFigure.tsx`, and owned dedup + final severity + craft judgment.

## Baseline checks (audit-time)
`pytest` **321 passed** (1 Starlette/httpx deprecation warning) · `tsc --noEmit` **clean** · `next build` **success** · `eslint .` **6 errors + 1 warning** (Next-16 lint-noise, see `rejected.md`) · live runtime console + network **clean** across all pages in EN+FR.

## Coverage gaps / caveats
- **Find Postings (private posting lookup)** not exercisable locally — auth secret not configured → AuthGate shows a clean "Access control isn't configured" message; reviewed from source only (`S08`, `S20`, `U09`, `S06` rest on source).
- `preview_screenshot` blanks after programmatic scroll (headless desync) — lower-fold chart *craft* judged from tall-viewport shots + DOM text extraction, not per-scroll screenshots; chart content verified painted via DOM.
- Dark/mobile spot-checked on home + explore, not exhaustively per page.

## Next step
Apply the fixes in `fix-spec.md` in the order from `remediation-plan.md` (start with **U-1 Explore data honesty**, then **U-2 i18n/FR**), on a branch off `redesign2`; add the named regression tests + a FR live pass; run `security-review` on `S06`; then close this job to `docs/jobs/done/2026-06-23-deep-audit/`.

---

## Fixes applied (2026-06-23, branch `fix/deep-audit-2026-06-23`)

All **23 defects + 9 craft** items implemented in remediation-plan order. No app behaviour left audit-only.

- **U-1 Explore honesty** (`api/explore.py`): S01 calendar-aligned YoY (reindex to a contiguous monthly index before `shift(12)`); S02 honest share denominator via new `_scope_total` (All-dimension marginal incl. Unknown) — live Sales & service **29.1%** (was 35.1%), axis discloses "share of all postings (excludes uncategorized)"; S03 `time`+`two_year` gated to a "switch to a category" note + `_measure_axis` never leaks `{a}→{b}`; S16 equal-year guard; S17 dead rename removed. New tests in `api/tests/test_explore.py` (gate, equal-year, sparse-share <100%, finite YoY).
- **U-2 i18n/FR**: S04 Oct/Nov added to `_FR_CHROME`; S05 localized `_key_points` frames (`api/queries.py`) + `/api/overview?locale=`; S06 `X-Forwarded-For` trusted only from a configured proxy peer (`JOBADS_API_TRUSTED_PROXY`, loopback default) + 2 new `test_private.py` tests; S07 shared NOC/NAICS `{en,fr}` map (`viz/labels.py` `short_label`) wired into both `explore._pretty` and curated `_FR_CHROME`, plus bilingual `web/lib/options.ts` sentinels/labels; S08 localized scope summary; S09 `format.ts` threads locale (FR `25 356 735`); S10 KeyPoints note; S11 shared bilingual `ErrorCard`; S12 AuthGate error string.
- **U-3 a11y**: S13 TunableFigure selects labelled + `role=group` (11 selects, live-verified); S14 ExploreTabs full APG pattern (roving tabindex, arrow keys, tabpanel); S21 neutral "Language/Langue" group label.
- **U-4 Explore UX**: S15 RemoteFigure `loading` skeleton ≠ error; S20 PostingDrawer resets during render; U04 FilterSpine "Les vues Explorer"; U05 CSV disabled mid-refetch + window-stamped filename; U08 figcaption; U09 AuthGate phases share the card shell.
- **U-5 factory polish**: S18 CMA duplicate ticks disambiguated by province; S19 `_year_kw` clamps to data window (2011 → valid traces); U07 CMA single-hue + leader highlight; U03 confirmed already satisfied (chart font resolves to PT Sans, identical to UI).
- **U-6 systemic**: U01 small-text token scale (`.t-label/.t-caption/.t-meta/.t-body-sm/.t-body`) replacing 93 ad-hoc `text-[0.xx rem]` literals across ~20 files; U02 KPI delta via locale-aware `fmtPct`; U06 brand tagline 0.72rem + tracking; S22 `as const` on two dicts (+ union-typed consumers); S23 `Metadata` annotation.

**Verification:** `tsc --noEmit` clean · `pytest` **325 passed** · `tests/golden` **163 passed** (cma cosmetic change preserves plotted values) · `next build` success · eslint at baseline (6 errors + 1 warning, the documented Next-16 lint-noise) · live FR pass (home/method/explore/occupations/geography) with **no console errors**; API-verified S01/S02/S03/S04/S07/S16/S18/S19, browser-verified S13/S14/S21/U08 + FR i18n + U03 font.

**To close:** once reviewed/committed, move this job to `docs/jobs/done/2026-06-23-deep-audit/`.
