# Mobile reference evidence

Collected 2026-08-11 from Mobbin only. The four downloaded screens are the
smallest set that covers the two responsive decisions in Gate 1: a dashboard
with stacked status/KPI modules and a chart with a readable breakdown, plus a
search/results-to-detail workflow with filtering controls and a selected record
view. Each image was exported from the rendered Mobbin screen through the
browser asset inventory, copied into `evidence/mobile-references/`, and
inspected directly at its native 360 × 900 pixels.

Focused keyword searches: none. I used Mobbin's Explore and related-screen
navigation to avoid collecting redundant candidates; this remains within the
two-query limit.

## Selected screens

| File | Mobbin source | App / screen | Interaction convention it resolves | Do not copy into ACLMR |
| --- | --- | --- | --- | --- |
| [`mobbin-ultrahuman-sleep-dashboard.webp`](../evidence/mobile-references/mobbin-ultrahuman-sleep-dashboard.webp) | [Ultrahuman iOS Sleep Data Dashboard](https://mobbin.com/explore/screens/36e5a755-9c0d-4afb-ba4e-dff42cd39a47) | Ultrahuman — dashboard/home with a date context row, one compact summary row, stacked status cards, and persistent bottom navigation | On a 390 px Pulse-like surface, keep the context/date selector above the first metric, let a KPI or status card own one short explanation, stack analytical modules in a single reading column, and keep the primary section switcher persistent at the bottom. Locked/no-data/calibrating cards show that an unavailable metric can still retain its place without collapsing the rhythm. | Do not copy the dark health-app palette, glassy image backgrounds, wellness labels, circular score/ring treatment, or the branded tab bar. ACLMR needs its cream public canvas, navy masthead, truthful labour-demand language, and square analytical controls. |
| [`mobbin-plata-asset-allocation.webp`](../evidence/mobile-references/mobbin-plata-asset-allocation.webp) | [Plata Card iOS Asset Allocation](https://mobbin.com/explore/screens/b9c441c0-0f74-483b-9851-8bd4d03d8928) | Plata Card — asset allocation chart with total, one dominant visual, and a legend/breakdown list | A chart can remain legible on a narrow phone when one focal visualization is followed by a short, aligned breakdown list; labels and values sit together instead of forcing a legend into a second horizontal scroll region. The bottom navigation remains visually subordinate to the chart task. | Do not copy the finance branding, gradient sphere/pie treatment, investment terminology, or the 50/50 color semantics. ACLMR charts must use the shared Plotly figures, honest residual/cap language, accessible trend colors, and project typography. |
| [`mobbin-swiggy-search-results.webp`](../evidence/mobile-references/mobbin-swiggy-search-results.webp) | [Swiggy iOS Search Result](https://mobbin.com/explore/screens/6d8441ef-3c49-4337-8065-5bef12101b34) | Swiggy — search results for “Samosa” with search field, result tabs, sort/filter chips, a horizontal featured strip, then stacked result rows | Mobile Explore should keep query context visible, separate result types with a compact tab row, expose sort/filter as short chips before the list, and make each result row scannable with a thumbnail, title, rating/status, and secondary metadata. The featured strip is a safe optional pattern only when it does not displace the actual results. | Do not copy the food imagery, promotional discount badges, bright consumer-commerce colors, or horizontal carousel as the default. Job-ad results should prioritize title/employer/location/date, keep filters square and task-oriented, and preserve a results-first flow without a page-level horizontal scroll. |
| [`mobbin-turo-car-detail.webp`](../evidence/mobile-references/mobbin-turo-car-detail.webp) | [Turo iOS Car Detail](https://mobbin.com/explore/screens/2f73a921-3732-4349-93dc-c76dc27eabfe) | Turo — selected item detail with back/share/favorite controls, title block, grouped metadata rows, inline edit affordances, and sticky bottom action | When a result is selected on mobile, replace the desktop split pane with a clear stacked detail region/drawer: provide an obvious back path, title and identity first, then grouped metadata rows with consistent leading icons and right-edge affordances. A bottom action bar can stay sticky while the detail body scrolls. | Do not copy the large vehicle photo, booking/checkout language, heart/share affordances, or heavy consumer-product imagery. ACLMR's selected posting needs a restrained record header, factual posting metadata, accessible close/back behavior, and no invented action that implies applying, booking, or editing the source ad. |

## Cross-reference decisions for Gate 1

- **Pulse:** use the Ultrahuman + Plata combination for a single-column phone
  rhythm: context and compact KPIs first, then one chart at a time with an
  adjacent breakdown list. Preserve annotation/legend readability without
  page-level horizontal scrolling.
- **Explore:** use Swiggy for the results-first hierarchy (query → tabs →
  filters → rows) and Turo for the selected-posting replacement (back/close →
  identity → grouped metadata → optional sticky action). Keep filters and
  record controls compact and square in the ACLMR system.
- These references settle interaction mechanics, not ACLMR art direction.
  Retain the approved navy masthead, cream public field, dark Explore shell,
  PT Sans, exact wordmark, bilingual copy, public category caps, and the real
  posting/authentication behavior.

## Download checks

All four files are WebP images, 360 × 900, and were inspected directly after
copying from the Mobbin browser asset bundle:

```text
mobbin-ultrahuman-sleep-dashboard.webp  c7633ff057d57c20da4616bf14b25a18be53f3f2837829b2a7fef43644034d1a
mobbin-plata-asset-allocation.webp      c72aaa092d37e85dbca5a8d3ae83a167f6033172517f2a109c16d46ace4c4020
mobbin-swiggy-search-results.webp      b4188fa85dc34ea5dd5ac315bf6505fc732d92aa1afa24c1267b53abf35e08ae
mobbin-turo-car-detail.webp             7922f074460cb44dd6355997d1c87c7aeab6777e1960121705b06393c8e7f5c0
```
