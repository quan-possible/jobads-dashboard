import React from "react";
import { Brand } from "../../brand/Brand/Brand";
import { LocaleToggle } from "../LocaleToggle/LocaleToggle";

const DEFAULT_ITEMS = [
  { label: "Pulse", href: "/" },
  { label: "Occupations", href: "/occupations" },
  { label: "Industries", href: "/industries" },
  { label: "Geography", href: "/geography" },
  { label: "Wages", href: "/wages" },
  { label: "Skills", href: "/skills" },
  { label: "Method", href: "/method" },
  { label: "Explore", href: "/explore", teamOnly: true },
];

// Sticky top nav. The default navy treatment is the selected redesign target.
// `tone="source"` exists only to compare the prior light production chrome in
// the source-state UI kit; it is not the redesign default.
export function TopNav({ items = DEFAULT_ITEMS, activeHref = "/", authenticated = false, locale = "en", onNavigate, tone = "redesign" }) {
  const visible = items.filter((it) => !it.teamOnly || authenticated);
  const dark = tone === "redesign";
  const linkBase = { position: "relative", whiteSpace: "nowrap", padding: "8px 12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.01em", textDecoration: "none", transition: "color .15s var(--ease)" };
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ borderBottom: "1px solid " + (dark ? "rgba(244,238,231,.14)" : "var(--card-border)"), background: dark ? "var(--navy-deep)" : "var(--canvas)" }}>
        <div className="container-x" style={{ display: "flex", height: 64, alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <Brand inverted={dark} href="/" />
          <div style={{ display: "flex", minWidth: 0, alignItems: "center", gap: 12 }}>
            <nav aria-label="Primary" className="nav-scroll" style={{ display: "flex", minWidth: 0, alignItems: "center", margin: "0 -8px" }}>
              {visible.map((item) => {
                const active = item.href === activeHref;
                const click = (e) => { if (onNavigate) { e.preventDefault(); onNavigate(item.href); } };
                if (item.teamOnly) {
                  return (
                    <a key={item.href} href={item.href} onClick={click} aria-current={active ? "page" : undefined} className="t-meta"
                      style={{ margin: "0 8px", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", borderRadius: "var(--radius-pill)", border: dark ? "2px solid transparent" : "1px solid " + (active ? "var(--orange)" : "rgba(207,119,48,.55)"), background: dark ? "linear-gradient(var(--navy-deep),var(--navy-deep)) padding-box, var(--gradient) border-box" : (active ? "rgba(207,119,48,.1)" : "transparent"), padding: dark ? "5px 11px" : "6px 12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.01em", color: dark ? "var(--orange-soft)" : "var(--orange-deep)", textDecoration: "none" }}>
                      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "var(--orange)" }} />
                      {item.label}
                    </a>
                  );
                }
                return (
                  <a key={item.href} href={item.href} onClick={click} aria-current={active ? "page" : undefined} className="t-meta"
                    style={Object.assign({}, linkBase, { color: dark ? (active ? "var(--ink-invert)" : "rgba(244,238,231,.62)") : (active ? "var(--navy-deep)" : "var(--ink-soft)") })}>
                    {item.label}
                    <span aria-hidden style={{ position: "absolute", left: 12, right: 12, bottom: -1, height: 3, background: active ? "var(--orange)" : "transparent", transformOrigin: "left", transition: "transform .3s var(--ease)" }} />
                  </a>
                );
              })}
            </nav>
            <LocaleToggle inverted={dark} locale={locale} />
          </div>
        </div>
      </div>
      <div className="gradient-bar" />
    </header>
  );
}
