// Geography — the measure-switching province view (MapToggle + CoverageBar rail).
const { Figure, MapToggle, CoverageBar, KpiTile } = NS;

const PROVINCES = [
  ["Ontario", 148000, 0.36], ["Quebec", 78000, 0.19], ["British Columbia", 61000, 0.15],
  ["Alberta", 54000, 0.13], ["Manitoba", 17000, 0.04], ["Saskatchewan", 14000, 0.034],
  ["Nova Scotia", 12000, 0.029], ["New Brunswick", 9000, 0.022], ["Newfoundland & Labrador", 6000, 0.015],
  ["Prince Edward Island", 2000, 0.005],
];

function ProvinceBars({ tint }) {
  const max = PROVINCES[0][1];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {PROVINCES.map(([name, count], i) => (
        <div key={name} style={{ display: "grid", gridTemplateColumns: "180px 1fr 72px", alignItems: "center", gap: 12 }}>
          <span className="t-body-sm" style={{ color: "var(--ink)" }}>{name}</span>
          <div style={{ height: 18, background: "var(--surface-alt)", borderRadius: 2 }}>
            <div style={{ height: "100%", borderRadius: 2, width: (count / max) * 100 + "%", background: i === 0 ? "var(--orange)" : tint }} />
          </div>
          <span className="num t-body-sm" style={{ textAlign: "right", fontWeight: 700, color: "var(--navy-deep)" }}>
            {(count / 1000).toFixed(0)}K
          </span>
        </div>
      ))}
    </div>
  );
}

function GeographyScreen() {
  return (
    <div style={{ paddingBottom: 16 }}>
      <section style={{ borderBottom: "1px solid var(--card-border)", background: "linear-gradient(to bottom, rgba(247,239,233,.6), var(--canvas))" }}>
        <div className="container-x" style={{ paddingBlock: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Regional snapshot · July 2026</div>
          <h1 className="h-display" style={{ margin: 0, maxWidth: "48rem", textWrap: "balance" }}>Where posted demand sits across the provinces</h1>
          <p className="lede" style={{ marginTop: 16, maxWidth: "42rem" }}>Counts, shares and per-capita intensity of active postings. Provincial coverage varies — read the coverage rail before comparing regions.</p>
        </div>
      </section>

      <section className="container-x" style={{ paddingBlock: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <KpiTile accent label="Active postings" value="412K" context="all provinces" delta={3.1} deltaLabel="MoM" />
          <KpiTile label="Leading province" value="Ontario" context="36% of postings" />
          <KpiTile label="Fastest growing" value="Alberta" context="▲ 5.2% MoM" />
          <KpiTile label="Provinces reported" value="10" context="of 10" />
        </div>
      </section>

      <section className="container-x" style={{ paddingBlock: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20, alignItems: "start" }}>
          <Figure eyebrow="Regional snapshot" title="Active postings by province this month" asOf="Jul 2026" note="Counts of active postings. Ten categories maximum in any public view; smaller jurisdictions are never dropped silently.">
            <MapToggle ariaLabel="Measure"
              options={[{ value: "count", label: "Count" }, { value: "share", label: "Share" }, { value: "pc", label: "Per capita" }, { value: "lq", label: "Location quotient" }]}
              views={{
                count: <ProvinceBars tint="var(--cat-1)" />,
                share: <ProvinceBars tint="var(--cat-3)" />,
                pc: <ProvinceBars tint="var(--cat-5)" />,
                lq: <ProvinceBars tint="var(--cat-8)" />,
              }} />
          </Figure>
          <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Data quality</div>
              <h2 className="h-card" style={{ margin: 0 }}>Field coverage</h2>
            </div>
            <CoverageBar label="Province" share={0.99} count={412800} />
            <CoverageBar label="City" share={0.87} count={359100} />
            <CoverageBar label="Wage" share={0.52} count={212000} />
            <CoverageBar label="Education" share={0.28} count={94000} />
            <p className="t-caption" style={{ margin: "auto 0 0", color: "var(--ink-faint)", lineHeight: 1.6 }}>
              Bars turn orange below 40% coverage — those fields are too sparse to read regionally.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

window.GeographyScreen = GeographyScreen;
