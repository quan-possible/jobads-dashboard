// Explore — team-gated surface: auth gate, then the filter spine + posting lookup.
const { Select, Figure } = NS;

const ROWS = [
  ["65563604", "Registered nurse — acute care", "Edmonton, AB", "$41.25", "Jul 28"],
  ["65559812", "Licensed practical nurse", "Calgary, AB", "$32.00", "Jul 27"],
  ["65551190", "Health care aide — continuing care", "Red Deer, AB", "$24.50", "Jul 25"],
  ["65548077", "Registered nurse — emergency", "Edmonton, AB", "$43.10", "Jul 25"],
  ["65540233", "Medical laboratory technologist", "Lethbridge, AB", "$36.75", "Jul 23"],
  ["65533902", "Pharmacy technician", "Calgary, AB", "$28.90", "Jul 22"],
  ["65529444", "Physiotherapist — outpatient", "Grande Prairie, AB", "$45.00", "Jul 21"],
];

function AuthGate({ onUnlock }) {
  return (
    <div className="container-x" style={{ paddingBlock: 80 }}>
      <div className="card card-pad" style={{ marginInline: "auto", maxWidth: "26rem", textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Team access</div>
        <h2 className="h-section" style={{ margin: "0 0 12px" }}>Team access required</h2>
        <p style={{ margin: "0 0 20px", color: "var(--ink-soft)" }}>
          Explore exposes curated aggregate queries and a bounded posting lookup. Enter the team password to continue.
        </p>
        <input type="password" placeholder="Password" className="control t-body"
          style={{ width: "100%", border: "1px solid var(--card-border)", background: "var(--surface)", padding: "10px 12px", fontFamily: "inherit", color: "var(--ink)" }} />
        <button type="button" onClick={onUnlock} className="control t-meta"
          style={{ width: "100%", marginTop: 10, border: 0, background: "var(--orange)", color: "#fff", padding: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", fontFamily: "inherit", cursor: "pointer" }}>
          Unlock
        </button>
        <p className="t-caption" style={{ margin: "16px 0 0", color: "var(--ink-faint)", lineHeight: 1.6 }}>
          No raw SQL, downloads, or bulk text browsing.
        </p>
      </div>
    </div>
  );
}

function FilterSpine() {
  return (
    <div role="toolbar" aria-label="Scope" style={{ borderBlock: "1px solid var(--card-border)", borderTop: "2px solid var(--orange)", background: "var(--surface-alt)" }}>
      <div className="container-x" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16, paddingBlock: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", marginRight: 4 }}>
          <span className="t-label" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--orange-deep)" }}>Filters</span>
          <span className="t-caption" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--ink-soft)" }}>Scope</span>
        </div>
        <div style={{ display: "grid", flex: 1, gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <Select id="filter-geo" label="Region" value="ab" options={[{ value: "ca", label: "Canada" }, { value: "ab", label: "Alberta" }, { value: "on", label: "Ontario" }]} />
          <Select id="filter-occ" label="Occupation" value="health" options={[{ value: "all", label: "All occupations" }, { value: "health", label: "Health" }]} />
          <Select id="filter-ind" label="Industry" options={[{ value: "all", label: "All industries" }, { value: "hc", label: "Health care" }]} />
        </div>
        <button type="button" className="control t-caption"
          style={{ height: 38, flexShrink: 0, alignSelf: "flex-end", border: "1px solid var(--card-border)", background: "transparent", padding: "0 12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--ink-soft)", fontFamily: "inherit", cursor: "pointer" }}>
          Reset · 2
        </button>
      </div>
    </div>
  );
}

function ExploreScreen() {
  const [unlocked, setUnlocked] = React.useState(false);
  const [selected, setSelected] = React.useState(ROWS[0][0]);
  const row = ROWS.find((r) => r[0] === selected) || ROWS[0];

  return (
    <div style={{ paddingBottom: 16 }}>
      <section style={{ borderBottom: "1px solid var(--card-border)", background: "linear-gradient(to bottom, rgba(247,239,233,.6), var(--canvas))" }}>
        <div className="container-x" style={{ paddingBlock: 56 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Team access · Explore</div>
          <h1 className="h-display" style={{ margin: 0, maxWidth: "44rem", textWrap: "balance" }}>Query the postings behind the aggregates</h1>
          <p className="lede" style={{ marginTop: 16, maxWidth: "42rem" }}>Build a chart from any breakdown and measure, or search the individual job postings behind the ACLMR aggregates. Bounded lookup index — no bulk raw-text browsing.</p>
        </div>
      </section>

      {!unlocked ? <AuthGate onUnlock={() => setUnlocked(true)} /> : (
        <React.Fragment>
          <FilterSpine />
          <div className="container-x" style={{ paddingBlock: 32 }}>
            <div style={{ display: "flex", border: "1px solid var(--card-border)", width: "fit-content", marginBottom: 20 }}>
              <span className="control t-meta" style={{ padding: "8px 18px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)" }}>Chart builder</span>
              <span className="control t-meta" style={{ padding: "8px 18px", fontWeight: 700, textTransform: "uppercase", background: "var(--navy)", color: "var(--canvas)" }}>Specific postings</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
              <Figure eyebrow="Bounded lookup index" title="Postings matching the current scope" asOf="Jul 2026" note="Curated aggregate queries and a bounded posting lookup. No arbitrary SQL, raw downloads, or bulk text browsing.">
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "92px 1fr 130px 74px 70px", gap: 12, paddingBottom: 8, borderBottom: "1px solid var(--card-border)" }}>
                    {["ID", "Title", "Region", "Wage", "First seen"].map((h, i) => (
                      <span key={h} className="t-label" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-faint)", textAlign: i >= 3 ? "right" : "left" }}>{h}</span>
                    ))}
                  </div>
                  {ROWS.map((r) => {
                    const on = r[0] === selected;
                    return (
                      <div key={r[0]} onClick={() => setSelected(r[0])} role="button" tabIndex={0}
                        style={{ display: "grid", gridTemplateColumns: "92px 1fr 130px 74px 70px", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--hairline)", cursor: "pointer", background: on ? "rgba(207,119,48,.08)" : "transparent", boxShadow: on ? "inset 3px 0 0 var(--orange)" : "none" }}>
                        <span className="num t-caption" style={{ color: on ? "var(--orange-deep)" : "var(--ink-faint)", fontWeight: 700, paddingLeft: on ? 8 : 0 }}>{r[0]}</span>
                        <span className="t-body-sm" style={{ fontWeight: on ? 700 : 400, color: "var(--ink)" }}>{r[1]}</span>
                        <span className="t-body-sm" style={{ color: "var(--ink-soft)" }}>{r[2]}</span>
                        <span className="num t-body-sm" style={{ textAlign: "right", color: "var(--navy-deep)", fontWeight: 700 }}>{r[3]}</span>
                        <span className="num t-body-sm" style={{ textAlign: "right", color: "var(--ink-faint)" }}>{r[4]}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
                    <span className="t-caption" style={{ fontWeight: 700, textTransform: "uppercase", color: "var(--ink-faint)" }}>1–7 of 1,284</span>
                    <span style={{ display: "flex", gap: 14 }}>
                      <span className="t-caption" style={{ fontWeight: 700, textTransform: "uppercase", color: "var(--ink-faint)" }}>← Prev</span>
                      <span className="t-caption" style={{ fontWeight: 700, textTransform: "uppercase", color: "var(--orange-deep)" }}>Next →</span>
                    </span>
                  </div>
                </div>
              </Figure>

              <div className="card card-pad" style={{ background: "var(--surface-alt)" }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Selected posting · {row[0]}</div>
                <h2 className="t-figure-title" style={{ margin: 0, fontWeight: 700, color: "var(--navy-deep)", lineHeight: 1.3 }}>{row[1]}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 16px" }}>
                  {["NOC 31301", row[2], "Full-time"].map((t) => (
                    <span key={t} className="control t-caption" style={{ border: "1px solid var(--card-border)", padding: "3px 9px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-soft)" }}>{t}</span>
                  ))}
                  <span className="control num t-caption" style={{ border: "1px solid var(--orange)", padding: "3px 9px", fontWeight: 700, color: "var(--orange-deep)" }}>{row[3]}/hr</span>
                </div>
                <div className="t-label" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-faint)", marginBottom: 6 }}>Full description</div>
                <p className="t-body-sm" style={{ margin: 0, lineHeight: 1.65, color: "var(--ink)" }}>
                  Provides direct nursing care to acute-care patients, administers medications and treatments, monitors patient status and collaborates with the interdisciplinary team. Current CARNA registration and two years of medical-surgical experience required. Rotating days and nights, 0.8 FTE with benefits.
                </p>
                <div className="num t-caption" style={{ borderTop: "1px solid var(--hairline)", marginTop: 16, paddingTop: 12, display: "flex", gap: 16, color: "var(--ink-faint)" }}>
                  <span>first seen 2026-07-28</span><span>last seen 2026-08-09</span>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

window.ExploreScreen = ExploreScreen;
