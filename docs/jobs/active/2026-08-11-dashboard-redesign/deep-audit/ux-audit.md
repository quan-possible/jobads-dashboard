# Product Design Review

## Goal and quality baseline

- Product goal: let public readers understand Canadian online-posting demand
  quickly and honestly, while giving authenticated team users a capable but
  bounded Explore workspace.
- Project design owners: approved Pulse and Explore desktop targets, mobile
  Pulse and Explore targets, ACLMR brand audit/design system, production
  components, and the canonical metric/product specification.
- Mature interaction evidence: the four downloaded Mobbin screens and manifest
  under the parent job's `evidence/mobile-references/` directory.
- Target: current isolated worktree candidate across desktop, tablet, and phone;
  public and team roles; English and French; dense, empty, error, and selected
  states where reachable.

## Whole-product verdict

The repaired candidate is coherent and recognizably ACLMR across desktop,
tablet, and phone. The public shell, editorial route structure, official logo,
PT Sans typography, navy/cream rhythm, gradient rails, restrained orange,
dense Geography layout, Method narrative, and dark private workspace achieve
the intended design language. The starting revision's four harmful design
divergences are repaired; final fresh-context adversarial review remains the
last release-candidate gate.

## Coverage and evidence

See the parent audit coverage ledger in [`JOB.md`](JOB.md). The comparison set
actually used includes:

- approved desktop targets under
  `docs/analyses/labor_market_dashboard/redesign-foundation/evidence/screenshots/`;
- approved mobile targets under the parent job's `evidence/mobile-targets/`;
- the locally downloaded Mobbin Plata, Swiggy, Turo, and Ultrahuman screens
  under `evidence/mobile-references/`; and
- current isolated 390, 768, and 1440 route renders plus direct in-app Browser
  inspection of the assembled candidate.

## Material comparisons

- Desktop Pulse preserves the approved masthead, overlapping KPI strip,
  numbered sections, chart/summary rhythm, and deeper-diagnostics progression.
- Mobile Pulse's 2×2 KPI rhythm is strong, but dense chart annotations collide
  or clip rather than preserving the target's readable figure width. The Plata
  reference keeps visual and breakdown content separated instead of squeezing
  annotations (S01).
- Geography intelligently pairs maps with precise rankings and decompositions,
  but its mobile figure actions can squeeze a title into a one-word-wide column
  (S01).
- The approved summary panel is navy and carries explicit automation/caveat
  framing. The current panel loses that contrast and nearly hides its note
  (S02).
- The approved Explore target communicates a team workspace. The current
  authenticated page shows real results below sign-in instructions (S04).
- The Swiggy and Turo references support the current results-first list and
  bottom-sheet/detail direction; settled drawer quality will be recaptured
  after repairs.

## Cross-product coherence

What works:

- Occupations, Industries, Wages, and Skills share a coherent figure language
  without becoming identical grids.
- Method and Developers are restrained, legible long-form adaptations.
- The dark authenticated Explore workspace is a useful role distinction, not a
  brand inconsistency. Square analytical controls and pill-like access controls
  follow the ACLMR language.
- The mobile shell, Explore results, no-results state, and API-unavailable gate
  are coherent and task-oriented.

Accepted adaptations and rejected objections:

- Explore need not reproduce illustrative prototype KPIs; the real postings
  workflow makes results-first the correct authority.
- Geography maps may remain compact because ranked lists preserve precision,
  provided their labels remain readable.
- The long mobile footer is justified by provenance and terms material.
- The locked Explore page's empty space supports a gate-first state; decorative
  fake analytics would weaken it.
- Repeated white figure fields do not become a generic card wall because the
  numbered rails, dividers, editorial copy, and varied charts maintain rhythm.
- The audit does not reopen the Pulse hero wording; the user explicitly removed
  it from this redesign task's decision surface.

## Final visual recheck

- Fresh 390-pixel full-page renders cover Pulse, Occupations, Industries,
  Geography, Wages, Skills, French Method, Explore builder, no-results, and the
  settled posting sheet; Pulse also has a fresh 1440-pixel render.
- Dense mobile figures now receive full card width, stacked actions, automatic
  margins, readable small-multiple annotations, expanded categorical-bar
  height, and vertical labels for long heatmap axes without dropping categories.
- The Pulse automated-summary card is navy with readable explanatory and
  non-causal framing. Authenticated Explore announces the full-detail team
  workspace; the locked page retains access instructions.
- French Method and route metadata are localized, including public residual
  chart labels. Direct Browser inspection found no known English provenance
  leakage in the checked French surface.
- The settled posting sheet preserves focus, modal semantics, body lock, and
  the results-first mobile reading order supported by the Swiggy/Turo references.

## Unresolved evidence

- Production-authenticated behavior and actual production rendering cannot be
  tested until the Keychain credential and publication owner are restored.
- The remote Claude Design package is not being published in this audit; its
  local portable build and render remain in scope.
- Provider-specific Docker/Render cutover behavior and the production password
  cannot be checked without restored Render ownership and the Keychain secret.
  Those are publication gates, not missing candidate-product behavior.
