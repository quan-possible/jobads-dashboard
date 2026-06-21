import { ExplorerView } from "@/components/ExplorerView";
import type { Filters } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Posted hiring demand across Canadian industry sectors (NAICS), with trends, wages and in-demand skills.",
};

export default async function IndustriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters: Filters = {
    geo: typeof sp.geo === "string" ? sp.geo : undefined,
    occ: typeof sp.occ === "string" ? sp.occ : undefined,
    ind: typeof sp.ind === "string" ? sp.ind : undefined,
  };
  return <ExplorerView filters={filters} dim="industries" />;
}
