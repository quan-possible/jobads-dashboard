# Fan-out — refuted + uncertain (do not re-file)

## Refuted

### industries.treemap non-animated path uses unqualified 'Demand' in chart title
- src/jobads_dashboard/viz/figures/industries.py
- reason: The cited lines are accurate: line 54 says "Postings by industry sector (where coded)" and line 60 says "Demand by industry sector (where coded)". The inconsistency in the non-animated branch is real. However, the non-animated path (animate=None) is unreachable in the current codebase. Every production call site passes animate="by-year": the API registry at api/figures.py:90 hardcodes it, review.py:92 hardcodes it, and the golden test at tests/golden/test_figures_golden.py:417 goes through the API registry. No test, route, or script calls industries.treemap without animate, so line 60 is dead code. The candidate's own evidence concedes this. A stale title on a code path with zero callers is not a reachable defect by the adversarial standard — "confirm only if the problem is real and reachable in the current code."

### skill_churn share_delta_pp denominator is filtered-pool total, not all-skill-mention total
- src/jobads_dashboard/viz/datasource.py
- reason: The denominator discrepancy is real in the arithmetic but the claim is refuted as a defect. The filtered-denominator design is intentional and the labeling is consistent with it.

Specifically: (1) The docstring at lines 265-267 argues for share-based measurement to avoid "small-base blow-up" — a motivation that is coherent only if the denominator is the filtered pool, since admitting ultra-rare skills into the denominator would not fix that problem. (2) The subtitle at line 201 explicitly scopes the chart: "skills with ≥150 mentions in either year." A reader who sees that scope qualifier will interpret the shares as being over that pool, not over all skill mentions ever. (3) The candidate claims the subtitle "partially qualifies" the discrepancy but "does not flag the denominator discrepancy" — but given that the subtitle names the filtered set as the chart's universe, there is no discrepancy to flag; share-within-that-universe is what is shown. (4) The candidate's inflation claim ("for a popular new skill entering the filtered pool, the delta is inflated") is directionally true but symmetric: every skill's base_share and end_share are computed on the same filtered-pool totals, so the pp delta is a comparison within a consistent reference frame, not a misleading one. Rank order and sign are correct. The issue is a label precision complaint at most, not a correctness defect.

### ExploreBuilder year picker allows startYear === endYear, rendering 'From 2022 to 2022'
- web/components/explore/ExploreBuilder.tsx
- reason: The code at lines 134 and 145 does allow startYear === endYear (the clamping logic is confirmed). However, the candidate's key framing — that this produces a label reading "From 2022 to 2022" — is wrong. The UI never renders an interpolated string of that form. The b.from text ("From") is a standalone section heading in a separate span above the controls, and b.to ("to") is only a plain separator between the two select elements. A user who sets both to 2022 sees two dropdowns both displaying 2022 with a "to" between them; no composed "From 2022 to 2022" sentence appears anywhere. The visual is mildly redundant but not an error label. Additionally, the TunableFigure -1/+1 guard comparison is misleading: TunableFigure is a year-over-year comparison context where equal years produce a zero-length comparison (meaningless chart), so the guard is warranted there. ExploreBuilder uses start_year/end_year as a filter window, and the backend treats a 1-year window as valid (no server-side rejection, ge/le bounds only). The root behavior (equal years allowed) is real but by-design for a filter context, and the stated UI artifact (the "looks like a bug" label) does not exist.

### MapToggle tabpanel reuses the same panelId for all variants — aria-controls association is technically wrong
- web/components/MapToggle.tsx
- reason: The implementation at /Volumes/ACLMR/jobads-dashboard/web/components/MapToggle.tsx:26-70 is a deliberately single-panel switcher: one `<div role="tabpanel" id={panelId}>` whose content changes based on `active`, and every tab's `aria-controls={panelId}` points to that panel. This is a valid and widely-used ARIA tabs variant. The ARIA spec's one-to-one tab→panel expectation applies when each tab has its own panel element; it does not prohibit a single shared panel. Each inactive tab does control the panel in the meaningful sense — clicking it switches what the panel shows — so `aria-controls` is semantically correct. The `aria-labelledby` on the panel correctly tracks the active tab (line 70), which is exactly the right behavior for a single-panel switcher. The candidate itself acknowledges "no functional screen-reader breakage in practice" and that the design is "consistent with the pattern for single-panel tab switchers," which makes this a self-refuting finding rather than a real defect. Nothing in the current code is wrong.

### U05 (persists) — Explore page: FilterSpine appears above the hero, breaking the shared page template
- web/app/layout.tsx:71-75, web/components/FilterSpine.tsx:16-17
- reason: The structural facts are partially correct — FilterSpine does render between TopNav and `<main>` on /explore — but the finding's central claim is wrong on two counts.

First, the U05 comment in explore/page.tsx (lines 32–33) reads: "Shared hero template (eyebrow · big headline · lede), matching every other data page (U05)." This is a positive conformance assertion — it says the hero IS present and matches the shared template. The candidate reads it as "flagging this as intended to be fixed," which is the opposite of what the comment says.

Second, the hero section is fully present inside `<main>` on the Explore page (eyebrow div, h1, lede paragraph, all in the same `<section>` structure as other data pages). The FilterSpine bar above `<main>` is an additional scoping element unique to Explore's builder feature. The render order TopNav → FilterSpine → `<main>(hero…)` means the hero is still the first thing inside `<main>`, consistent with every other page. The FilterSpine appearing before `<main>` is by design for the Explore filter-driven UX, not an accidental template break.

The finding conflates "FilterSpine is a sticky bar above the hero" (true structurally) with "this breaks the shared template" (not true — the hero is present and complete, and FilterSpine returns null on all other pages making the layout identical there). No TODO, no open fix flag, and the page comment explicitly claims U05 conformance.

### U07 (intentional but incomplete) — light-only decision is documented but aclmr_dark ships unused
- web/app/globals.css:11-14, src/jobads_dashboard/viz/theme.py:176-182
- reason: The candidate's core factual claim is false. theme.py (lines 176-182) registers only `aclmr_light` — there is no `DARK` palette dataclass, no `aclmr_dark` template object, and no `register_templates` call that references dark. A full-text search of src/, web/, and tests/ for "aclmr_dark" returns zero hits. The file ends at line 258 with no dark-mode code anywhere. globals.css lines 11-14 correctly declare `color-scheme: light` with a U07 comment. Both cited artifacts are clean: U07 is fixed and there is no dead dark-mode code to remove.

### U09 (FIXED) — Skills hero terminal period now present
- web/lib/i18n/dict/page-skills.ts:11
- reason: Line 11 of /Volumes/ACLMR/jobads-dashboard/web/lib/i18n/dict/page-skills.ts reads `heroTitle: "What employers are asking for."` (trailing period present). Line 107 reads `heroTitle: "Ce que les employeurs recherchent."` (French also has the trailing period). The candidate itself states the finding is resolved, and the source confirms it — no period is missing in either locale. The defect does not exist in the current code.

### PostingDrawer backdrop button is keyboard-inaccessible (tabIndex=-1)
- web/components/explore/PostingDrawer.tsx:117-123
- reason: The backdrop button at line 120 has tabIndex={-1}, but closing the drawer is fully keyboard-operable through two independent paths: the Escape key handler at line 79, and the fully focusable close button inside the panel at lines 141-149 (no tabIndex restriction, has data-autofocus, receives focus immediately on open). WCAG 2.1 SC 2.1.1 requires that the *functionality* — dismissing the modal — be keyboard-reachable, not that every element triggering that function be in the tab order. The backdrop is a mouse-only duplicate affordance, which is the standard modal dialog pattern per the ARIA APG. Removing the backdrop from the tab order is correct: including it would add a redundant, confusing stop for keyboard and AT users cycling through the dialog. The candidate's own description concedes Escape is handled correctly and frames the issue as speculative ("if the Escape handler ever breaks"), which is not a real defect. No WCAG violation is present.

## Uncertain

### U06 (persists) — 'Unknown' treemap tile (18% of postings) is uncaptioned and visually prominent
- src/jobads_dashboard/viz/figures/occupations.py (treemap), web/lib/i18n/dict/page-occupations.ts:28 (note field):
- The claim bundles two sub-claims that have opposite verdicts.

TREEMAP — REFUTED. The note field at page-occupations.ts line 28–29 explicitly reads: '"Unknown" = postings without an assigned NOC code, not an occupation group.' The same explanation is present in French (line 95). The treemap tile is not uncaptioned. This half of the candidate is wrong.

CMA CHART — CONFIRMED, with additional precision. The actual data shows "QC | Unknown market" (rank 6, ~602k postings) and "ON | Unknown market" (rank 10, ~483k postings) both appear in the top 18. The geography.py cma_demand function strips the province prefix via str.split("|").str[1].strip(), so both display as "Unknown market" on the y-axis — two identically labelled bars with no province context on the tick. The same happens to "Rural area not in a CMA/CA" which appears for ON, QC, AB, and BC in the top 18, all stripping to the same label. The CMA note at page-geography.ts line 98 says only "City / census-metropolitan-area postings over the last 12 months — finer than the province totals above. Counts partly reflect scraping coverage, not hiring alone." — it does not mention Unknown market or explain the duplicate labels. This is a real, reachable defect in the current code.

Because the stated primary exhibit (treemap uncaptioned) is factually refuted by the existing note, but the secondary exhibit (CMA chart) is a real defect with confirmed duplicate and unexplained labels, the overall finding is uncertain rather than a clean confirm or refute.
