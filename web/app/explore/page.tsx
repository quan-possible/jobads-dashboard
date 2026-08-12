import { AuthGate } from "@/components/explore/AuthGate";
import { ExploreTabs } from "@/components/explore/ExploreTabs";
import { ExploreHero } from "@/components/explore/ExploreHero";
import { FilterSpine } from "@/components/FilterSpine";
import { api } from "@/lib/api";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import styles from "@/components/explore/explore.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "fr"
    ? { title: "Explorer", description: "Construisez un graphique ou consultez les offres derrière les agrégats de l’ACLMR. Accès équipe requis." }
    : { title: "Explore", description: "Build a chart or inspect the postings behind the ACLMR aggregates. Team access required." };
}

export default async function ExplorePage() {
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
      <ExploreHero />
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
