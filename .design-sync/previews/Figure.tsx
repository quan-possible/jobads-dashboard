import { Figure, Sparkline } from "web";

// Figure is the chart FRAME every dashboard chart goes through: eyebrow /
// finding-first title / as-of stamp / body / source-and-denominator note, plus
// an optional `actions` slot rendered next to the stamp. Canonical usage lives
// in web/app/wages/page.tsx and web/app/geography/page.tsx, where the body is
// always a <RemoteFigure>. RemoteFigure is not part of the exported design-
// system surface, so these cards stand in a statically renderable body built
// from the exported <Sparkline> plus token-styled bar rows — the frame is what
// is under review, not the plotting. (For the frame wrapped around a real
// Plotly chart, see the InsideAFigureFrame card on MapToggle.)
//
// FullFrame: everything on — the four-slot default from the wages page.
// WithYearPicker: the `actions` slot carrying TunableFigure's year selects.
// TitleOnly: the method-page shape — eyebrow + title, no stamp, no note.
// DenseNote: the worst-case wrap — a long finding-first title next to the
// as-of stamp, over a four-sentence denominator note.
//
// asOf is an ISO year-month; Figure runs it through fmtMonth for the locale.
// Postings and wages are internally consistent (counts sum to 448,400; wage
// midpoints sit either side of the $26.40 all-occupation median).

const HEALTH_TREND = [4120, 4260, 4180, 4390, 4610, 4550, 4780, 4930, 5110, 5040, 5290, 5480];

const PROVINCE_ROWS = [
  { name: "Ontario", postings: 174_900 },
  { name: "Quebec", postings: 84_600 },
  { name: "British Columbia", postings: 67_800 },
  { name: "Alberta", postings: 64_700 },
  { name: "Manitoba", postings: 15_600 },
  { name: "Saskatchewan", postings: 13_300 },
  { name: "Atlantic Canada", postings: 25_900 },
];

const WAGE_ROWS = [
  { name: "Trades and transport", wage: 30.5 },
  { name: "Health occupations", wage: 29.2 },
  { name: "Natural and applied sciences", wage: 34.8 },
  { name: "Business and finance", wage: 27.6 },
  { name: "Sales and service", wage: 19.4 },
];

const rowGrid = {
  display: "grid",
  gridTemplateColumns: "132px minmax(0, 1fr) 62px",
  alignItems: "center",
  columnGap: 12,
  rowGap: 10,
} as const;

const Track = ({ pct, colour }: { pct: number; colour: string }) => (
  <span style={{ display: "block", height: 12, background: "var(--hairline)", borderRadius: 2 }}>
    <span style={{ display: "block", height: 12, width: `${pct}%`, background: colour, borderRadius: 2 }} />
  </span>
);

const PostingRows = () => {
  const max = Math.max(...PROVINCE_ROWS.map((p) => p.postings));
  return (
    <div style={rowGrid}>
      {PROVINCE_ROWS.map((p) => (
        <div key={p.name} style={{ display: "contents" }}>
          <span className="t-meta text-ink-soft">{p.name}</span>
          <Track pct={(p.postings / max) * 100} colour="var(--cat-1)" />
          <span className="num t-meta text-ink-faint" style={{ textAlign: "right" }}>
            {p.postings.toLocaleString("en-CA")}
          </span>
        </div>
      ))}
    </div>
  );
};

const WageRows = () => {
  const max = Math.max(...WAGE_ROWS.map((w) => w.wage));
  return (
    <div style={rowGrid}>
      {WAGE_ROWS.map((w) => (
        <div key={w.name} style={{ display: "contents" }}>
          <span className="t-meta text-ink-soft">{w.name}</span>
          <Track pct={(w.wage / max) * 100} colour="var(--orange)" />
          <span className="num t-meta text-ink-faint" style={{ textAlign: "right" }}>
            ${w.wage.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

const YearPicker = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span className="t-caption uppercase tracking-[0.03em] text-ink-faint">From</span>
    <select
      aria-label="From year"
      defaultValue="2022"
      className="num rounded border border-card-border bg-surface-alt px-1.5 py-0.5 t-caption font-bold text-ink-soft"
    >
      <option>2022</option>
      <option>2023</option>
    </select>
    <span className="t-caption text-ink-faint">to</span>
    <select
      aria-label="To year"
      defaultValue="2025"
      className="num rounded border border-card-border bg-surface-alt px-1.5 py-0.5 t-caption font-bold text-ink-soft"
    >
      <option>2024</option>
      <option>2025</option>
    </select>
  </div>
);

export const FullFrame = () => (
  <div style={{ maxWidth: 560 }}>
    <Figure
      eyebrow="Where demand sits"
      title="Ontario advertises more jobs than Quebec and British Columbia combined"
      asOf="2026-05"
      note="Online job postings, Vicinity Jobs. Share of postings with a resolved province (94% of the month). The four Atlantic provinces are folded into one group under the ten-category cap."
    >
      <PostingRows />
    </Figure>
  </div>
);

export const WithYearPicker = () => (
  <div style={{ maxWidth: 560 }}>
    <Figure
      eyebrow="Health occupations"
      title="Nursing and support roles have added postings every quarter since 2024"
      asOf="2026-05"
      actions={<YearPicker />}
      note="Indexed to Jan 2022 = 100. Three-month moving average."
    >
      <div style={{ paddingBlock: 8 }}>
        <Sparkline data={HEALTH_TREND} width={480} height={120} />
      </div>
    </Figure>
  </div>
);

export const TitleOnly = () => (
  <div style={{ maxWidth: 560 }}>
    <Figure eyebrow="Method" title="What the ten-category cap does">
      <p className="text-ink-soft">
        Every chart shows at most ten categories. Smaller groups are folded into a labelled residual —
        the four Atlantic provinces become “Atlantic Canada”, and the remaining occupations become
        “All other occupations”. Nothing is dropped, so the totals still reconcile.
      </p>
    </Figure>
  </div>
);

export const DenseNote = () => (
  <div style={{ maxWidth: 560 }}>
    <Figure
      eyebrow="Advertised wages"
      title="Advertised hourly pay in trades and transport sits $4.10 above the all-occupation median, and the gap has widened for three straight years"
      asOf="2026-05"
      note="Midpoint of the advertised range, taken where a posting gives a band. The denominator is the 41% of postings that state a wage, so the level is not representative of all vacancies — read the spread between groups rather than the level itself. The all-occupation median for the month is $26.40. Vicinity Jobs terms cap redistribution of the underlying postings."
    >
      <WageRows />
    </Figure>
  </div>
);
