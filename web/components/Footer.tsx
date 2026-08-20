"use client";

import Link from "next/link";
import { NAV } from "@/lib/nav";
import { useI18n } from "@/lib/i18n/provider";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";

export function Footer({ source }: { source?: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const year = new Date().getFullYear();
  return (
    <footer className={`${pathname.startsWith("/explore") ? "mt-0" : "mt-20"} bg-surface-navy text-ink-invert`}>
      <div className="gradient-bar" />
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <Brand compact inverted />
          <p className="mt-4 max-w-sm t-body leading-relaxed text-ink-invert/70">{t.footer.tagline}</p>
        </div>

        <nav aria-label={t.footer.sections} className="flex flex-col gap-2">
          <span className="eyebrow text-orange-soft!">{t.footer.dashboard}</span>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="w-fit t-body text-ink-invert/80 transition-colors hover:text-orange-soft">
              {t.nav[item.key]}
            </Link>
          ))}
          <Link href="/developers" className="w-fit t-body text-ink-invert/80 transition-colors hover:text-orange-soft">
            {t.nav.developers}
          </Link>
        </nav>

        <div className="flex flex-col gap-3 t-meta text-ink-invert/65">
          <span className="eyebrow text-orange-soft!">{t.footer.aboutData}</span>
          <p>{source ?? t.footer.sourceDefault}</p>
          <p>
            <Link href="/method" className="font-bold text-orange-soft underline-offset-2 hover:underline">
              {t.footer.readMethodLink}
            </Link>
          </p>
          <a href="https://www.aclmr.ca/" className="mt-2 w-fit text-ink-invert/80 transition-colors hover:text-orange-soft">
            aclmr.ca →
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-5 t-caption text-ink-invert/50 sm:flex-row sm:items-center">
          <span>© {year} {t.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}
