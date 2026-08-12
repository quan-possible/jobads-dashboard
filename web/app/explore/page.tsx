import { AuthGate } from "@/components/explore/AuthGate";
import { ExploreTabs } from "@/components/explore/ExploreTabs";
import { FilterSpine } from "@/components/FilterSpine";
import { api } from "@/lib/api";
import { getServerDict } from "@/lib/i18n/server";
import type { Metadata } from "next";
import styles from "@/components/explore/explore.module.css";

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
    <div className={styles.explorePage}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>{t.explore.eyebrow}</div>
          <h1 className={styles.heroTitle}>{t.explore.hero}</h1>
          <p className={styles.heroLede}>{t.explore.lede}</p>
        </div>
      </section>
      <FilterSpine />
      <div className={styles.workspace}>
        {/* The whole Explore surface is team-access: the gate replaces both tabs
            with the password card until a valid session exists. */}
        <AuthGate>
          <ExploreTabs minYear={minYear} maxYear={maxYear} />
        </AuthGate>
      </div>
    </div>
  );
}
