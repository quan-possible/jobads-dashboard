import { Figure } from "@/components/Figure";
import { KeyPoints } from "@/components/KeyPoints";
import { KpiTile } from "@/components/KpiTile";
import { RemoteFigure } from "@/components/RemoteFigure";
import { api } from "@/lib/api";
import { fmtCompact, fmtInt, fmtMonth, fmtPct, fmtWage } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { pulseDict } from "@/lib/i18n/dict/page-pulse";
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

export default async function PulsePage() {
  const locale = await getLocale();
  const t = pulseDict[locale];
  const c = t.charts;

  // National only (the figure bridge is national by construction). KPIs + key
  // points come from the overview endpoint; every chart body comes from the
  // figure bridge, fetched (and cached) server-side in parallel.
  let data;
  let figs;
  try {
    const [overview, demand, yoy, seasonality, composition, stl, anomaly, saVsNsa, diffusion, cycle] =
      await Promise.all([
        api.overview(),
        api.figure("pulse.demand_ribbon", locale),
        api.figure("pulse.yoy_bars", locale),
        api.figure("pulse.seasonality", locale),
        api.figure("pulse.composition", locale),
        api.figure("pulse.stl", locale),
        api.figure("pulse.anomaly", locale),
        api.figure("pulse.sa_vs_nsa", locale),
        api.figure("pulse.diffusion", locale),
        api.figure("pulse.cycle", locale),
      ]);
    data = overview;
    figs = { demand, yoy, seasonality, composition, stl, anomaly, saVsNsa, diffusion, cycle };
  } catch {
    return <ApiDown t={t} />;
  }

  const { kpis, series, key_points, as_of } = data;

  const indexSpark = series.slice(-24).map((p) => p.index ?? 0);
  const postingsSpark = series.slice(-24).map((p) => p.postings);
  const yoySpark = series
    .filter((p) => p.yoy !== null)
    .slice(-24)
    .map((p) => p.yoy as number);
  const wageSpark = kpis.median_wage_trend ?? undefined;

  const baselineGap = kpis.demand_index !== null ? kpis.demand_index - 100 : null;
  // Headline is API-derived (composed from data) — left in English as specified.
  const headline =
    baselineGap === null
      ? "Canada's posting demand"
      : `Canada's posting demand is ${Math.abs(Math.round(baselineGap))}% ${baselineGap >= 0 ? "above" : "below"} its 2019 baseline`;

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            {t.eyebrowPrefix} · {fmtMonth(as_of)}
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
            spark={yoySpark.length > 1 ? yoySpark : undefined}
            sparkColor="var(--teal)"
          />
          <KpiTile
            label={t.kpiWageLabel}
            value={fmtWage(kpis.median_wage)}
            unit={kpis.median_wage ? t.kpiWageUnit : undefined}
            context={kpis.wage_n ? `n = ${fmtCompact(kpis.wage_n)}` : t.kpiWageInsufficient}
            spark={wageSpark && wageSpark.length > 1 ? wageSpark : undefined}
            sparkColor="var(--teal)"
          />
        </div>
      </section>

      {/* Demand ribbon + key points */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Figure eyebrow={c.demandRibbon.eyebrow} title={c.demandRibbon.title} asOf={as_of} note={c.demandRibbon.note}>
            <RemoteFigure fig={figs.demand} height={420} ariaLabel={c.demandRibbon.aria} />
          </Figure>
          <KeyPoints points={key_points} title={t.keyPointsTitle} />
        </div>
      </section>

      {/* Core: year-over-year, seasonality, occupational mix */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.yoyBars.eyebrow} title={c.yoyBars.title} asOf={as_of} note={c.yoyBars.note}>
            <RemoteFigure fig={figs.yoy} height={360} ariaLabel={c.yoyBars.aria} />
          </Figure>
          <Figure eyebrow={c.composition.eyebrow} title={c.composition.title} asOf={as_of} note={c.composition.note}>
            <RemoteFigure fig={figs.composition} height={360} ariaLabel={c.composition.aria} />
          </Figure>
        </div>
      </section>

      <section className="container-x py-4">
        <Figure eyebrow={c.seasonality.eyebrow} title={c.seasonality.title} asOf={as_of} note={c.seasonality.note}>
          <RemoteFigure fig={figs.seasonality} height={360} ariaLabel={c.seasonality.aria} />
        </Figure>
      </section>

      {/* Deep divider */}
      <section className="container-x pt-8 pb-1">
        <div className="border-t border-card-border pt-6">
          <div className="eyebrow mb-1.5">{t.deepEyebrow}</div>
          <p className="lede max-w-2xl">{t.deepLede}</p>
        </div>
      </section>

      {/* Deep: decomposition */}
      <section className="container-x py-4">
        <Figure eyebrow={c.stl.eyebrow} title={c.stl.title} asOf={as_of} note={c.stl.note}>
          <RemoteFigure fig={figs.stl} ariaLabel={c.stl.aria} />
        </Figure>
      </section>

      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.anomaly.eyebrow} title={c.anomaly.title} asOf={as_of} note={c.anomaly.note}>
            <RemoteFigure fig={figs.anomaly} height={340} ariaLabel={c.anomaly.aria} />
          </Figure>
          <Figure eyebrow={c.saVsNsa.eyebrow} title={c.saVsNsa.title} asOf={as_of} note={c.saVsNsa.note}>
            <RemoteFigure fig={figs.saVsNsa} height={340} ariaLabel={c.saVsNsa.aria} />
          </Figure>
        </div>
      </section>

      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.diffusion.eyebrow} title={c.diffusion.title} asOf={as_of} note={c.diffusion.note}>
            <RemoteFigure fig={figs.diffusion} height={340} ariaLabel={c.diffusion.aria} />
          </Figure>
          <Figure eyebrow={c.cycle.eyebrow} title={c.cycle.title} asOf={as_of} note={c.cycle.note}>
            <RemoteFigure fig={figs.cycle} ariaLabel={c.cycle.aria} />
          </Figure>
        </div>
      </section>
    </div>
  );
}
