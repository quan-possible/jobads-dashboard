# ACLMR design-language audit

## Verdict

The redesign foundation is recognizably ACLMR and is a strong starting point
for the dashboard redesign. Its navy masthead, PT Sans typography, warm
four-stop gradient, pixel motif, white reading surfaces, and restrained orange
emphasis preserve the institutional/editorial character of the live ACLMR
site. The dashboard-specific cream workspace and analytical cards are
appropriate adaptations for sustained data reading.

The audit corrected one material design-contract ambiguity before the package
became durable: the export called every square control an “ACLMR signature,”
even though the live site uses rounded pill CTAs. The contract now distinguishes
square analytical controls from pill-shaped primary navigation or access
actions. Editorial content is preserved from the supplied designs.

## Reference hierarchy

1. The user-supplied high-fidelity Pulse and Explore designs establish the
   redesign direction.
2. The live [ACLMR site](https://www.aclmr.ca/) establishes the institutional
   brand language: dark navy structure, PT Sans, multi-stop warm gradient,
   pixel accents, rounded primary CTAs, editorial image cards, and curved
   section transitions.
3. `web/app/globals.css`, `.design-sync/`, and the current components establish
   the dashboard's existing token and component vocabulary.
4. The product specification establishes measurement language, data honesty,
   provenance, and interaction boundaries.

## Correct foundations

- Dark navy acts as the structural anchor rather than a decorative colour.
- The gradient is a rail or transition, not a page-wide wallpaper or chart
  fill.
- PT Sans is the only product typeface; numerals remain tabular.
- Warm cream and white surfaces keep dense analytical content readable.
- Orange identifies brand emphasis and primary focus; semantic and categorical
  chart colours retain their separate data roles.
- Numbered section rails and finding-first chart titles create an editorial
  research rhythm rather than a generic SaaS card wall.
- Pixel tiles remain sparse and decorative.
- Public charts retain the 10-category rule; authenticated team views use the
  existing verified-session exemption.

## Intentional adaptations

### Cream analytical workspace

The live institutional site alternates large dark, gradient, white, and image
sections. A dashboard needs a calmer reading field. The cream canvas and white
figure cards preserve the warm palette while improving long-form chart reading.

### Square analytical controls

Selects, filter fields, segmented analytical tabs, and compact toolbar actions
stay square. Their geometry communicates precision and supports dense alignment.
Meaningful navigation, access, or promotional CTAs use ACLMR's rounded pill
family. Do not turn every button into a pill or every CTA into a square control.

### Dark authenticated Explore surface

The team-only Explore target intentionally extends the navy shell across the
workspace to signal a restricted operational mode. This is not the public
dashboard default. Keep the cream public workspace, and retain enough warm,
light, and orange contrast inside Explore that it reads as ACLMR rather than a
generic dark admin console.

## Scope not yet resolved

The high-fidelity designs are desktop targets with a fixed 1100 px minimum.
They do not resolve mobile navigation, stacked KPI behavior, wide tables,
filters, chart labels, or the Explore detail pane. This is an explicit scope
boundary, not permission to ship horizontal scrolling. Before production
implementation, create and inspect a project-specific mobile target for Pulse
and Explore, then verify the assembled app at desktop and mobile viewports.

The UI kit uses illustrative SVG charts and fake values, and its auth gate
accepts any input. It is a visual/interaction reference only. Production must
continue to use the real figure bridge, authentication, i18n, and data caveats.

## Redesign acceptance baseline

The redesigned app is ready only when the assembled production surface:

- preserves the visual hierarchy and proportions of the relevant high-fidelity
  target;
- remains recognizably ACLMR beside the current live site;
- preserves bilingual, accessibility, responsive, provenance, sparse-field,
  and category-cap behavior;
- uses the current production data and figure bridge rather than prototype
  values or hand-drawn charts;
- is inspected as a whole at meaningful desktop and mobile sizes.
