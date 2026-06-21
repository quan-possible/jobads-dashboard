// The house Plotly theme — "Economist chart grammar, warm skin". One template
// applied to every figure; the editorial frame (eyebrow, headline, source) is
// HTML, so Plotly draws no title and the top margin stays tiny.
import type { Config, Layout, Template } from "plotly.js";

// Palette (mirrors lib/plotTheme + globals.css). Orange is RESERVED for the one
// signature/primary series and brand chrome — never a generic category.
export const PC = {
  // data colorway: cool, CVD-aware, distinct from the orange brand
  colorway: ["#345961", "#6f93a0", "#3f7a5c", "#8a5f86", "#9a6a3c", "#c2a23f", "#485b66"],
  primary: "#cf7730", // orange — the signature series / brand
  primarySoft: "#f0c79f",
  teal: "#345961",
  growth: "#2c765c",
  decline: "#b54e33",
  baseline: "#041c2c", // navy, dashed reference
  // warm sequential ramp for maps / heatmaps
  sequential: ["#efe2d2", "#e3bd92", "#d59257", "#cf7730", "#a4531b"] as const,
  ground: "#fbf8f5",
  grid: "#e6e0da",
  ink: "#16242f",
  inkFaint: "#616a71",
  surface: "#ffffff",
} as const;

export const PLOT_FONT =
  "var(--font-pt-sans), PT Sans, ui-sans-serif, system-ui, sans-serif";

// The template. `layout.template = aclmrWarm` on every newPlot/react call.
export const aclmrWarm: Template = {
  layout: {
    font: { family: PLOT_FONT, size: 13, color: PC.ink },
    colorway: [...PC.colorway],
    paper_bgcolor: "rgba(0,0,0,0)", // the card supplies the cream ground
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 44, r: 16, t: 8, b: 28 }, // title is HTML → tiny top margin
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: PC.surface,
      bordercolor: PC.grid,
      font: { family: PLOT_FONT, color: PC.ink, size: 12 },
    },
    showlegend: false, // prefer direct end-labels over a legend
    xaxis: {
      showgrid: false,
      zeroline: false,
      showline: false,
      ticks: "outside",
      ticklen: 4,
      tickcolor: PC.grid,
      tickfont: { color: PC.inkFaint, size: 11 },
      automargin: true,
    },
    yaxis: {
      showgrid: true,
      gridcolor: PC.grid,
      zeroline: false,
      showline: false,
      ticks: "",
      tickfont: { color: PC.inkFaint, size: 11 },
      automargin: true,
    },
  } as Partial<Layout>,
} as Template;

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

/** Parse a 'YYYY-MM' string to a UTC midnight Date at the first of the month. */
export function monthDate(iso: string): Date {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, 1));
}
