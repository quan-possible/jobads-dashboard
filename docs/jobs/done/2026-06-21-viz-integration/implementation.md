# Implementation spec — figure-bridge (file-level, code-shaped)

Companion to `job.md`. This is the "how", concrete enough to build from. **Still not executed.**

## 0. Where to build & required pre-reads
- **Work in the `redesign2` worktree** (`.claude/worktrees/redesign2/`): it already has all three stacks together — `web/` (Next.js), `api/` (FastAPI), and `src/jobads_dashboard/viz/` (the factories). No file copying. Branch off `redesign2` for the integration.
- **Pre-read before any `web/` code:** `web/AGENTS.md` — "This is NOT the Next.js you know"; read the relevant guide in `web/node_modules/next/dist/docs/` first.
- Commit before any subagent fan-out; never `git stash/reset` in a shared worktree ([[parallel-subagents-git-worktree]]).
- The API must keep reading only derived parquet (no raw corpus); the factories already obey this (`DataSource` → `load_tables`).

## 1. API — serve a factory as Plotly figure JSON

**New `api/figures.py` (registry + builder):**
```python
import json
import plotly.io as pio
from functools import lru_cache
from jobads_dashboard.viz.datasource import DataSource
from jobads_dashboard.viz.figures import (pulse, geography, occupations,
                                          industries, pay, skills, quality)
from . import core

@lru_cache(maxsize=1)
def _ds() -> DataSource:
    return DataSource(core.DATA_DIR)          # same bundle the API already reads

# chart_id -> callable(ds, *, locale, **params) -> go.Figure
REGISTRY = {
    "pulse.demand_ribbon": lambda ds, **k: pulse.demand_ribbon(ds),
    "pulse.seasonality":   lambda ds, **k: pulse.seasonality_heatmap(ds),
    "occupations.treemap": lambda ds, **k: occupations.treemap(ds, animate=k.get("animate")),
    # … one line per shipped factory …
}

def build(chart_id: str, locale: str = "en", **params) -> str:
    fig = REGISTRY[chart_id](_ds(), locale=locale, **params)
    # 1) the headline lives in the HTML <Figure> frame, not the figure:
    fig.update_layout(title=None)
    # 2) factories rely on pio.templates.default — INLINE the template so the
    #    redesign2 look travels to the browser (the web has no 'aclmr_light'):
    fig.update_layout(template=pio.templates["aclmr_light"])
    # 3) Plotly's encoder (handles numpy / pandas Timestamps); returns a JSON string:
    return fig.to_json()                       # includes data, layout, frames
```
> The template-inline (step 2) is essential: the redesign2 factories set the look via `pio.templates.default` in `register_templates()`, so a plain `to_json()` may omit it and the figure would render unthemed in the browser. Verify in S0.

**New `api/routers/figures.py` (endpoint):**
```python
from fastapi import APIRouter, HTTPException, Query, Response
from .. import figures
router = APIRouter(prefix="/api", tags=["figures"])

@router.get("/figure/{chart_id}")
def figure(chart_id: str, locale: str = Query("en", pattern="^(en|fr)$")) -> Response:
    if chart_id not in figures.REGISTRY:
        raise HTTPException(404, f"unknown chart_id: {chart_id}")
    # return the Plotly-encoded JSON string verbatim — do NOT let FastAPI
    # re-encode it (its default encoder chokes on numpy/Timestamp):
    return Response(content=figures.build(chart_id, locale=locale),
                    media_type="application/json")
```
Wire it in `api/main.py`: `from .routers import private, read, figures` → `app.include_router(figures.router)`.

**Tests (`api/tests/test_figures.py`):** for a representative chart id — 200 + parseable JSON with `data`/`layout`; `layout.template` present (look travels); `layout.title` is null (frame owns it); an animated id returns non-empty `frames`; unknown id → 404; no causal language in any string field.

## 2. Web — render the figure (frames-capable host)

**New `web/components/RemoteFigure.tsx`** (mirrors `ChoroplethTime`'s frame handling; renders the figure's OWN template — does *not* inject `aclmrWarm`):
```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { baseConfig } from "@/lib/plotly/theme";
import { API_BASE } from "@/lib/api";

type FigJSON = { data: unknown[]; layout: Record<string, unknown>; frames?: unknown[] };

export function RemoteFigure({ chartId, locale, height = 360, ariaLabel }:
  { chartId: string; locale: string; height?: number; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fig, setFig] = useState<FigJSON | null | "error">(null);

  useEffect(() => { let alive = true;
    fetch(`${API_BASE}/api/figure/${chartId}?locale=${locale}`, { next: { revalidate: 3600 } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(f => alive && setFig(f)).catch(() => alive && setFig("error"));
    return () => { alive = false; };
  }, [chartId, locale]);

  useEffect(() => {
    const el = ref.current; if (!el || !fig || fig === "error") return;
    let disposed = false, ro: ResizeObserver | undefined;
    let plotly: typeof import("@/lib/plotly").default | undefined;
    void import("@/lib/plotly").then((mod) => {
      if (disposed || !ref.current) return; plotly = mod.default;
      const newPlot = plotly.newPlot as unknown as (e: HTMLElement, d: unknown, l: unknown, c: unknown) => Promise<unknown>;
      const addFrames = plotly.addFrames as unknown as (e: HTMLElement, f: unknown) => Promise<unknown>;
      void newPlot(el, fig.data, { ...fig.layout, height }, { ...baseConfig }).then(() => {
        if (!disposed && fig.frames?.length) void addFrames(el, fig.frames);
      });
      ro = new ResizeObserver(() => { if (plotly && ref.current) plotly.Plots.resize(ref.current); });
      ro.observe(el);
    });
    return () => { disposed = true; ro?.disconnect(); if (plotly && el) plotly.purge(el); };
  }, [fig, height]);

  if (fig === "error") return <div style={{ height }} className="flex items-center justify-center text-[0.85rem] text-ink-faint">Chart unavailable.</div>;
  return <div ref={ref} style={{ height, width: "100%" }} role="img" aria-label={ariaLabel} />;
}
```
- Could fetch server-side instead and pass the figure as a prop (avoids a client round-trip, keeps SSR caching). Decide in S0; the client-fetch version above is simplest and matches `ChoroplethTime`.

**Register extra trace modules** in `web/lib/plotly/index.ts`:
```ts
import treemap from "plotly.js/lib/treemap";
import waterfall from "plotly.js/lib/waterfall";
Plotly.register([bar, scatter, choropleth, heatmap, treemap, waterfall]); // + scattergeo only if bubble map kept
```

**Add to `web/lib/api.ts`:** `figure: (id: string, locale: string) => get<FigJSON>(\`/api/figure/${id}${qs({}, { locale })}\`)` and a `FigJSON` type in `web/lib/types.ts`.

## 3. Pages — thin Core→Deep composition
Each `web/app/*/page.tsx` becomes: server component → `const t = <page>Dict[locale]` → lay out `<section>` blocks of `<Figure eyebrow title note asOf>` wrapping `<RemoteFigure chartId locale ariaLabel/>`. No per-chart data fetching on the page (the endpoint does it). Example (home, replacing the discarded `ExplorerChart`/`DivergingMovers`/`SeasonalityHeatmap`):
```tsx
const t = pulseDict[locale];
// KPIs KEPT: still need api.overview for the numbers
const data = await api.overview();
…
<Figure eyebrow={t.demandEyebrow} title={t.demandTitle} note={t.demandNote} asOf={data.as_of}>
  <RemoteFigure chartId="pulse.demand_ribbon" locale={locale} ariaLabel={t.demandAria} />
</Figure>
```
`KpiTile`, `KeyPoints`, the hero, and the shell stay. The Pulse page keeps `api.overview()` only for KPI numbers + key points.

## 4. Sliders (factory side)
Add an optional `animate` path to snapshot factories (treemaps first — Bruce's example) that emits **one `go.Frame` per period** + a `sliders` entry (+ optional play `updatemenus`), exactly like `ChoroplethTime`'s layout:
```python
def treemap(ds, animate=None):           # animate in {None, "by-year", "by-month"}
    if not animate: …return static latest-window figure…
    periods = …                          # e.g. each year
    frames = [go.Frame(name=p, data=[_treemap_trace(ds, p)]) for p in periods]
    fig = go.Figure(data=frames[-1].data, frames=frames)
    fig.update_layout(sliders=[{ "active": len(periods)-1, "steps": [
        {"label": p, "method": "animate",
         "args": [[p], {"mode": "immediate", "frame": {"duration": 0, "redraw": True},
                        "transition": {"duration": 0}}]} for p in periods] }])
    return fig
```
`fig.to_json()` includes `frames`; `RemoteFigure.addFrames` renders them; Plotly's native slider drives it — no React state. Apply to: treemaps, choropleths, occ×province & occ×industry heatmaps, rankings, concentration.

## 5. i18n seam
- **Titles/eyebrows/notes:** owned by the page i18n dicts (`web/lib/i18n/dict/page-*.ts`), EN+FR — already the site's pattern. The bridge strips `layout.title` (§1).
- **In-figure text** (axis titles, hovertemplates, annotations, legend names): thread `locale` from the endpoint → factory; add a small `viz/i18n.py` EN/FR map for recurring chrome (axis titles like "advertised hourly wage", band labels "COVID"/"provisional"). Can ship EN first and complete FR in stage S5. Taxonomy labels (NOC/NAICS/skill names) stay untranslated, as today.

## 6. Theme parity (one-time)
- Confirm `aclmr_light`'s `paper_bgcolor`/`plot_bgcolor` are transparent (or set transparent in `build()`) so figures sit flush on the cream `.card`.
- Confirm the figure font resolves on the web (`aclmr_light` uses Inter; the web uses PT Sans — pick one for the figures, or let the figure keep Inter; decide in S0 for visual consistency).

## 7. Per-stage file checklist
- **S0:** `api/figures.py` (2 ids) · `api/routers/figures.py` · `api/main.py` (+router) · `api/tests/test_figures.py` · `web/lib/plotly/index.ts` (+treemap/waterfall) · `web/components/RemoteFigure.tsx` · `web/lib/api.ts` + `web/lib/types.ts`. Acceptance: a redesign2 figure renders in a page with its own look; template + (a treemap's) frames travel.
- **S1 (Pulse):** populate REGISTRY with pulse ids; rewrite `web/app/page.tsx` to RemoteFigure (keep KPIs); add EN/FR chart chrome to `page-pulse.ts`.
- **S2 (sliders):** `animate` path in treemap/choropleth/heatmap factories; verify drag-through-time.
- **S3:** geography, occupations, industries, pay, skills, quality pages + registry ids.
- **S4:** delete discarded `web/components/*Chart*`, `ExplorerView`, unused `api/routers/read.py` endpoints + their `web/lib/api.ts` methods + `web/lib/types.ts` types; prune imports.
- **S5:** finish FR for all in-figure text; FR walkthrough.

## 8. Unknowns to settle during S0 (cheap to verify, costly to assume)
1. Does the inlined `aclmr_light` template fully round-trip through `to_json()` → `newPlot` (look identical to the review page)?
2. Frames over the wire: any size/perf issue for the biggest animated figures? (treemap × ~7 years should be tiny.)
3. Partial-bundle type casts needed for treemap/waterfall (expect the same `unknown` casts `ChoroplethTime` uses).
4. Server-fetch vs client-fetch for `RemoteFigure` (SSR caching vs simplicity).
5. Font choice for figures (Inter vs PT Sans) for cross-figure consistency.
