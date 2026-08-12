"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/nav";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth/provider";
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
  const { authenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const navItems = NAV.filter((item) => !item.teamOnly || authenticated);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="container-x flex items-center justify-between gap-6">
        <Brand />

        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <nav aria-label={t.nav.primary} className="-mx-2 hidden min-w-0 items-center overflow-x-auto lg:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              if (item.teamOnly) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={["auth-pill mx-2 flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 t-meta font-bold uppercase tracking-[0.01em] transition-colors", active ? "bg-orange/10" : "hover:bg-white/5"].join(" ")}
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-orange" />
                    {t.nav[item.key]}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={["relative whitespace-nowrap px-3 py-2 t-meta font-bold uppercase tracking-[0.01em] transition-colors nav-link-dark", active ? "text-ink-invert" : ""].join(" ")}
                >
                  {t.nav[item.key]}
                  <span className={["absolute inset-x-3 -bottom-px h-[3px] origin-left transition-transform duration-300", active ? "scale-x-100 bg-orange" : "scale-x-0 bg-orange/0"].join(" ")} />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <LocaleToggle inverted />
            <TopNavAuth />
          </div>

          <button
            ref={menuTriggerRef}
            type="button"
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMenuOpen((open) => !open)}
            className={["control flex h-10 w-10 flex-col items-center justify-center gap-[5px] border border-white/30 transition-colors duration-200 lg:hidden", menuOpen ? "border-orange text-orange" : "text-ink-invert hover:border-orange hover:text-orange"].join(" ")}
          >
            <span className={["block h-[2px] w-[18px] bg-current transition-all duration-200", menuOpen ? "translate-y-[7px] rotate-45" : ""].join(" ")} />
            <span className={["block h-[2px] w-[18px] bg-current transition-all duration-200", menuOpen ? "opacity-0" : ""].join(" ")} />
            <span className={["block h-[2px] w-[18px] bg-current transition-all duration-200", menuOpen ? "-translate-y-[7px] -rotate-45" : ""].join(" ")} />
          </button>
        </div>
      </div>
      <div className="gradient-bar" />

      <div
        id="mobile-nav-panel"
        role="navigation"
        aria-label={t.nav.menu}
        inert={!menuOpen}
        className={["border-b border-white/15 bg-navy-deep lg:hidden", "overflow-hidden transition-[max-height,opacity] duration-250", menuOpen ? "max-h-[720px] opacity-100" : "max-h-0 opacity-0"].join(" ")}
        style={{ transitionTimingFunction: "var(--ease)" }}
      >
        <div className="container-x py-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={["relative flex min-h-[46px] items-center gap-2 border-b border-white/10 t-body font-bold uppercase last:border-b-0 pl-4 transition-colors duration-150", item.teamOnly ? "text-orange-soft" : active ? "text-ink-invert" : "text-ink-invert/65 hover:text-ink-invert"].join(" ")}
              >
                <span className={["absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 bg-orange transition-opacity duration-200", item.teamOnly || active ? "opacity-100" : "opacity-0"].join(" ")} />
                {t.nav[item.key]}
                {item.teamOnly && <span className="auth-pill rounded-full px-2 py-0.5 t-caption font-bold uppercase tracking-[0.04em]">{t.nav.auth.teamBadge}</span>}
              </Link>
            );
          })}
          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 sm:hidden">
            <LocaleToggle inverted />
            <TopNavAuth />
          </div>
        </div>
      </div>
    </header>
  );
}
