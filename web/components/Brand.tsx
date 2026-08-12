"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/provider";
import { ACLMR_LOGO_DATA_URI } from "./aclmrLogo";

export function Brand({ compact = false, inverted = true }: { compact?: boolean; inverted?: boolean }) {
  const { t } = useI18n();
  return (
    <Link
      href="/"
      className="group flex min-w-0 flex-col items-start gap-1.5 no-underline"
      aria-label={`ACLMR ${t.nav.brandTagline}`}
    >
      <Image
        src={ACLMR_LOGO_DATA_URI}
        alt=""
        width={138}
        height={31}
        className={`${inverted ? "brand-logo" : "brand-logo brightness-0"} transition-opacity duration-200 group-hover:opacity-80`}
      />
      {!compact && (
        <span className={`t-caption pl-px font-bold uppercase tracking-[0.08em] ${inverted ? "text-ink-invert/60" : "text-ink-soft"}`}>
          {t.nav.brandTagline}
        </span>
      )}
    </Link>
  );
}
