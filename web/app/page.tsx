import Link from "next/link";
import { DemandChart } from "@/components/DemandChart";
import { Figure } from "@/components/Figure";
import { KeyPoints } from "@/components/KeyPoints";
import { KpiTile } from "@/components/KpiTile";
import { RankedBars } from "@/components/RankedBars";
import { api } from "@/lib/api";
import { fmtCompact, fmtInt, fmtMonth, fmtPct, fmtWage } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { pulseDict } from "@/lib/i18n/dict/page-pulse";
import { GEO_OPTIONS, labelFor } from "@/lib/options";
import type { Filters, RankItem } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Canadian Labour Market Pulse",
  description:
    "A monthly read on posted hiring demand across Canada's regions, occupations, industries, wages and skills — from online job ads.",
};

function ApiDown({ t }: { t: (typeof pulseDict)[keyof typeof pulseDict] }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">{t.apiDownTitle}</h1>
        <p className="text-ink-soft">
          {t.apiDownBody}{" "}
          <code className="bg-surface-alt px-1">{t.apiDownCmd}</code>.
        </p>
      </div>
    </div>
  );
}

export default async function PulsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, locale] = await Promise.all([searchParams, getLocale()]);
  const t = pulseDict[locale];

  const filters: Filters = {
    geo: typeof sp.geo === "string" ? sp.geo : undefined,
    occ: typeof sp.occ === "string" ? sp.occ : undefined,
    ind: typeof sp.ind === "string" ? sp.ind : undefined,
  };

  let data;
  let geo;
  try {
    [data, geo] = await Promise.all([api.overview(filters), api.geography(filters, "count")]);
  } catch {
    return <ApiDown t={t} />;
  }

  const { kpis, series, key_points, top_growing, top_cooling, as_of } = data;
  const regionLabel = labelFor(GEO_OPTIONS, filters.geo);
  const possessive = regionLabel === "All Canada" ? "Canada's" : `${regionLabel}'s`;

  const indexSpark = series.slice(-24).map((p) => p.index ?? 0);
  const postingsSpark = series.slice(-24).map((p) => p.postings);

  const baselineGap = kpis.demand_index !== null ? kpis.demand_index - 100 : null;
  // Headline is API-derived (composed from data) — left in English as specified.
  const headline =
    baselineGap === null
      ? `${possessive} posting demand`
      : `${possessive} posting demand is ${Math.abs(Math.round(baselineGap))}% ${baselineGap >= 0 ? "above" : "below"} its 2019 baseline`;

  const growing = top_growing.filter((i) => (i.yoy ?? 0) > 0);
  const cooling = top_cooling.filter((i) => (i.yoy ?? 0) < 0);

  const geoItems: RankItem[] = geo.items
    .slice(0, 6)
    .map((g) => ({ code: g.code, label: g.label, value: g.count ?? 0, yoy: g.yoy, share: null }));

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            {t.eyebrowPrefix} · {regionLabel} · {fmtMonth(as_of)}
          </div>
          <h1 className="h-display max-w-4xl text-balance">{headline}.</h1>
          <p className="lede mt-4 max-w-2xl">{t.lede}</p>
        </div>
      </section>

      {/* KPI strip */}
      <section className="container-x -mt-px py-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile
            label={t.kpiDemandLabel}
            value={fmtInt(kpis.demand_index)}
            context={t.kpiDemandContext}
            delta={baselineGap}
            deltaLabel={t.kpiDemandDeltaLabel}
            spark={indexSpark}
            accent
          />
          <KpiTile
            label={t.kpiPostingsLabel}
            value={fmtCompact(kpis.active_postings)}
            context={t.kpiPostingsContext}
            delta={kpis.active_mom_pct}
            deltaLabel={t.kpiPostingsDeltaLabel}
            spark={postingsSpark}
            sparkColor="var(--teal)"
          />
          <KpiTile
            label={t.kpiYoyLabel}
            value={fmtPct(kpis.active_yoy_pct, { sign: true })}
            context={t.kpiYoyContext}
          />
          <KpiTile
            label={t.kpiWageLabel}
            value={fmtWage(kpis.median_wage)}
            unit={kpis.median_wage ? t.kpiWageUnit : undefined}
            context={kpis.wage_n ? `n = ${fmtCompact(kpis.wage_n)}` : t.kpiWageInsufficient}
          />
        </div>
      </section>

      {/* Demand chart + key points */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Figure
            eyebrow={t.demandEyebrow}
            title={t.demandTitle}
            asOf={as_of}
            note={t.demandNote}
          >
            <DemandChart series={series} />
          </Figure>
          <KeyPoints points={key_points} title={t.keyPointsTitle} />
        </div>
      </section>

      {/* Ranked movers */}
      <section className="container-x py-4">
        <div className="grid gap-5 md:grid-cols-2">
          <Figure
            eyebrow={t.moversEyebrow}
            title={t.growingTitle}
            asOf={as_of}
            note={t.growingNote}
          >
            <RankedBars items={growing} metric="yoy" emptyHint={t.growingEmpty} />
          </Figure>
          <Figure
            eyebrow={t.moversEyebrow}
            title={t.coolingTitle}
            asOf={as_of}
            note={t.coolingNote}
          >
            <RankedBars items={cooling} metric="yoy" emptyHint={t.coolingEmpty} />
          </Figure>
        </div>
      </section>

      {/* Regional snapshot */}
      <section className="container-x py-4">
        <Figure
          eyebrow={t.regionalEyebrow}
          title={t.regionalTitle}
          asOf={as_of}
          actions={
            <Link href="/geography" className="text-[0.74rem] font-bold uppercase tracking-[0.02em] text-orange-deep hover:underline">
              {t.fullMap}
            </Link>
          }
          note={t.regionalNote}
        >
          <RankedBars items={geoItems} metric="value" />
        </Figure>
      </section>
    </div>
  );
}
