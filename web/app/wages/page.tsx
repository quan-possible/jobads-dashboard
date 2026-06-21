import { DownloadCSV } from "@/components/DownloadCSV";
import { Figure } from "@/components/Figure";
import { WageBand } from "@/components/WageBand";
import { WageRangeBars } from "@/components/WageRangeBars";
import { WageDemandScatter } from "@/components/WageDemandScatter";
import { api } from "@/lib/api";
import { fmtMonth, fmtShare } from "@/lib/format";
import { wagesDict, type WagesDictEntry } from "@/lib/i18n/dict/page-wages";
import { getLocale } from "@/lib/i18n/server";
import { GEO_OPTIONS, labelFor } from "@/lib/options";
import type { Filters } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wages",
  description:
    "Posted hourly wage ranges by occupation and province, from Canadian online job ads.",
};

function ApiDown({ t }: { t: WagesDictEntry }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">{t.apiDownTitle}</h1>
        <p className="text-ink-soft">
          {t.apiDownBody}{" "}
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
  const [sp, locale] = await Promise.all([searchParams, getLocale()]);
  const t: WagesDictEntry = wagesDict[locale];

  const filters: Filters = {
    geo: typeof sp.geo === "string" ? sp.geo : undefined,
    occ: typeof sp.occ === "string" ? sp.occ : undefined,
    ind: typeof sp.ind === "string" ? sp.ind : undefined,
  };

  let occ, province, meta, trend, occRank;
  try {
    [occ, province, meta, trend, occRank] = await Promise.all([
      api.wages(filters, "occupation"),
      api.wages(filters, "province"),
      api.meta(),
      api.wageTrend(filters),
      api.rank("occupations", filters, { limit: 20, order: "value" }),
    ]);
  } catch {
    return <ApiDown t={t} />;
  }

  // Join occupation demand (ranking) with occupation median wage for the scatter.
  const demandByCode = new Map(occRank.map((r) => [r.code, r.value]));
  const scatterPoints = occ.items
    .filter((i) => !i.gated && i.median !== null && demandByCode.has(i.code))
    .map((i) => ({ label: i.label, demand: demandByCode.get(i.code) ?? 0, wage: i.median as number, n: i.n }));

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

  const trendQS = (() => {
    const p = new URLSearchParams();
    if (filters.geo) p.set("geo", filters.geo);
    if (filters.occ) p.set("occ", filters.occ);
    if (filters.ind) p.set("ind", filters.ind);
    return p.toString();
  })();

  const asOfSlug = as_of ? as_of.replace("-", "-") : "latest";

  // Wage coverage share from meta.
  const wageCoverage = meta.coverage.find((c) => c.label === "Wage");
  const coverageShare = wageCoverage ? fmtShare(wageCoverage.share) : "—";
  const minSample = occ.min_sample;

  const sharedNote = `${t.notePrefix} ${minSample} ${t.noteSuffix}`;

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            {t.eyebrowPrefix} · {regionLabel} · {fmtMonth(as_of)}
          </div>
          <h1 className="h-display max-w-4xl text-balance">
            {t.heroTitle}
          </h1>
          <p className="lede mt-4 max-w-2xl">
            {t.heroLede}
          </p>
        </div>
      </section>

      {/* Coverage callout */}
      <section className="container-x py-6">
        <div className="card card-pad bg-surface-alt">
          <p className="text-[0.9rem] leading-relaxed text-ink-soft">
            <span className="font-bold text-ink">{coverageShare}</span>{" "}
            {t.coverageOf}{" "}
            {t.coverageWithheld}{" "}
            <span className="font-bold text-ink">{minSample}</span>{" "}
            {t.coverageWithheldSuffix}
          </p>
        </div>
      </section>

      {/* Wage band over time — the marquee distribution view */}
      <section className="container-x py-4">
        <Figure
          eyebrow={t.bandEyebrow}
          title={t.bandTitle}
          asOf={as_of}
          actions={
            <DownloadCSV
              endpoint={`/api/wages/trend?${trendQS}`}
              filename={`aclmr-wage-band-${asOfSlug}.csv`}
              columns={[
                { key: "month", header: "Month" },
                { key: "p25", header: "P25 ($/hr)" },
                { key: "median", header: "Median ($/hr)" },
                { key: "p75", header: "P75 ($/hr)" },
                { key: "n", header: "N" },
              ]}
            />
          }
          note={t.bandNote}
        >
          <WageBand
            points={trend.points}
            labels={{ p25: "P25", median: t.bandMedian, p75: "P75", notEnough: t.bandNotEnough }}
          />
        </Figure>
      </section>

      {/* Occupation wage ranges */}
      <section className="container-x py-4">
        <Figure
          eyebrow={t.figureEyebrow}
          title={t.occTitle}
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
          note={sharedNote}
        >
          <WageRangeBars items={occ.items} />
        </Figure>
      </section>

      {/* Province wage ranges */}
      <section className="container-x py-4">
        <Figure
          eyebrow={t.figureEyebrow}
          title={t.provTitle}
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
          note={sharedNote}
        >
          <WageRangeBars items={province.items} />
        </Figure>
      </section>

      {/* Wage vs demand quadrant scatter */}
      <section className="container-x py-4">
        <Figure eyebrow={t.scatterEyebrow} title={t.scatterTitle} asOf={as_of} note={t.scatterNote}>
          <WageDemandScatter points={scatterPoints} notEnough={t.scatterNotEnough} />
        </Figure>
      </section>
    </div>
  );
}
