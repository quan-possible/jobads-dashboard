// Pulse home — recreation of web/app/page.tsx at the 2026-08-11 export point.
const { KpiTile, Figure, KeyPoints, DeepDivider } = NS;

const s = (f, n) => Array.from({ length: n || 24 }, (_, i) => f(i));

function DemandRibbon() {
  const N = 120, W = 720, H = 300;
  const y = (v) => H - 20 - (v - 55) * (H - 52) / 90;
  const base = (i) => {
    const t = i / (N - 1);
    return 97 - 38 * Math.exp(-Math.pow((t - 0.40) / 0.045, 2)) + 38 * Math.exp(-Math.pow((t - 0.63) / 0.11, 2)) + (t > 0.74 ? -(t - 0.74) * 90 : 0) + 4 * Math.sin(t * 9);
  };
  const raw = s((i) => (i * (W / (N - 1))).toFixed(1) + "," + y(base(i) + 3.5 * Math.sin(i * 2.7) + 2 * Math.sin(i * 0.9)).toFixed(1), N).join(" ");
  const arr = s(base, N);
  const sm = arr.map((_, i) => { let a = 0, c = 0; for (let k = -3; k <= 3; k++) { const j = i + k; if (j >= 0 && j < N) { a += arr[j]; c++; } } return a / c; });
  const cut = Math.floor(N * 0.94);
  const avg = sm.slice(0, cut + 1).map((v, i) => (i ? "L" : "M") + (i * (W / (N - 1))).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
  const tail = sm.slice(cut).map((v, k) => ((cut + k) * (W / (N - 1))).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block" }} aria-label="Monthly job-ad postings with a 3-month average and a provisional tail">
      <line x1="0" y1="70" x2={W} y2="70" stroke="var(--chart-grid)" />
      <line x1="0" y1="220" x2={W} y2="220" stroke="var(--chart-grid)" />
      <line x1="0" y1={y(100)} x2={W} y2={y(100)} stroke="var(--chart-axis)" strokeDasharray="4 4" />
      <text x="6" y={y(100) - 6} fontSize="11" fill="var(--ink-faint)">2019 = 100</text>
      <polyline points={raw} fill="none" stroke="var(--sand-soft)" strokeWidth="1.2" />
      <path d={avg} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={tail} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeDasharray="2 6" strokeLinecap="round" />
      {["2016", "2018", "2020", "2022", "2024", "2026"].map((t, i) => (
        <text key={t} x={i * 140} y={H - 2} fontSize="11" fill="var(--ink-faint)">{t}</text>
      ))}
    </svg>
  );
}

function YoyBars() {
  return (
    <svg viewBox="0 0 720 260" style={{ width: "100%", height: "auto", display: "block" }} aria-label="Year-over-year percentage change in postings, by month">
      <line x1="0" y1="130" x2="720" y2="130" stroke="var(--chart-axis)" />
      {s((i) => {
        const v = 13 - 1.5 * i + 5 * Math.sin(i * 1.3);
        const h = Math.max(Math.abs(v) * 3.4, 2);
        return <rect key={i} x={8 + i * 30} y={v > 0 ? 130 - h : 130} width="20" height={h} rx="1" fill={v > 0 ? "var(--pos)" : "var(--neg)"} />;
      })}
    </svg>
  );
}

function Composition() {
  const bnd = (frac, ph, amp) => s((i) => (i ? "L" : "M") + (i * 18).toFixed(1) + " " + (260 * frac + amp * Math.sin(i * 0.45 + ph)).toFixed(1), 41).join(" ");
  const close = (p) => p + " L720 260 L0 260 Z";
  const layers = [["#345961", null], ["#6f93a0", close(bnd(0.24, 0, 9))], ["#c39e80", close(bnd(0.47, 1.4, 10))], ["#9a6a3c", close(bnd(0.68, 2.6, 8))], ["#cf7730", close(bnd(0.85, 3.7, 6))]];
  return (
    <div>
      <svg viewBox="0 0 720 260" style={{ width: "100%", height: "auto", display: "block" }} aria-label="Stacked area of posting share by broad occupation group over time">
        <rect x="0" y="0" width="720" height="260" fill="#345961" />
        {layers.slice(1).map(([c, d]) => <path key={c} d={d} fill={c} />)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12 }}>
        {[["Sales & service", "#345961"], ["Trades & transport", "#6f93a0"], ["Business & finance", "#c39e80"], ["Health", "#9a6a3c"], ["Other", "#cf7730"]].map(([l, c]) => (
          <span key={l} className="t-caption" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-soft)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

function Seasonality() {
  const pal = ["#f7efe9", "#efdec8", "#e5c49b", "#d9a468", "#cf7730", "#a95818"];
  const seas = [1, 1, 2, 3, 3, 2, 2, 3, 4, 5, 3, 0];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (
    <div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ width: 44, flex: "none" }} />
        {months.map((m) => <span key={m} className="t-label" style={{ flex: 1, textAlign: "center", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-faint)" }}>{m}</span>)}
      </div>
      {[2021, 2022, 2023, 2024, 2025, 2026].map((yr) => (
        <div key={yr} style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
          <span className="num t-caption" style={{ width: 44, flex: "none", color: "var(--ink-faint)" }}>{yr}</span>
          {months.map((m, i) => {
            const blank = yr === 2026 && i > 6;
            const idx = Math.max(0, Math.min(5, seas[i] + ((yr * 7 + i * 13) % 3) - 1));
            return <div key={m} style={{ flex: 1, height: 26, borderRadius: 3, background: blank ? "#f3ede4" : pal[idx] }} />;
          })}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
        <span className="t-caption" style={{ color: "var(--ink-faint)" }}>Below year average</span>
        <span style={{ width: 120, height: 8, borderRadius: 4, background: "linear-gradient(90deg,#f7efe9,#cf7730)" }} />
        <span className="t-caption" style={{ color: "var(--ink-faint)" }}>Above</span>
      </div>
    </div>
  );
}

function OccupationTrends() {
  const occ = [["Management", -6.2], ["Business & finance", -4.8], ["Sciences", 2.1], ["Health", 8.4], ["Education & law", -1.9], ["Art & culture", -9.6], ["Sales & service", -12.3], ["Trades & transport", -7.4], ["Natural resources", 0.8], ["Manufacturing", -10.1]];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
      {occ.map(([name, d], k) => {
        const vals = s((i) => 50 - d * 0.5 + (d / 10) * i * 1.2 + 4 * Math.sin(i * 0.8 + k));
        const mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), sp = mx - mn || 1;
        const pts = vals.map((v, i) => (i * (120 / 23)).toFixed(1) + "," + (36 - 30 * ((v - mn) / sp)).toFixed(1)).join(" ");
        return (
          <div key={name} style={{ border: "1px solid var(--hairline)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="t-caption" style={{ fontWeight: 700, color: "var(--ink)", lineHeight: 1.3, minHeight: 30 }}>{name}</span>
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" style={{ width: "100%", height: 40, display: "block" }} aria-hidden>
              <polyline points={pts} fill="none" stroke={d > 0 ? "var(--pos)" : "var(--teal)"} strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
            <span className="num t-caption" style={{ fontWeight: 700, color: d > 0 ? "var(--pos)" : "var(--neg)" }}>
              {d > 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}% <span style={{ fontWeight: 400, color: "var(--ink-faint)" }}>YoY</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Momentum() {
  return (
    <svg viewBox="0 0 720 220" style={{ width: "100%", height: "auto", display: "block" }} aria-label="Bar chart of the gap between the 3-month and 12-month moving averages">
      <line x1="0" y1="110" x2="720" y2="110" stroke="var(--chart-axis)" />
      {s((i) => {
        const v = 9 * Math.sin(i * 0.42) + 7 - i * 0.75;
        const h = Math.max(Math.abs(v) * 4.4, 2);
        return <rect key={i} x={8 + i * 30} y={v > 0 ? 110 - h : 110} width="20" height={h} rx="1" fill={v > 0 ? "var(--teal)" : "var(--orange)"} />;
      })}
    </svg>
  );
}

function Diffusion() {
  const pts = s((i) => (i * (720 / 35)).toFixed(1) + "," + (220 - 2.1 * (63 - 0.75 * i + 5 * Math.sin(i * 0.7))).toFixed(1), 36).join(" ");
  return (
    <svg viewBox="0 0 720 220" style={{ width: "100%", height: "auto", display: "block" }} aria-label="Diffusion index of occupation groups with positive year-over-year postings">
      <line x1="0" y1="115" x2="720" y2="115" stroke="var(--chart-axis)" strokeDasharray="4 4" />
      <text x="6" y="110" fontSize="11" fill="var(--ink-faint)">50 = evenly split</text>
      <polyline points={pts} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function PulseScreen() {
  const asOf = "Jul 2026";
  return (
    <div style={{ paddingBottom: 16 }}>
      <section style={{ borderBottom: "1px solid var(--card-border)", background: "linear-gradient(to bottom, rgba(247,239,233,.6), var(--canvas))" }}>
        <div className="container-x" style={{ paddingBlock: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Labour Market Pulse · July 2026</div>
          <h1 className="h-display" style={{ margin: 0, maxWidth: "56rem", textWrap: "balance" }}>Canada’s hiring is 12% below its 2019 baseline.</h1>
          <p className="lede" style={{ marginTop: 16, maxWidth: "42rem" }}>A monthly read on posted hiring across Canada’s regions, occupations and industries. Job ads measure posted demand — not employment or vacancies.</p>
        </div>
      </section>

      <section className="container-x" style={{ paddingBlock: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <KpiTile accent label="Postings index" value="88" context="2019 = 100" delta={-12} deltaLabel="vs baseline" spark={s((i) => 30 - i * 0.8 + 2.5 * Math.sin(i * 0.9))} />
          <KpiTile label="Active postings" value="412K" context="this month" delta={3.1} deltaLabel="MoM" spark={s((i) => 10 + i * 0.5 + 3 * Math.sin(i * 0.7))} sparkColor="var(--teal)" />
          <KpiTile label="Vs last year" value="8.4%" valueTrend={-8.4} context="year over year" spark={s((i) => 20 - i * 0.7 + 3 * Math.sin(i * 1.1))} sparkColor="var(--teal)" />
          <KpiTile label="Median wage" value="$28.50" unit="/hr" context="n = 212K" spark={s((i) => 8 + i * 0.55 + 2 * Math.sin(i * 0.8))} sparkColor="var(--teal)" />
        </div>
      </section>

      <section className="container-x" style={{ paddingBlock: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>
          <Figure eyebrow="Postings over time" title="Posted hiring: monthly job-ad postings" asOf={asOf} note="Faint line = raw monthly count · bold = 3-month average · dotted tail = provisional. Counts partly reflect scraping coverage over time, not hiring alone.">
            <DemandRibbon />
          </Figure>
          <KeyPoints points={[
            "Postings are 12% below the 2019 baseline — the widest gap since early 2021.",
            "Health is the only broad occupation group with year-over-year growth (▲ 8.4%).",
            "Alberta and Saskatchewan are holding up better than the national trend.",
            "The 3-month average has cooled for five consecutive months.",
          ]} />
        </div>
      </section>

      <section className="container-x" style={{ paddingBlock: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Figure eyebrow="Year over year" title="Growth and decline in postings, year over year" asOf={asOf} note="Each bar compares a month with the same month a year earlier.">
            <YoyBars />
          </Figure>
          <Figure eyebrow="Occupational mix" title="How the occupational mix shifts over time" asOf={asOf} note="Share of monthly postings by broad occupation group (top groups + Other).">
            <Composition />
          </Figure>
        </div>
      </section>

      <section className="container-x" style={{ paddingBlock: 16 }}>
        <Figure eyebrow="Seasonality · month by year" title="When in the year are postings strongest?" asOf={asOf} note="Each cell is that month relative to its own year’s average, so the seasonal shape shows through the trend.">
          <Seasonality />
        </Figure>
      </section>

      <DeepDivider lede="Decomposition and diagnostics for readers who want the mechanics behind the headline." />

      <section className="container-x" style={{ paddingBlock: 16 }}>
        <Figure eyebrow="Occupation small-multiples" title="Every occupation group’s posting trajectory at a glance" asOf={asOf} note="Monthly postings 2016–2026, one panel per broad NOC group (each panel scaled to its own peak).">
          <OccupationTrends />
        </Figure>
      </section>

      <section className="container-x" style={{ paddingBlock: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Figure eyebrow="Momentum" title="Is hiring speeding up or cooling?" asOf={asOf} note="Gap between the 3-month and 12-month averages · teal = accelerating, orange = cooling.">
            <Momentum />
          </Figure>
          <Figure eyebrow="Breadth of growth" title="Is growth broad or narrow?" asOf={asOf} note="Share of broad occupation groups with positive year-over-year postings; 50 = evenly split (3-month smoothed).">
            <Diffusion />
          </Figure>
        </div>
      </section>
    </div>
  );
}

window.PulseScreen = PulseScreen;
