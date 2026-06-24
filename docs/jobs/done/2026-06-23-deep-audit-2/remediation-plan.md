# Remediation plan — deep-audit-2 (2026-06-23)

How to address the batch (defects + craft together). Grouped into fix units, ordered highest-value/highest-risk first. Audit only — applying these is a separate human-driven step.

## Branch advice
Single branch off `redesign2` (the audited HEAD `c4c6d201`), e.g. `fix/deep-audit-2026-06-23-2`. Commit per fix unit below so each is reviewable and revertable. Keep the data-methodology unit (B) in its own commit because it changes chart values + golden files.

## Fix units (suggested order)

### Unit A — Security & a11y hardening (low-risk, high-value) — do first
- **S01** XFF rightmost + global login ceiling · **S10** bounded `_AUTH_FAILURES` (same file, do together)
- **S02** KPI delta direction for AT · **S03** year-picker visible focus
- **S22** CoverageBar clamp · **S11** keychain memoize · **S12** LIKE escaping
*Why first:* security correctness + accessibility, all label/logic-only with no chart-value change. *Verify:* `pytest` for the api items + a unit test for S01; AX snapshot for S02/S03; `tsc`+`build`.

### Unit B — Chart data-honesty / correctness (changes values → its own commit) — do second
- **S05** June→December seasonal confound (the headline) — same-month or annual-average window
- **S04** momentum legend text (label-only, but same figure family) · **S06** disclose frozen Dec-2024 wage dates
- **S07** experience_band numeric bucketing (needs a data refresh + cube regen)
- **S13** provisional-month line seam · **S14** choropleth frame month label
*Why grouped:* all touch `viz/figures/*` honesty and most need **golden-file regeneration + review**. *Verify:* regenerate goldens, eyeball the new decompositions, run the golden suite; confirm base=end → ~0 change for S05.

### Unit C — i18n / FR parity (mechanical) — do third
- **S08** FR skill names (displayed set) · **S18** FR percent spacing · **S19** "Open…" aria-label · **S20** CSV headers/filename
*Why grouped:* all FR-completeness, mechanical, low-risk. *Verify:* render every page in FR; no English leaks in the targeted spots.

### Unit D — Perf / robustness — do fourth
- **S09** explore startup warm-up + bounded client Loading (the visible UX win)
- **S15** empty-source guard · **S16** schema assertion · **S17** drop redundant partition · **S21** ExploreView effect stability
*Verify:* measure first-explore latency after a clean boot; UI shows a skeleton not an indefinite "Loading…"; pipeline tests for S15/S16.

### Unit E — Design-craft polish (systemic first) — do last
- **Systemic:** **U05** one type-scale token (clears the title-size drift) · **U01** chart colour/labelling pass (risers≠fallers, direct end-labels, also helps **U03**)
- **Per-chart:** **U02** CMA non-metro buckets · **U04** treemap tile text · **U06** explore FilterSpine placement · **U07** wage decimals · **U09** provenance year · **U08** review-page font (internal)
*Verify:* live re-render desktop+mobile EN/FR; screenshots before/after for the colour + type-scale passes.

## Cross-cutting verify (every unit)
`npm run typecheck` · `npm test` (pytest) · `npm run build`; for any `viz/` change regenerate + review **golden files**; re-render the affected pages live (EN+FR, desktop+mobile). Do **not** trust `e2e` counts (shared `:3000`). After UI changes, deploy through the project ngrok path per AGENTS.md before sign-off.

## Highest-value items across both fronts
1. **S01** (security: brute-force throttle bypass)
2. **S05** (data-honesty: seasonal confound in every decomposition chart)
3. **S09** (UX: first-visitor cold-start hang)
4. **S02 + S03** (accessibility of the new interactive controls)
5. **U01** (legibility of the multi-series trend charts)
