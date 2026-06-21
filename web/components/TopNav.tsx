"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { Brand } from "./Brand";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40">
      <div className="gradient-bar" />
      <div className="border-b border-card-border bg-canvas/85 backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between gap-6">
          <Brand />
          <nav aria-label="Primary" className="-mx-2 flex items-center overflow-x-auto">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "relative whitespace-nowrap px-3 py-2 text-[0.78rem] font-bold uppercase tracking-[0.01em] transition-colors",
                    active ? "text-navy-deep" : "text-ink-soft hover:text-navy",
                  ].join(" ")}
                >
                  {item.label}
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
        </div>
      </div>
    </header>
  );
}
