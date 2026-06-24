# JOB — deep audit 2 (2026-06-23)

- **Status:** DONE — all 22 defects + 9 craft fixed and verified on branch `fix/deep-audit-2026-06-23-2` (2026-06-23). See `RESOLUTION.md`.
- **Date:** 2026-06-23
- **Branch audited:** `redesign2`, HEAD `c4c6d201` ("Fix all deep-audit findings (23 defects + 9 craft)") — i.e. this audits the **post-fix** tree from this-morning's deep-audit.
- **Slug:** `/deep-audit` "Use Opus subagents". Conventional slug `2026-06-23-deep-audit` was already taken by this-morning's job, so this run uses **`2026-06-23-deep-audit-2`**.
- **Model:** per the explicit request, **all subagents ran on Opus** (overriding the skill's standing Sonnet default). The orchestrator kept the final design/severity calls and synthesis.

## Goal
Audit the dashboard on two fronts — **defects** (broken/wrong across rendered UI, backend/data, code) and **design-craft / UX** (is it *good?* vs standards) — with a concrete fix for every confirmed item. Do not apply changes. Emphasis on regressions in the 1,833-line fix diff and surfaces the prior run skimmed.

## Outcome
**37 fan-out candidates + 2 orchestrator findings → after dedup, over-claim rejection, and severity correction: 22 distinct defects (0 HIGH · 9 MEDIUM · 13 LOW) + 9 craft (0 P1 · 2 P2 · 7 P3).**

The app is **mature and in strong shape**: every prior-audit HIGH/MED is fixed and holding (verified live + source). **No HIGH this run.** The 2 over-claims the verifier agents missed were caught by the orchestrator (see `rejected.md`).

**Dominant clusters:**
1. **Chart data-honesty** — `S04` momentum legend inverted (hand-verified) · `S05` decomposition charts compare June(base)→December(end), baking ~30% seasonality into "change" (hand-verified, the headline) · `S06` wage quadrant + education-proxy frozen to Dec 2024 without disclosure (hand-verified).
2. **Accessibility of the new interactive controls** — `S02` KPI delta direction is colour+`aria-hidden`-arrow only · `S03` year-picker `<select>`s have no visible focus (`outline-none` + undefined `border-brand`; a regression from the morning a11y fix, hand-verified).
3. **Login-throttle hardening** — `S01` rate-limit keyed on the leftmost (client-spoofable) `X-Forwarded-For` through the Next proxy → brute-force bypass; residual of the prior S06 fix (hand-verified, found independently as ORCH-1).
4. **First-request cold-start** — `S09` explore default query ~124 s on first boot behind an unbounded bare "Loading…" (no startup warm-up, no client skeleton; hand-verified).
Plus `S07` `experience_band` misbuckets multi-digit years in a displayed chart, `S08` FR skill names un-localized, and a tail of LOW i18n/robustness items. Craft `U01` (multi-series trend charts collapse to ~2 colours) and `U02` (CMA ranking mixes non-metro catch-alls) lead the polish list.

## Pointers
- `findings.md` — the 22 defects (S01–S22), severity tally, per-item root cause + verdict.
- `ux-audit.md` — the 9 design-craft items (U01–U09), priority tally.
- `fix-spec.md` — exact change + steps + risk + verify for every confirmed item.
- `remediation-plan.md` — fix units A–E, order, branch advice, per-batch verify rules.
- `rejected.md` — prior-fixed items (§A), live-refuted candidates (§B), and the 2 orchestrator-caught over-claims.

## Evidence (`evidence/`)
- `live-capture.md` — full live walk (9 pages, EN+FR, desktop+mobile) at HEAD `c4c6d201`; prior-fix verification; the cold-start measurement.
- `orchestrator-findings.md` — hand-verified ORCH-1 (XFF) + ORCH-2 (cold-start) + coverage note.
- `fanout-confirmed.md` — all 37 fan-out candidates with verdicts (raw).
- `pytest-baseline.txt` (325 passed) · `typecheck-baseline.txt` (clean) · `next-build-baseline.txt` (clean).
- Baseline checks at audit time: **`pytest` 325 passed · `tsc --noEmit` clean · `next build` clean.** (`npm run e2e` counts not trusted per skill — shared `:3000`.)

## Coverage gaps
- **Find Postings** (private posting lookup): auth secret not configured locally → graceful AuthGate; reviewed from source only.
- Cold-start 124 s measured under dev-server contention; a clean prod re-measure is recommended (warm-up cause + unbounded-Loading UX are real regardless).
- App is **light-only by design** (not a dark-mode gap).
- The verifier agents under-refuted (0/37) — the orchestrator's source re-read was the real adversarial filter; future runs should prompt verifiers to default-refute harder.

**Next step:** apply the fixes in `fix-spec.md` (in the order from `remediation-plan.md`), then close this job to `docs/jobs/done/`.
