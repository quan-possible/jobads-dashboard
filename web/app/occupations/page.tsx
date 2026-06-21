import { ExplorerView } from "@/components/ExplorerView";
import type { Filters } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OccupationsPage({
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
  return <ExplorerView filters={filters} dim="occupations" />;
}
