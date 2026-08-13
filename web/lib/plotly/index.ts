// Partial Plotly bundle — register only the trace types the dashboard uses so we
// ship ~300-350 KB gzipped instead of the full ~3.5 MB plotly.js. Client-only:
// import this lazily (dynamic import inside an effect), never at SSR time.
//
// Registered traces: scatter (line/area/band), bar (movers/skills), choropleth
// (geography map), heatmap (seasonality / occ×province), treemap (occupation /
// industry volume) and waterfall (growth reconciliation). Together these cover
// every dashboard chart while keeping the bundle well under the full ~3.5 MB.
import Plotly from "plotly.js/lib/core";
import bar from "plotly.js/lib/bar";
import scatter from "plotly.js/lib/scatter";
import choropleth from "plotly.js/lib/choropleth";
import heatmap from "plotly.js/lib/heatmap";
import treemap from "plotly.js/lib/treemap";
import waterfall from "plotly.js/lib/waterfall";
import fr from "plotly.js/lib/locales/fr";

Plotly.register([bar, scatter, choropleth, heatmap, treemap, waterfall, fr]);

export default Plotly;
