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

// Sticky top nav: gradient ribbon, brand lockup, uppercase link row with an
// orange active underline, EN/FR toggle. The team-only tab renders as a
// distinct outlined orange pill and only when authenticated. Desktop layout
// (the product's mobile hamburger is out of scope for this cosmetic port).
export function TopNav({ items = DEFAULT_ITEMS, activeHref = "/", authenticated = false, locale = "en", onNavigate }) {
  const visible = items.filter((it) => !it.teamOnly || authenticated);
  const linkBase = { position: "relative", whiteSpace: "nowrap", padding: "8px 12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.01em", textDecoration: "none", transition: "color .15s var(--ease)" };
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40 }}>
      <div className="gradient-bar" />
      <div style={{ borderBottom: "1px solid var(--card-border)", background: "rgba(251,248,245,.85)", backdropFilter: "blur(12px)" }}>
        <div className="container-x" style={{ display: "flex", height: 64, alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <Brand />
          <div style={{ display: "flex", minWidth: 0, alignItems: "center", gap: 12 }}>
            <nav aria-label="Primary" className="nav-scroll" style={{ display: "flex", minWidth: 0, alignItems: "center", margin: "0 -8px" }}>
              {visible.map((item) => {
                const active = item.href === activeHref;
                const click = (e) => { if (onNavigate) { e.preventDefault(); onNavigate(item.href); } };
                if (item.teamOnly) {
                  return (
                    <a key={item.href} href={item.href} onClick={click} aria-current={active ? "page" : undefined} className="t-meta"
                      style={{ margin: "0 8px", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", borderRadius: "var(--radius-pill)", border: "1px solid " + (active ? "var(--orange)" : "rgba(207,119,48,.45)"), background: active ? "rgba(207,119,48,.1)" : "transparent", padding: "6px 12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.01em", color: "var(--orange)", textDecoration: "none" }}>
                      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "var(--orange)" }} />
                      {item.label}
                    </a>
                  );
                }
                return (
                  <a key={item.href} href={item.href} onClick={click} aria-current={active ? "page" : undefined} className="t-meta"
                    style={Object.assign({}, linkBase, { color: active ? "var(--navy-deep)" : "var(--ink-soft)" })}>
                    {item.label}
                    <span aria-hidden style={{ position: "absolute", left: 12, right: 12, bottom: -1, height: 3, background: active ? "var(--orange)" : "transparent", transformOrigin: "left", transition: "transform .3s var(--ease)" }} />
                  </a>
                );
              })}
            </nav>
            <LocaleToggle locale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
}
