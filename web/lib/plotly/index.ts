// Partial Plotly bundle — register only the trace types the dashboard uses so we
// ship ~300-350 KB gzipped instead of the full ~3.5 MB plotly.js. Client-only:
// import this lazily (dynamic import inside an effect), never at SSR time.
//
// Registered traces: scatter (line/area/band), bar (movers/skills), choropleth
// (geography map) and heatmap (seasonality / occ×province). Together these cover
// every dashboard chart while keeping the bundle to ~350-400 KB gzipped.
import Plotly from "plotly.js/lib/core";
import bar from "plotly.js/lib/bar";
import scatter from "plotly.js/lib/scatter";
import choropleth from "plotly.js/lib/choropleth";
import heatmap from "plotly.js/lib/heatmap";

Plotly.register([bar, scatter, choropleth, heatmap]);

export default Plotly;
