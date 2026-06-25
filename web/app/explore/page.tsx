import { AuthGate } from "@/components/explore/AuthGate";
import { ExploreTabs } from "@/components/explore/ExploreTabs";
import { api } from "@/lib/api";
import { getServerDict } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Build a chart from any breakdown and measure, or search the individual job postings behind the ACLMR aggregates. Team access required.",
};

export default async function ExplorePage() {
  const { t } = await getServerDict();

  // Year-picker bounds for the builder. Data starts 2016; the upper bound is the
  // latest complete year (the partial current year is excluded). Fall back to a
  // fixed span if meta is unavailable — the builder still renders.
  let minYear = 2016;
  let maxYear = 2025;
  try {
    const meta = await api.meta();
    const y = Number(meta.latest_month.slice(0, 4));
    maxYear = meta.latest_month.slice(5, 7) === "12" ? y : y - 1;
    minYear = Number(meta.earliest_month.slice(0, 4));
  } catch {
    /* keep the fixed fallback span */
  }

  return (
    <div>
      {/* Shared hero template (eyebrow · big headline · lede), matching every
          other data page (U05). */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">{t.explore.eyebrow}</div>
          <h1 className="h-display max-w-3xl text-balance">{t.explore.hero}</h1>
          <p className="lede mt-4 max-w-2xl">{t.explore.lede}</p>
        </div>
      </section>
      <div className="container-x py-8">
        {/* The whole Explore surface is team-access: the gate replaces both tabs
            with the password card until a valid session exists. */}
        <AuthGate>
          <ExploreTabs minYear={minYear} maxYear={maxYear} />
        </AuthGate>
      </div>
    </div>
  );
}
