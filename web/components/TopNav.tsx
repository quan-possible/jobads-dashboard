"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/nav";
import { useI18n } from "@/lib/i18n/provider";
import { Brand } from "./Brand";
import { LocaleToggle } from "./LocaleToggle";
import { TopNavAuth } from "./TopNavAuth";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40">
      <div className="gradient-bar" />
      <div className="border-b border-card-border bg-canvas/85 backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between gap-6">
          <Brand />

          <div className="flex items-center gap-2 md:gap-3">
            {/* Desktop nav — hidden below md */}
            <nav aria-label={t.nav.primary} className="-mx-2 hidden items-center overflow-x-auto md:flex">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative whitespace-nowrap px-3 py-2 t-meta font-bold uppercase tracking-[0.01em] transition-colors",
                      active ? "text-navy-deep" : "text-ink-soft hover:text-navy",
                    ].join(" ")}
                  >
                    {t.nav[item.key]}
                    <span
                      className={[
                        "absolute inset-x-3 -bottom-px h-[3px] origin-left transition-transform duration-300",
                        active ? "scale-x-100 bg-orange" : "scale-x-0 bg-orange/0",
                      ].join(" ")}
                    />
                  </Link>
                );
              })}
            </nav>

            <LocaleToggle />

            <TopNavAuth />

            {/* Hamburger — visible below md only */}
            <button
              type="button"
              aria-label={t.nav.menu}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-panel"
              onClick={() => setMenuOpen((o) => !o)}
              className={[
                "control flex h-9 w-9 flex-col items-center justify-center gap-[5px] border border-card-border transition-colors duration-200 md:hidden",
                menuOpen
                  ? "border-orange text-orange"
                  : "text-ink-soft hover:border-orange hover:text-orange",
              ].join(" ")}
            >
              <span
                className={[
                  "block h-[2px] w-[18px] bg-current transition-all duration-200",
                  menuOpen ? "translate-y-[7px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "block h-[2px] w-[18px] bg-current transition-all duration-200",
                  menuOpen ? "opacity-0" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "block h-[2px] w-[18px] bg-current transition-all duration-200",
                  menuOpen ? "-translate-y-[7px] -rotate-45" : "",
                ].join(" ")}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav panel. `inert` when closed so its links leave the tab and
          AT order, not just hidden visually (S32); a distinct landmark label
          avoids two identically-named "Primary" navigations (S36). */}
      <div
        id="mobile-nav-panel"
        role="navigation"
        aria-label={t.nav.menu}
        inert={!menuOpen}
        className={[
          "border-b border-card-border bg-canvas md:hidden",
          "overflow-hidden transition-[max-height,opacity] duration-250",
          menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
        style={{ transitionTimingFunction: "var(--ease)" }}
      >
        <div className="container-x py-2">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={[
                  "relative flex min-h-[44px] items-center border-b border-card-border/50 t-body font-bold uppercase last:border-b-0",
                  "pl-4 transition-colors duration-150",
                  active ? "text-navy-deep" : "text-ink-soft hover:text-navy",
                ].join(" ")}
              >
                {/* Left orange accent bar for active item */}
                <span
                  className={[
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 bg-orange transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                />
                {t.nav[item.key]}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
