# Deep audit 2026-06-23 — rejected / refuted candidates

Candidates the adversarial pass or the orchestrator's hand-read refuted. Recorded so the next run doesn't re-file them. Full verifier reasoning in `evidence/fanout-refuted.md`.

## Refuted this run (8) + 1 uncertain

1. **No dark mode / `aclmr_dark` ships unused** (prior `U07`) — **Refuted.** Light-only is intentional and documented in `globals.css`, and there is **no** `aclmr_dark` template at all (`theme.py` registers only `aclmr_light`; full-text search for `aclmr_dark` returns zero). The orchestrator's initial live-capture note ("ships unused dark tokens") was carried over from the prior audit and is wrong — corrected in `evidence/live-capture.md`. The app staying cream under `prefers-color-scheme: dark` is the chosen design.

2. **Explore hero breaks the shared page template / FilterSpine above hero** (prior `U05`) — **Refuted.** `explore/page.tsx:32-33` now uses the shared hero template (eyebrow · headline · lede), with a comment that the FilterSpine is an intentional sticky sub-bar shared by both Explore tabs. The spine-above-hero placement is deliberate, not a template break. (One craft auditor confirmed it; the dedicated refuter and the orchestrator overruled — it's a documented design choice. The *label* on that spine is a separate, valid finding → `U04`.)

3. **Skills hero missing terminal period** (prior `U09`) — **Refuted / already fixed.** `page-skills.ts:11` = "What employers are asking for." and `:107` (FR) = "Ce que les employeurs recherchent." — both have the period.

4. **`skill_churn` share denominator is the filtered pool, not all-mention total** — **Refuted (by design).** The share-of-mentions denominator is intentional (docstring `datasource.py:265-267`), avoids small-base blow-up, and the labelling is consistent with it. Not a defect.

5. **`MapToggle` reuses one `panelId` for all variants → wrong `aria-controls`** — **Refuted.** It's a deliberate single-panel switcher: one `role="tabpanel"` whose content swaps on `active`, every tab's `aria-controls` pointing at that one panel. Valid, widely-used pattern.

6. **`PostingDrawer` backdrop button is keyboard-inaccessible (`tabIndex=-1`)** — **Refuted.** Closing is fully keyboard-operable via the Escape handler (`:79`) and the focusable close button inside the panel (`:141-149`). The backdrop is a mouse convenience; `tabIndex=-1` is correct.

7. **`industries.treemap` non-animated path uses unqualified "Demand" in title** — **Refuted (unreachable).** The inconsistency is real in source (`:54` vs `:60`) but the `animate=None` branch is never reached — every registry entry calls the treemap with `animate="by-year"`. Tidy-up only, not a live defect.

8. **ExploreBuilder year picker renders "From 2022 to 2022"** — **Refuted (framing wrong).** The "From"/"to" labels are standalone spans; no interpolated "From X to Y" string is ever rendered. (The *underlying* equal-year issue — `two_year` measure → all-0% chart — is real and filed as `S16`.)

**Uncertain → resolved by orchestrator:**
9. **Occupations treemap "Unknown" 18% tile uncaptioned** (prior `U06`) — **Refuted for the treemap.** `page-occupations.ts:28-29` (en) and `:95` (fr) explicitly note: '"Unknown" = postings without an assigned NOC code, not an occupation group.' The caption exists in both locales. The *geography* "Unknown market" prominence is a separate concern, covered by `S18` (duplicate/ambiguous CMA labels) and `U07` (CMA colour).

## Standing lint-noise (not bugs — do not re-file)
The eslint `react-hooks/set-state-in-effect` errors (`ExploreView`, `PostingDrawer`, `ExploreBuilder`/`TunableFigure` first-run effects) and `react-hooks/immutability` (`LocaleToggle`) are **Next-16 new-rule lint-noise**, not bugs — the effects use a `cancelled` race guard and the cookie write is a correct event-handler side effect. (6 errors + 1 warning; same baseline as the prior audit.) The real interaction issues near them are filed separately (`S15`, `S20`).
