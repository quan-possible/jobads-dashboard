## Building with the ACLMR design system

These components come from the ACLMR labour-market dashboard — a bilingual (EN/FR)
public data product. The look is warm and editorial, not SaaS: a cream canvas,
navy ink, uppercase headings with **no** letter-spacing, soft-cornered cards, and
**square controls** (`--radius-control: 0`). There is exactly one accent colour,
orange, and it is used sparingly.

### Setup

Link `styles.css` and load `_ds_bundle.js`; components are on `window.ACLMR`.

Components that read app context — `TopNav`, `Footer`, `Brand`, `LocaleToggle`,
`Figure`, `MapToggle`, `ErrorCard` — must be wrapped in **`DsPreviewProvider`**,
which supplies the router, the i18n dictionary, and the auth session. Without it
they throw. It takes `locale` (`"en" | "fr"`, default `"en"`) and `pathname`
(drives the active nav link). Pure presentational components (`KpiTile`,
`Sparkline`, `KeyPoints`, `CoverageBar`, `Select`, `PixelTiles`, `DeepDivider`)
render without it. `I18nProvider` and `AuthProvider` are exported separately if
you need to compose them yourself.

### Styling idiom: Tailwind v4 utilities over semantic tokens

Style with Tailwind utility classes. Do **not** invent colour values — the palette
is exposed as semantic utility families. Combine any of `bg-` / `text-` / `border-`
/ `ring-` / `fill-` with:

| Family | Names |
|---|---|
| Surfaces | `canvas` (cream page), `surface` (cards), `surface-alt` (tinted panels), `surface-navy` (footer, dark sections) |
| Ink | `ink`, `ink-soft`, `ink-faint`, `ink-invert` (on navy) |
| Brand | `navy`, `navy-deep`, `teal`, `teal-soft`, `sand`, `sand-soft`, `orange`, `orange-deep`, `orange-soft` |
| Lines | `hairline`, `card-border`, `chart-grid` |
| Status | `pos` (growth), `neg` (cooling) |

So: `bg-surface-alt`, `text-ink-soft`, `border-card-border`, `ring-orange/30`.
Also `rounded-card`, `rounded-sm`, `shadow-card`, `shadow-soft`.

Hand-written component classes carry the house typography — **prefer these over
raw `text-*` sizes**:

- Structure: `container-x` (centred max-width + gutter), `card`, `card-pad`
- Headings: `eyebrow` (small uppercase orange kicker), `h-display`, `h-section`,
  `h-card`, `lede`
- Text scale: `t-label`, `t-caption`, `t-meta`, `t-body-sm`, `t-body`,
  `t-figure-title`
- Utilities: `num` (tabular figures — use on every number), `control` (square
  form controls), `gradient-bar` (the navy→teal→sand→orange signature ribbon)

For categorical chart series use the shared `--cat-1` … `--cat-8` sequence so
figures remain visually consistent. Do not claim colour-vision safety without a
separate current audit; keep labels and direct values available independently of
colour.

### House rules that are not visual defaults

- **Cap every chart at 10 categories** in any public view. This is required by the
  Vicinity Jobs data licence, not a style choice. When a dimension has more, fold
  the tail into an "Other" residual (or a meaningful grouping like "Atlantic
  Canada") so the parts still sum to the whole — never drop categories silently.
  Time axes are exempt.
- **Job postings are not employment.** Copy must keep the underlying measure
  explicit as online posting activity or posted demand, distinguish it from
  employment and economy-wide vacancies, and stay descriptive rather than
  causal. `KeyPoints` carries this guard in its default footnote.
- **Keep sparse-data caveats visible.** `CoverageBar` deliberately turns orange
  below 40% coverage; `KpiTile` renders an em-dash rather than a thin estimate.
- Every string is bilingual in production. Prefer components that take `locale`
  over hard-coded English.

### Where the truth is

Read `styles.css` and its imports for the full token and utility set, and
`components/<group>/<Name>/<Name>.prompt.md` for a component's props plus worked
examples. Those examples are the house style — imitate them.

### Idiomatic composition

```jsx
const { DsPreviewProvider, Figure, KpiTile } = window.ACLMR;

<DsPreviewProvider locale="en">
  <section className="container-x py-8">
    <p className="eyebrow">Where demand sits</p>
    <h2 className="h-section mb-5">Posted demand by province</h2>
    <div className="grid gap-5 md:grid-cols-3">
      <KpiTile accent label="Demand index" value="118" delta={18} deltaLabel="vs. baseline" />
      <div className="md:col-span-2">
        <Figure eyebrow="Share of postings" title="Ontario leads in total" asOf="May 2026">
          {/* chart */}
        </Figure>
      </div>
    </div>
  </section>
</DsPreviewProvider>
```
