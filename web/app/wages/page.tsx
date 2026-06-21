import { DownloadCSV } from "@/components/DownloadCSV";
import { Figure } from "@/components/Figure";
import { WageRangeBars } from "@/components/WageRangeBars";
import { api } from "@/lib/api";
import { fmtMonth, fmtShare } from "@/lib/format";
import { GEO_OPTIONS, labelFor } from "@/lib/options";
import type { Filters } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wages",
  description:
    "Posted hourly wage ranges by occupation and province, from Canadian online job ads.",
};

function ApiDown() {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">Data service unavailable</h1>
        <p className="text-ink-soft">
          The API isn't responding. Start it with{" "}
          <code className="bg-surface-alt px-1">
            uvicorn api.main:app --port 8530
          </code>
          .
        </p>
      </div>
    </div>
  );
}

export default async function WagesPage({
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

  let occ, province, meta;
  try {
    [occ, province, meta] = await Promise.all([
      api.wages(filters, "occupation"),
      api.wages(filters, "province"),
      api.meta(),
    ]);
  } catch {
    return <ApiDown />;
  }

  const regionLabel = labelFor(GEO_OPTIONS, filters.geo);
  const as_of = occ.as_of;

  // Build query strings for CSV download endpoints (browser-relative paths via Next rewrite).
  function wagesQS(dim: string): string {
    const p = new URLSearchParams({ dim });
    if (filters.geo) p.set("geo", filters.geo);
    if (filters.occ) p.set("occ", filters.occ);
    if (filters.ind) p.set("ind", filters.ind);
    return p.toString();
  }

  const asOfSlug = as_of ? as_of.replace("-", "-") : "latest";

  // Wage coverage share from meta.
  const wageCoverage = meta.coverage.find((c) => c.label === "Wage");
  const coverageShare = wageCoverage ? fmtShare(wageCoverage.share) : "—";
  const minSample = occ.min_sample;

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            Wages · {regionLabel} · {fmtMonth(as_of)}
          </div>
          <h1 className="h-display max-w-4xl text-balance">
            What job ads say about pay.
          </h1>
          <p className="lede mt-4 max-w-2xl">
            Only a share of postings list a wage, so coverage is partial and
            skewed toward roles where pay is a recruitment signal. This
            dashboard shows hourly ranges — the 25th percentile, median, and
            75th percentile of posted wages — not single point estimates.
          </p>
        </div>
      </section>

      {/* Coverage callout */}
      <section className="container-x py-6">
        <div className="card card-pad bg-surface-alt">
          <p className="text-[0.9rem] leading-relaxed text-ink-soft">
            <span className="font-bold text-ink">{coverageShare}</span> of
            postings in the current window include a wage field. Any occupation
            or province with fewer than{" "}
            <span className="font-bold text-ink">{minSample}</span> wage
            observations is withheld from the charts below to avoid
            unreliable estimates.
          </p>
        </div>
      </section>

      {/* Occupation wage ranges */}
      <section className="container-x py-4">
        <Figure
          eyebrow="Posted hourly wage · 25th–75th percentile"
          title="Hourly wage range by occupation"
          asOf={as_of}
          actions={
            <DownloadCSV
              endpoint={`/api/wages?${wagesQS("occupation")}`}
              filename={`aclmr-wages-occupation-${asOfSlug}.csv`}
              columns={[
                { key: "code", header: "Code" },
                { key: "label", header: "Occupation" },
                { key: "p25", header: "P25 ($/hr)" },
                { key: "median", header: "Median ($/hr)" },
                { key: "p75", header: "P75 ($/hr)" },
                { key: "n", header: "N" },
              ]}
            />
          }
          note={`Dot = median posted wage. Bar spans the 25th to 75th percentile of wages listed in job ads. Groups with fewer than ${minSample} wage observations are withheld.`}
        >
          <WageRangeBars items={occ.items} />
        </Figure>
      </section>

      {/* Province wage ranges */}
      <section className="container-x py-4">
        <Figure
          eyebrow="Posted hourly wage · 25th–75th percentile"
          title="Hourly wage range by province"
          asOf={as_of}
          actions={
            <DownloadCSV
              endpoint={`/api/wages?${wagesQS("province")}`}
              filename={`aclmr-wages-province-${asOfSlug}.csv`}
              columns={[
                { key: "code", header: "Code" },
                { key: "label", header: "Province" },
                { key: "p25", header: "P25 ($/hr)" },
                { key: "median", header: "Median ($/hr)" },
                { key: "p75", header: "P75 ($/hr)" },
                { key: "n", header: "N" },
              ]}
            />
          }
          note={`Dot = median posted wage. Bar spans the 25th to 75th percentile of wages listed in job ads. Groups with fewer than ${minSample} wage observations are withheld.`}
        >
          <WageRangeBars items={province.items} />
        </Figure>
      </section>
    </div>
  );
}
