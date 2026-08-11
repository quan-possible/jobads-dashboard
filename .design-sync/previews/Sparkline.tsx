import { Sparkline } from "web";

// Sparkline is decorative (aria-hidden) and carries no text of its own — the
// canonical use is inside KpiTile (web/components/KpiTile.tsx:87), which pairs
// it with a label and a value. Each cell below reproduces that pairing so the
// trend cue is legible in context rather than floating as a bare SVG.
//
// The only colour the app ever passes is `var(--orange)` (accent tiles, the
// default) or `var(--teal)` (everything else) — those are the two cells that
// matter. `fill` and the width/height pair are the remaining axes.
//
// Series are raw levels, not percentages: the component min-max normalises
// whatever it is given, so posting counts, dollar wages and index points all
// render on the same shape. Nothing here goes through lib/format.ts.
//
// Deliberately skipped: the `data.length < 2` guard, which returns an empty
// spacer div and would capture as an indistinguishable blank cell.

export const RisingDemand = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="eyebrow mb-1">Demand index</div>
    <div className="num mb-2 text-[1.6rem] font-bold leading-none text-navy-deep">118</div>
    <Sparkline data={[100, 103, 99, 106, 112, 109, 115, 118]} />
  </div>
);

export const CoolingPostings = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="eyebrow mb-1">Active postings · Alberta</div>
    <div className="num mb-2 text-[1.6rem] font-bold leading-none text-navy-deep">48.2K</div>
    <Sparkline
      data={[52100, 51400, 50800, 49900, 49100, 48600, 48200]}
      stroke="var(--teal)"
    />
  </div>
);

export const LineOnlyNoFill = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="eyebrow mb-1">Median posted wage</div>
    <div className="num mb-2 text-[1.6rem] font-bold leading-none text-navy-deep">$28.50</div>
    <Sparkline
      data={[26.1, 26.4, 27.0, 27.2, 27.9, 28.2, 28.5]}
      stroke="var(--teal)"
      fill={false}
    />
  </div>
);

export const VolatileMonthlySeries = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="eyebrow mb-1">Health occupations · new postings</div>
    <div className="num mb-2 text-[1.6rem] font-bold leading-none text-navy-deep">9,140</div>
    <Sparkline
      data={[7200, 8600, 6900, 10400, 7800, 11200, 8300, 9900, 7400, 10800, 8100, 9140]}
      stroke="var(--orange)"
    />
  </div>
);

export const TallWideVariant = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="eyebrow mb-1">Ontario postings · 24 months</div>
    <Sparkline
      data={[
        118000, 121500, 126200, 131000, 129400, 134800, 138100, 141600, 139200,
        136400, 132900, 128700, 124300, 121800, 119500, 117200, 115900, 118400,
        122100, 125700, 127300, 124900, 121600, 119800,
      ]}
      width={240}
      height={64}
      stroke="var(--teal)"
    />
  </div>
);

export const FlatSeries = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="eyebrow mb-1">Employment type coverage</div>
    <div className="num mb-2 text-[1.6rem] font-bold leading-none text-navy-deep">97%</div>
    <Sparkline data={[96.8, 97.1, 96.9, 97.0, 97.2, 97.0, 97.1]} stroke="var(--teal)" />
  </div>
);
