# Deep audit 2026-06-23 — remediation plan

Group the 24 defects + 9 craft items into fix units, ordered highest-value/highest-risk first. Branch off `redesign2`; verify + commit per unit. After each unit: `pytest` (incl. `tests/golden/`, regenerating + **reviewing** diffs), `tsc --noEmit`, and a **FR live pass** (the audit's dominant theme is FR completeness — every unit that touches text must be checked in French).

## Fix units (suggested order)

**U-1 · Explore data honesty (do first — these are the only correctness bugs, all in one file).**
`S01` (YoY calendar shift) · `S02` (share denominator) · `S03`/`S16`/`S17` (`two_year` mislabel + equal-year gate + dead rename). All in `api/explore.py`; add a couple of `api/tests/test_explore.py` cases (gap-cell YoY, sparse-share, two_year-on-time, equal-year). Regenerate any explore goldens. *Highest value: these are the new feature's honesty edges and cut against the product's core claim.*

**U-2 · i18n / FR completeness (largest cluster — 9 items, mostly mechanical).**
`S04` (Oct/Nov in `_FR_CHROME`) · `S05` (key-points) · `S07` (sentinels + category labels — the one non-trivial piece, needs a NOC/NAICS code→FR map shared by explore + curated) · `S08` (scope summary) · `S09` (number formatters) · `S10` (KeyPoints note) · `S11` (error boundaries) · `S12` (AuthGate error). Do `S07`'s shared label map first; the rest are dict moves. One FR live pass covers the whole unit. *The bilingual product is the headline gap this run found.*

**U-3 · a11y of the new interactive controls.**
`S13` (TunableFigure year-picker labels — touches 4 pages via one component) · `S14` (ExploreTabs tab pattern) · `S21` (LocaleToggle group label). Verify with preview snapshots / a screen reader.

**U-4 · Explore UX states + craft on the new surface.**
`S15` (loading vs error) · `S20` (drawer stale flash) · `U05` (CSV stale-data guard) · `U04` (FilterSpine label) · `U08` (builder figcaption) · `U09` (AuthGate phase shell). Grouped: all `web/components/explore/*` + `ExploreBuilder`.

**U-5 · Factory polish + low-risk cleanups.**
`S18` (cma duplicate labels — confirm against upstream schema) · `S19` (clamp year params) · `U03` (chart font) · `U07` (cma bar colour). Factory edits → regenerate + review goldens together.

**U-6 · Systemic craft + type-safety (lowest risk, batch last).**
`U01` (small-text token sweep) · `U02` (KPI delta convention) · `U06` (brand tagline) · `S22` (`as const`) · `S23` (metadata type).

## Systemic fixes that resolve many items at once
- **One shared NOC/NAICS code→{en,fr} label map** (`S07`) fixes the FR category-label leak on *both* the Explore builder and the curated treemaps in one place — build it once.
- **The small-text token pass** (`U01`) is one mechanical sweep that removes ~21 ad-hoc sizes across many components.
- **Threading `locale` into `format.ts`** (`S09`) fixes FR number formatting everywhere those helpers are called.

## Notes
- No HIGH this round — the prior audit's HIGH/MED defects are fixed and confirmed holding. This is a polish + new-feature-hardening pass.
- `security-review` is worth running on `S06` (the `X-Forwarded-For` trust) before deploy, since it touches the login throttle.
- After all units land + named tests added, close this job to `docs/jobs/done/2026-06-23-deep-audit/`.
