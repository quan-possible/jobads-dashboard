// Plotly client config shared by every figure host. The figures themselves
// arrive pre-themed from the Python figure bridge (api/figures.py inlines the
// aclmr_light template), so the web side only supplies the modebar config.
import type { Config } from "plotly.js";

export const baseConfig: Partial<Config> = {
  displaylogo: false,
  responsive: true,
  // our own CSV/PNG buttons handle download; trim the rest of the modebar
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "autoScale2d",
    "zoomIn2d",
    "zoomOut2d",
    "pan2d",
    "toImage",
  ],
};
