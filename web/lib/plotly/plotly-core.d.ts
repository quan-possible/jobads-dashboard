// The partial-bundle entry points ship no types of their own. `core` is the
// real Plotly object (typed by @types/plotly.js); the trace modules are opaque
// registrables passed to Plotly.register().
declare module "plotly.js/lib/core" {
  import type Plotly from "plotly.js";
  const core: typeof Plotly & { register: (modules: unknown | unknown[]) => void };
  export default core;
}
declare module "plotly.js/lib/bar" {
  const trace: unknown;
  export default trace;
}
declare module "plotly.js/lib/scatter" {
  const trace: unknown;
  export default trace;
}
declare module "plotly.js/lib/heatmap" {
  const trace: unknown;
  export default trace;
}
declare module "plotly.js/lib/choropleth" {
  const trace: unknown;
  export default trace;
}
declare module "plotly.js/lib/treemap" {
  const trace: unknown;
  export default trace;
}
declare module "plotly.js/lib/waterfall" {
  const trace: unknown;
  export default trace;
}
