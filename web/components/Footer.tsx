import Link from "next/link";
import { NAV } from "@/lib/nav";
import { PixelTiles } from "./PixelTiles";

export function Footer({ asOf, source }: { asOf?: string; source?: string }) {
  return (
    <footer className="mt-20 bg-surface-navy text-ink-invert">
      <div className="gradient-bar" />
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <PixelTiles rows={3} cols={3} size={8} gap={2} />
            <span className="text-lg font-bold uppercase tracking-[0.01em]">ACLMR</span>
          </div>
          <p className="mt-4 max-w-sm text-[0.9rem] leading-relaxed text-ink-invert/70">
            Labour-market signals from Canadian online job postings. A descriptive view of posted
            demand — not a measure of employment or vacancies.
          </p>
        </div>

        <nav aria-label="Sections" className="flex flex-col gap-2">
          <span className="eyebrow text-orange-soft">Dashboard</span>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="w-fit text-[0.9rem] text-ink-invert/80 transition-colors hover:text-orange-soft">
              {item.label}
            </Link>
          ))}
          <Link href="/developers" className="w-fit text-[0.9rem] text-ink-invert/80 transition-colors hover:text-orange-soft">
            Developers
          </Link>
        </nav>

        <div className="flex flex-col gap-3 text-[0.82rem] text-ink-invert/65">
          <span className="eyebrow text-orange-soft">About the data</span>
          <p>{source ?? "Built from Vicinity online job-ads aggregates."}</p>
          {asOf && <p className="num">Data through {asOf}.</p>}
          <p>
            Read the{" "}
            <Link href="/method" className="font-bold text-orange-soft underline-offset-2 hover:underline">
              method &amp; caveats
            </Link>{" "}
            before citing any figure.
          </p>
          <a href="https://www.aclmr.ca/" className="mt-2 w-fit text-ink-invert/80 transition-colors hover:text-orange-soft">
            aclmr.ca →
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-5 text-[0.74rem] text-ink-invert/50 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Atlantic Canada Labour Market Research.</span>
          <span className="uppercase tracking-[0.04em]">Job ads measure posted demand, not employment.</span>
        </div>
      </div>
    </footer>
  );
}
