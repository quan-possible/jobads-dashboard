# Design-craft & UX-standards audit — deep-audit-2 (2026-06-23)

Front 2: *is the interface good?* (not *is it broken?*). Candidates gathered by the Opus design-craft auditor reading `evidence/live-capture.md` + `globals.css` + `theme.py` + component source; **final craft calls are the orchestrator's**, from the captured screenshots. Each item names the standard it misses and the screen/element. Defects that are accessibility/data-honesty live in `findings.md`; this file is craft/polish.

Standards applied: typography (one type scale, measure, hierarchy), spacing (4/8 system, alignment), colour & contrast (palette, WCAG AA, semantic colour), hierarchy/emphasis, consistency (reuse vs one-offs, real icons), states, affordance & feedback, motion (reduced-motion), microcopy, responsiveness.

Overall: the interface is **strong and coherent** — disciplined editorial typography, consistent eyebrow→headline→lede→figure rhythm, honest captions, calm brand-anchored palette, clean mobile nav. The craft items are refinements, no P1 blockers.

## Priority tally

| Priority | Count |
|---|---|
| P1 (fix before ship) | 0 |
| P2 (notable, schedule soon) | 2 |
| P3 (polish) | 7 |
| **Total** | **9** |

---

## P2

### U01 · Multi-series line charts collapse into ~2 colours; rising and falling movers share one colour · color/legibility · skills "most-requested trend", occupations "indexed growth"
`indexed_lines` and `top_skills_trend` draw many series but emphasize with only orange + grey, and the highlighted set colours both the fastest-*rising* and fastest-*falling* movers the same orange (`pulse.py:88` COLORWAY usage; skills/occupations indexed factories). On screen the skills trend is a tangle of near-identical orange lines with only 3 legend entries (live-capture). **Standard missed:** consistency + hierarchy — a reader cannot tell series apart or tell a riser from a faller. **Fix:** give the highlighted risers vs fallers distinct hues (e.g. teal vs orange, matching the UP/DOWN semantics used elsewhere), label the highlighted lines directly at their right end instead of relying on the legend, and cap the number of emphasized series.

### U02 · Geography CMA chart ranks non-metropolitan catch-all buckets among real metros · consistency/data-honesty · geography "City level · CMAs"
The CMA ranking interleaves "Unknown market (ON/QC)" and "Rural area not in a CMA/CA (AB/ON/QC)" with genuine CMAs (Toronto, Montréal…). The province suffixes fixed the *duplicate-label* defect, but the catch-all buckets still compete visually with real metropolitan markets in a chart titled "The biggest metropolitan labour markets". **Standard missed:** consistency — every other figure strips/segregates such buckets. **Fix:** drop the non-CMA buckets from this ranking (they aren't metros), or visually separate them (muted colour + a "non-metro" group divider) so the title stays true.

---

## P3

### U03 · "2019=100" reference-line annotation clips at the right plot edge · spacing/layout · skills + occupations indexed charts
The baseline annotation is anchored at the right edge and gets cut off (live-capture; `add_reference_line` annotation x-position). **Fix:** anchor the annotation inside the plot (xanchor right with a small inset, or move to the left of the line).

### U04 · Treemap tiles render label + value + percent on every tile, cramping the smallest · typography/microcopy · occupations & industries treemaps
Tiny tiles ("Arts, culture & sport · 1%") overflow/wrap their three-line text (live-capture). **Standard missed:** microcopy/legibility at small sizes. **Fix:** show only the label on sub-threshold tiles (value/percent on hover), or hide text below a min tile area.

### U05 · Card/figure titles use three near-duplicate ad-hoc font sizes · typography · global (Figure/KpiTile/card headings)
Title sizes 1.02 / 1.08 / 1.1rem appear for the same role (`globals.css` / component classes). **Standard missed:** one consistent type scale. **Fix:** collapse to a single token (e.g. `--t-figure-title`) and apply everywhere.

### U06 · Explore `FilterSpine` renders above the page hero, breaking the eyebrow-first template · consistency/hierarchy · explore page
Every other page opens eyebrow→headline→lede; Explore puts the filter bar first (live-capture U05 carryover). It's defensible (filters drive both tabs) but reads as a different page. **Fix:** either move the spine below the hero, or give it a clearly distinct "toolbar" treatment (full-bleed bar, divider) so it reads as chrome, not content — and apply that decision consistently.

### U07 · Wage values render with ragged decimals ("$25" next to "$25.50") · typography/microcopy · wages tables & ranges
Mixed decimal places in the same column/range (`web/lib/format.ts` wage path). **Fix:** fix to a consistent 2-dp (or 0-dp) wage format across tables and P25–P75 ranges.

### U08 · Static review page (`viz/review.py`) never defines `--font-pt-sans` → off-brand fallback · typography · internal review artifact only
The offline 41-chart review HTML omits the brand font variable, so charts fall back to a system font (`viz/review.py`). **Internal dev tool, not user-facing** — low priority. **Fix:** inject the `--font-pt-sans` definition into the review template head.

### U09 · Hardcoded year-specific provenance caveat will silently go stale · microcopy/data-honesty · method/footer copy (`prepare.py` provenance string)
A caveat hardcodes a specific year ("The 2025 upstream raw fetch provenance remains under audit…") that won't update as data advances. **Fix:** derive the year from the data window, or move the caveat to a dated changelog.

---

**Systemic craft fixes** (resolve several at once): a single **type-scale token pass** (U05) plus a **chart-colour/labelling pass** (U01, and the direct-labelling that also helps U03) clear the bulk. U02/U04/U06 are per-chart decisions. See `fix-spec.md` for exact changes and `remediation-plan.md` for batching.
