# Merge the code-simplification and redesign2-deep-audit branches

- **Status:** DONE & VERIFIED — executed on branch `redesign2-integration` (merge `ce3c7c63`, fixes `9459f88`), both decisions taken (D1 keep `review.py`, D2 keep compute primitives + golden tests), pushed to `redesign2`.
- **Date:** 2026-06-22
- **Goal:** one integration branch that has **both** the audit's behavioral fixes (the *correct* rendered output) **and** the simplification's leaner structure, verified green, becoming the new `redesign2`.

## Executed (outcome)

Merged `sleepy-euler-04a7d0` (simplification) + `redesign2-audit-fixes` (audit) onto `redesign2-integration`. All 13 conflicts resolved per the tables below (behavior from audit, structure from simplification). **Both decisions: KEEP** (D1 review.py is a real standalone tool; D2 the golden-tested compute primitives stay).

Running the full suite surfaced four removed-symbol leaks (audit code referencing things the simplification deleted), each fixed: restored `theme.DEMAND_SIGNAL_NOTE` + `DataSource.metadata` (review.py needs them), dropped review.py's `pulse.kpi_row` entry and the golden conftest's `top_markets_per_province` kwarg. Added `tests/golden/test_compute_properties.py` (Hypothesis property tests on the Layer-A invariants).

**Verification (all green):** `pytest` 292 passed (golden + property + audit regressions + review); `npm run build` clean (9 routes); `jobads-dashboard validate` reconciles 25,356,735 postings. The audit's golden suite passing is the proof that the simplification's structure preserved the audit's corrected output.

## The two branches (clean fork off `redesign2` = `5b9f0994`)

| Branch | Tip | Commits over redesign2 | What it is |
|---|---|---|---|
| `sleepy-euler-04a7d0` (simplification) | `48da4c8` | 10 | **Structure only**, dashboard byte-identical to `redesign2`. Removed dead code + the unused typed-JSON read API; Tier-2 dedup. |
| `redesign2-audit-fixes` (deep audit) | `a38a7fc` | 2 (`a6be122` fixes 47/48 + `a38a7fc` golden suite) | **Behavior fixes**: i18n FR, a11y, security, data-honesty, S05 review.py repair. Intentionally *changes* rendered output. Ships a **golden suite** that pins the corrected output. |

`git merge-base` of the two = `5b9f0994` for both. No prior cross-merge.

## The core insight that drives every resolution

- Simplification's invariant was "**output identical to `redesign2`**." The audit **deliberately changes output** (P75 in wage hover, provisional tails, centred moving-average, FR months/hero, a11y semantics…).
- So the simplification's byte-identical-to-`redesign2` oracle is **obsolete after the merge** — its baseline is the *pre-fix* (wrong) output.
- The audit ships the replacement gate: **`tests/golden/`** pins the *corrected* output. **After the merge, "golden suite green" is the proof that the simplification's structural changes preserved the audit's behavior.**

**Resolution principle:** *behavior from the audit, structure from the simplification.* Where the simplification deleted dead code, take the deletion — **unless** the audit made that code live or pinned it as a maintained surface (that's exactly D1 and D2 below).

## Overlap (25 files touched by both)

Trial `git merge-tree sleepy-euler-04a7d0 redesign2-audit-fixes`: **12 auto-merge clean · 10 content conflicts · 3 modify/delete.** (Auto-merge-clean is *textual* only — the golden suite + web build are what prove semantic correctness.)

Auto-merge clean — the **12 two-sided overlaps** that merge without conflict: `api/core.py`, `api/figures.py`, `viz/figures/pay.py`, `viz/figures/pulse.py`, `web/app/{geography,industries,occupations,page,skills,wages}.tsx`, `web/lib/api.ts`, `web/lib/i18n/dict/page-skills.ts`. Plus all **audit-only** files (the simplification never touched them) merge clean too: `api/auth.py`, `api/main.py`, `api/routers/private.py`, `api/tests/test_private.py`, and `viz/figures/skills.py` — **this is where the security fixes S11–S15 live, so they carry over with zero conflict.**

---

## D1 — `review.py`: KEEP the audit's fixed version (recommended)

- Simplification **deleted** `src/jobads_dashboard/viz/review.py` (+ it had removed nothing else around it) calling it "dead, already crashes."
- Audit **fixed** it: S05 (its only HIGH) reconciled it to the live figure `REGISTRY` so it renders 44 charts, added `tests/test_review.py`, and the golden suite's `test_figures_golden.py` covers it.
- It is a **standalone static review tool** (served on `:8533`, wired in `main/.claude/launch.json`; documented in `viz/__init__.py`). It is **not imported by the live dashboard** (`api/figures.py` / `web/`), so keeping it **does not touch dashboard output** or violate any simplification invariant. Both jobs independently note its blast radius is "the internal review tool only."
- **Recommendation: KEEP audit's `review.py`** (resolve the modify/delete by keeping the audit side) and keep `tests/test_review.py`. The simplification's deletion overreached — it removed a wanted tool, not dead code.

## D2 — the 6 unused `compute.py` primitives: KEEP (decided — user wants the golden coverage)

- Simplification removed: `lorenz_curve`, `topk_cumulative_share`, `location_quotient`, `classical_decompose`, `robust_z`, `hhi`.
- **Confirmed dead**: no figure on *either* branch calls any of them (the `hhi` hits on the audit branch are a *local* `(shares**2).sum()` inside the removed typed-JSON concentration query, not `compute.hhi`).
- But the audit's golden suite **`tests/golden/test_compute_golden.py` (Layer A) pins all six** as a maintained transform library, and `tests/test_compute.py` unit-tests `classical_decompose`.
- **DECIDED (2026-06-22): KEEP all six + their golden/unit tests.** The user wants the golden coverage — and the suite is rigorous-not-excessive (known-by-construction analytic literals, not snapshots; three orthogonal layers; Layer C asserts on numbers + contracts, not cosmetics, so it won't churn on the audit's font/colour changes). So `compute.py` takes the **audit side**: the simplification's compute deletion is **dropped**, and `test_compute_golden.py` / `test_compute.py` are kept untouched. No test trimming.
- Follow-up (separate, not this merge): add a few **property-based (Hypothesis)** invariants on the Layer-A transforms (shift-share reconciliation, index base=100, contribution sums to total, diffusion ∈ [0,100]) — generalises beyond the fixture, the one place worth *adding* rigour.

> D1 and D2 are the same shape ("audit treats it as maintained; simplification calls it dead"), decided the same way: keep the audit's view in both. `review.py` is a served tool; the compute fns are a golden-tested primitive library the user wants kept.

---

## Mechanical resolutions (no judgment needed)

**Modify/delete (3):**
- `review.py` → per **D1** (recommend keep audit).
- `web/components/DownloadCSV.tsx` → **DELETE.** Still unimported on the audit branch; the audit only cosmetically touched a dead component. (Its helper `web/lib/csv.ts` is already gone in simplification.)
- `web/lib/i18n/dict/pages.ts` → **DELETE** (simplification split it into `explore.ts` + page dicts) **but port the audit's +2 i18n lines** (added near line 110) into whichever split file consumes them. One-line-each port; verify the keys resolve.

**Content conflicts (10) — keep audit behavior, re-apply simplification structure:**
- `api/models.py` / `api/queries.py` / `api/tests/test_read.py` — **the read-API path.** Take the simplification's pruned set (meta/overview + Auth/Posting only; the user ratified removing the typed-JSON API). **Fold in only the audit fixes that touch surviving code** — S01 date-keyed YoY in `_kpis()` (kept) survives; the audit's S02 `_long_shares` national-flag and `requirements()` fix sit on **removed** functions and are **dropped with them** (you don't fix what you delete). Keep `test_read.py` cases for surviving endpoints (meta/overview/causal/cross-filter) with audit's assertions where they apply.
- `viz/compute.py` — per **D2 (decided KEEP)**: take the **audit side** — keep all 12 transforms incl. the 6 the simplification removed; drop the simplification's deletion. `test_compute_golden.py` / `test_compute.py` stay untouched.
- `viz/figures/occupations.py` — take audit behavior; re-apply simplification's shared `treemap_trace`.
- `viz/theme.py` — disjoint edits: keep audit's font change (U04 PT Sans) + FR chrome **and** the simplification's removed dead members (`DARK`/`palette()`/`coverage_opacity()`/`INK`/…) + `UP`/`DOWN` consts.
- `web/app/developers/page.tsx` — audit's page-developers i18n + dead `/docs` link removal (S24) **and** simplification's `ENDPOINTS` trimmed to `meta`+`overview`.
- `web/lib/format.ts` — keep audit's locale-aware `fmtMonth`/`fmtWage` (S16/S17); drop only the exports simplification removed that the audit didn't revive.
- `web/lib/i18n/dict/common.ts` — union: keep audit's added i18n keys; drop the 11 dead keys simplification removed that the audit didn't re-add.
- `web/lib/types.ts` — keep `Filters` (geo/occ/ind); drop dead response interfaces; any audit field added to a now-removed type is dropped with it.

**Clean (no conflict):** `src/jobads_dashboard/dashboard/metrics.py` + `tests/test_metrics.py` — simplification deletes, audit left unchanged, dead on both → deletion stands.

---

## Mechanics (recommended order)

1. **Base from the audit branch** (so the golden gate + corrected behavior are the foundation):
   `git worktree add ../redesign2-integration -b redesign2-integration redesign2-audit-fixes`
2. **Merge the simplification:** `git merge sleepy-euler-04a7d0`. Resolve the 3 modify/delete + 10 content per the tables above. **Do this single-agent** — the API/i18n reconciliations need one coherent reader; do not fan out subagents in a shared worktree mid-merge ([[parallel-subagents-git-worktree]]).
3. **Post-merge fixups:** trim `test_compute_golden.py`/`test_compute.py` per D2; port the `pages.ts` strings; confirm `DownloadCSV.tsx` removed.

## Verification gate (the close-out proof)

Run the `verification` skill (code + multi-file route). Concretely, in order:
- **a.** `uv sync --extra api --extra dev` (lock-pinned; a free numpy resolution breaks pandas).
- **b.** `pytest -q` — the **union** must pass (golden A/B/C + figures + read + private/security + review + refresh contract). Any `ImportError` = a leftover reference to a simplification-removed symbol (this is the #1 mechanical risk; b + d catch it).
- **c.** **`tests/golden/` green = the central proof** that the simplification structure preserved the audit's corrected output.
- **d.** Web: `npm run build` (tsc + lint) green; production-build smoke of the 9 pages EN/FR.
- **e.** `jobads-dashboard validate` reconciles (25,356,735 postings).
- **f.** Live smoke: home renders; **FR shows French months/hero** (audit S16–S20); `/developers` lists only `meta`+`overview` (simplification); if D1=keep, the review tool renders 44 charts on `:8533`.
- **g.** Per `AGENTS.md`: bring the page up on `:8520` + ngrok and **report the live URL** before sign-off.

## Risks & notes

- **Removed-symbol leakage** — any test/page still importing a simplification-removed symbol fails fast in (b)/(d). With D2 = KEEP, the compute fns are no longer removed, so `test_compute.py` + golden Layer A pass as-is. Remaining removed-symbol risk is only the read-API names (queries/models/types) — covered by (b)/(d).
- **Auto-merged figures silently wrong** — textual clean ≠ correct; the golden suite (c) is the catch.
- **Mooted audit fixes (intended, listed so nothing is lost silently):** S02 (`requirements` national-flag) is discarded with the removed `requirements` endpoint. **S04** (malformed-date guard) lives in `api/core.py`, which auto-merges → it survives. Re-confirm during merge that **S03** (503 on missing posting lookup) also lands on a surviving path (it's not in the read-API queries; expected in `private.py`/`core.py`) — if it sits only on a removed read endpoint, it's dropped with it.
- **Golden encodes a known bug** — the golden note flagged `geography.cma_demand` inflating volumes ~8×. The suite pins *current* output; fixing that is **out of scope** for this merge (decide separately).
- **Scope** — this merges two branches onto a `redesign2`-line integration branch. Promoting `redesign2` → `main` is a **separate** step (`redesign2` is far ahead of `main`); not part of this job.

## Decisions
- **D1:** keep `review.py` (audit) — *recommended yes; still to confirm*.
- **D2:** ~~remove the 6 compute primitives~~ → **DECIDED KEEP** (2026-06-22) — keep them + their golden/unit tests; `compute.py` takes the audit side. Optional follow-up: add property-based invariants on Layer A.

## Related
[[simplification-plan]] · [[redesign2-deep-audit]] · [[golden-testing-plan]] · [[parallel-subagents-git-worktree]]
