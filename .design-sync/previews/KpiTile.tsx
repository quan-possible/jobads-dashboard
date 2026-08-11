import { KpiTile } from "web";

// The four tiles in the dashboard hero row (app/page.tsx), with real
// labour-market shapes: a lead index, a level with month-over-month movement,
// a trend-valued tile, and a wage tile whose sample is too thin to trend.
//
// `delta` and `valueTrend` are PERCENTAGE POINTS, not fractions — the app
// passes `demand_index - 100` and `active_mom_pct` straight through.

export const LeadMetric = () => (
  <div style={{ maxWidth: 300 }}>
    <KpiTile
      accent
      label="Demand index"
      value="118"
      context="vs. 2019 baseline = 100"
      delta={18}
      deltaLabel="vs. baseline"
      spark={[100, 103, 99, 106, 112, 109, 115, 118]}
    />
  </div>
);

export const LevelWithMonthlyChange = () => (
  <div style={{ maxWidth: 300 }}>
    <KpiTile
      label="Active postings"
      value="48.2K"
      context="Alberta, all occupations"
      delta={-4.2}
      deltaLabel="vs. last month"
      spark={[52100, 51400, 50800, 49900, 49100, 48600, 48200]}
      sparkColor="var(--teal)"
    />
  </div>
);

export const TrendAsHeadline = () => (
  <div style={{ maxWidth: 300 }}>
    <KpiTile
      label="Year over year"
      value="6.4%"
      valueTrend={6.4}
      context="active postings, 12-month change"
      spark={[-2.0, 1.0, 3.0, 2.0, 5.0, 6.0, 6.4]}
      sparkColor="var(--teal)"
    />
  </div>
);

export const CoolingTrend = () => (
  <div style={{ maxWidth: 300 }}>
    <KpiTile
      label="Year over year"
      value="3.1%"
      valueTrend={-3.1}
      context="active postings, 12-month change"
      spark={[4.0, 3.2, 1.8, 0.4, -1.2, -2.4, -3.1]}
      sparkColor="var(--teal)"
    />
  </div>
);

export const WageWithUnit = () => (
  <div style={{ maxWidth: 300 }}>
    <KpiTile
      label="Median posted wage"
      value="$28.50"
      unit="/hr"
      context="n = 12.4K"
      spark={[26.1, 26.4, 27.0, 27.2, 27.9, 28.2, 28.5]}
      sparkColor="var(--teal)"
    />
  </div>
);

export const InsufficientSample = () => (
  <div style={{ maxWidth: 300 }}>
    <KpiTile
      label="Median posted wage"
      value="—"
      context="too few wage-bearing postings"
    />
  </div>
);
