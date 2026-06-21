import { ExplorerView } from "@/components/ExplorerView";
import { getLocale } from "@/lib/i18n/server";
import { explorersDict } from "@/lib/i18n/dict/page-explorers";
import type { Filters } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Occupations",
  description:
    "Posted hiring demand across Canada's broad occupational groups (NOC), with trends, wages and in-demand skills.",
};

export default async function OccupationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, locale] = await Promise.all([searchParams, getLocale()]);
  const filters: Filters = {
    geo: typeof sp.geo === "string" ? sp.geo : undefined,
    occ: typeof sp.occ === "string" ? sp.occ : undefined,
    ind: typeof sp.ind === "string" ? sp.ind : undefined,
  };
  const dict = explorersDict[locale];
  return <ExplorerView filters={filters} dim="occupations" dict={dict} locale={locale} />;
}
