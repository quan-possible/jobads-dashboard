import { Figure, MapToggle } from "web";

// MapToggle is a segmented tablist over PRE-FETCHED figure variants: the server
// fetches every measure, the client only chooses which one renders, so no
// measure logic ships to the browser. Canonical usage is web/app/geography/
// page.tsx, where the provincial map is offered as share / count / per-capita /
// location quotient inside a <Figure>.
//
// The figure JSON below is authored inline rather than fetched — the real app
// gets it from the Python bridge with the aclmr_light template already inlined,
// so these variants restate the brand colours by hand. Bar is one of the six
// trace types registered in the partial Plotly bundle (web/lib/plotly/index.ts).
// Only the FIRST tab renders on load, so each card shows its default measure
// and the remaining tabs show the unselected state of the control.
//
// The axis these cards sweep is the SHAPE of the control, which is what varies
// in the app: how many measures are offered, and whether the toggle stands
// alone or sits inside a chart frame.
//
// ProvincialMeasures: the four-measure geography toggle, standalone.
// InsideAFigureFrame: the real composition — MapToggle as a Figure body.
// TwoMeasures: the narrow two-option case (a toggle, not a tab strip).
// SixMeasuresWrapped: the tablist wraps to a second row rather than overflowing.

// Eight categories, under the standing ten-category cap: the four Atlantic
// provinces are folded into one group and the three territories into another.
// Every measure is derived from one set of counts (448,400 postings) and 2026
// populations, so share / per-capita / LQ reconcile with the count bars.
const PROVINCES = ["ON", "QC", "BC", "AB", "MB", "SK", "Atlantic Canada", "Territories"];

const bar = (values: number[], title: string, suffix: string, colour: string | string[]) => ({
  data: [
    {
      type: "bar",
      orientation: "h",
      y: [...PROVINCES].reverse(),
      x: [...values].reverse(),
      marker: { color: Array.isArray(colour) ? [...colour].reverse() : colour },
      hovertemplate: `%{y}: %{x}${suffix}<extra></extra>`,
    },
  ],
  layout: {
    height: 300,
    margin: { l: 116, r: 46, t: 34, b: 34 },
    title: { text: title, font: { size: 13, color: "#041c2c" }, x: 0, xanchor: "left" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "PT Sans, sans-serif", size: 12, color: "#5d6b74" },
    xaxis: { gridcolor: "#e6e0da", zerolinecolor: "#b9ab9d", ticksuffix: suffix },
    yaxis: { ticklabelposition: "outside", ticklen: 6, tickcolor: "rgba(0,0,0,0)" },
    showlegend: false,
  },
});

const YOY = [4.2, -1.6, 2.8, 6.1, 0.9, -0.4, 1.7, -3.2];

const MEASURE_FIGS = {
  share: bar([39.0, 18.9, 15.1, 14.4, 3.5, 3.0, 5.8, 0.4], "Share of national postings", "%", "#cf7730"),
  count: bar([174900, 84600, 67800, 64700, 15600, 13300, 25900, 1600], "Postings in the month", "", "#345961"),
  percap: bar([11.0, 9.4, 12.1, 13.2, 10.4, 10.6, 9.9, 12.3], "Postings per 1,000 residents", "", "#6f93a0"),
  lq: bar([1.0, 0.86, 1.1, 1.2, 0.95, 0.97, 0.9, 1.12], "Location quotient vs Canada", "", "#9a6a3c"),
  yoy: bar(YOY, "Change on the same month last year", "%", YOY.map((v) => (v >= 0 ? "#2c765c" : "#b54e33"))),
  exposure: bar(
    [34.1, 29.8, 33.2, 30.6, 27.4, 26.1, 26.9, 24.3],
    "Share of postings in high AI-exposure occupations",
    "%",
    "#345961",
  ),
};

const MEASURE_OPTIONS = [
  { value: "share", label: "Share" },
  { value: "count", label: "Postings" },
  { value: "percap", label: "Per 1,000" },
  { value: "lq", label: "LQ" },
];

export const ProvincialMeasures = () => (
  <div style={{ maxWidth: 560 }}>
    <MapToggle
      options={MEASURE_OPTIONS}
      figs={MEASURE_FIGS}
      height={300}
      ariaLabel="Advertised demand by province, choose a measure"
    />
  </div>
);

export const InsideAFigureFrame = () => (
  <div style={{ maxWidth: 560 }}>
    <Figure
      eyebrow="Where demand sits"
      title="Alberta advertises the most jobs per resident; Ontario the most in total"
      asOf="2026-05"
      note="Online job postings, Vicinity Jobs. The four Atlantic provinces are folded into one group to keep the chart at ten categories."
    >
      <MapToggle
        options={MEASURE_OPTIONS}
        figs={MEASURE_FIGS}
        height={300}
        ariaLabel="Advertised demand by province, choose a measure"
      />
    </Figure>
  </div>
);

export const TwoMeasures = () => (
  <div style={{ maxWidth: 560 }}>
    <MapToggle
      options={[
        { value: "count", label: "Postings" },
        { value: "percap", label: "Per 1,000" },
      ]}
      figs={{ count: MEASURE_FIGS.count, percap: MEASURE_FIGS.percap }}
      height={300}
      ariaLabel="Advertised demand by province, count or per capita"
    />
  </div>
);

export const SixMeasuresWrapped = () => (
  <div style={{ maxWidth: 560 }}>
    <MapToggle
      options={[
        { value: "yoy", label: "Year over year" },
        { value: "share", label: "Share of Canada" },
        { value: "count", label: "Postings" },
        { value: "percap", label: "Per 1,000 residents" },
        { value: "lq", label: "Location quotient" },
        { value: "exposure", label: "AI exposure" },
      ]}
      figs={MEASURE_FIGS}
      height={300}
      ariaLabel="Advertised demand by province, choose a measure"
    />
  </div>
);
