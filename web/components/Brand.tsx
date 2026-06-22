"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { PixelTiles } from "./PixelTiles";

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label={`ACLMR ${t.nav.brandTagline}`}>
      <PixelTiles rows={3} cols={3} size={7} gap={2} className="shrink-0 transition-transform duration-300 group-hover:scale-105" />
      <span className="flex flex-col leading-none">
        <span className="text-[1.05rem] font-bold uppercase tracking-[0.01em] text-navy-deep">ACLMR</span>
        {!compact && (
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.04em] text-ink-soft">{t.nav.brandTagline}</span>
        )}
      </span>
    </Link>
  );
}
