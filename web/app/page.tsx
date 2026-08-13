import { Figure } from "@/components/Figure";
import { KpiTile } from "@/components/KpiTile";
import { RemoteFigure } from "@/components/RemoteFigure";
import { DeepDivider } from "@/components/DeepDivider";
import { api } from "@/lib/api";
import { figureServer } from "@/lib/api.server";
import { fmtCompact, fmtInt, fmtMonth, fmtPct, fmtWage } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { pulseDict } from "@/lib/i18n/dict/page-pulse";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = pulseDict[await getLocale()];
  return { title: t.heroFallback, description: t.lede };
}

function ApiDown({ t }: { t: (typeof pulseDict)[keyof typeof pulseDict] }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">{t.apiDownTitle}</h1>
        <p className="text-ink-soft">{t.apiDownBody}</p>
      </div>
    </div>
  );
}

export default async function PulsePage() {
  const locale = await getLocale();
  const t = pulseDict[locale];
  const c = t.charts;

  // National only (the figure bridge is national by construction). KPIs come
  // from the overview endpoint; every chart body comes from the figure bridge,
  // fetched (and cached) server-side in parallel.
  let data;
  let figs;
  try {
    const [overview, demand, yoy, seasonality, composition, occupationTrends, momentum, diffusion] =
      await Promise.all([
        api.overview(undefined, locale),
        figureServer("pulse.demand_ribbon", locale),
        figureServer("pulse.yoy_bars", locale),
        figureServer("pulse.seasonality", locale),
        figureServer("pulse.composition", locale),
        figureServer("pulse.occupation_trends", locale),
        figureServer("pulse.momentum", locale),
        figureServer("pulse.diffusion", locale),
      ]);
    data = overview;
    figs = { demand, yoy, seasonality, composition, occupationTrends, momentum, diffusion };
  } catch {
    return <ApiDown t={t} />;
  }

  const { kpis, series, as_of } = data;

  const indexSpark = series.slice(-24).map((p) => p.index ?? 0);
  const postingsSpark = series.slice(-24).map((p) => p.postings);
  const yoySpark = series
    .filter((p) => p.yoy !== null)
    .slice(-24)
    .map((p) => p.yoy as number);
  const wageSpark = kpis.median_wage_trend ?? undefined;

  const baselineGap = kpis.demand_index !== null ? kpis.demand_index - 100 : null;

  return (
    <div className="pb-8">
      {/* Neutral masthead: the KPI strip and charts carry the interpretation. */}
      <section className="pulse-hero">
        <div className="container-x py-12 md:py-16">
          <div className="eyebrow mb-3">
            {t.eyebrowPrefix} · {fmtMonth(as_of, locale)}
          </div>
          <h1 className="h-display max-w-4xl text-balance">{t.heroFallback}</h1>
          <p className="lede mt-4 max-w-2xl">{t.lede}</p>
        </div>
      </section>

      {/* KPI strip — overlaps the dark-to-cream transition on desktop and
          remains a readable 2 × 2 scan on the approved 390 px composition. */}
      <section className="container-x pulse-kpis py-0">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile
            label={t.kpiDemandLabel}
            value={fmtInt(kpis.demand_index, locale)}
            context={t.kpiDemandContext}
            delta={baselineGap}
            deltaLabel={t.kpiDemandDeltaLabel}
            spark={indexSpark}
            accent
            locale={locale}
          />
          <KpiTile
            label={t.kpiPostingsLabel}
            value={fmtCompact(kpis.active_postings, locale)}
            context={t.kpiPostingsContext}
            delta={kpis.active_mom_pct}
            deltaLabel={t.kpiPostingsDeltaLabel}
            spark={postingsSpark}
            sparkColor="var(--teal)"
            locale={locale}
          />
          <KpiTile
            label={t.kpiYoyLabel}
            value={kpis.active_yoy_pct == null ? "—" : fmtPct(Math.abs(kpis.active_yoy_pct), { locale })}
            valueTrend={kpis.active_yoy_pct}
            context={t.kpiYoyContext}
            spark={yoySpark.length > 1 ? yoySpark : undefined}
            sparkColor="var(--teal)"
          />
          <KpiTile
            label={t.kpiWageLabel}
            value={fmtWage(kpis.median_wage, locale)}
            unit={kpis.median_wage ? t.kpiWageUnit : undefined}
            context={kpis.wage_n ? `${fmtCompact(kpis.wage_n, locale)} ${t.kpiWageSample}` : t.kpiWageInsufficient}
            spark={wageSpark && wageSpark.length > 1 ? wageSpark : undefined}
            sparkColor="var(--teal)"
          />
        </div>
      </section>

      {/* Core analytical read */}
      <section className="container-x pulse-section pt-12 md:pt-14">
        <div className="pulse-section-header">
          <span className="pulse-section-number">01</span>
          <span className="pulse-section-title">{c.demandRibbon.eyebrow}</span>
        </div>
        <Figure eyebrow={c.demandRibbon.eyebrow} title={c.demandRibbon.title} asOf={as_of} note={c.demandRibbon.note}>
          <RemoteFigure fig={figs.demand} height={420} ariaLabel={c.demandRibbon.aria} />
        </Figure>
      </section>

      {/* Composition and seasonality */}
      <section className="container-x pulse-section pt-4">
        <div className="pulse-section-header">
          <span className="pulse-section-number">02</span>
          <span className="pulse-section-title">{locale === "fr" ? "Variation annuelle et composition" : "Annual change and composition"}</span>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.yoyBars.eyebrow} title={c.yoyBars.title} asOf={as_of} note={c.yoyBars.note}>
            <RemoteFigure fig={figs.yoy} height={360} ariaLabel={c.yoyBars.aria} />
          </Figure>
          <Figure eyebrow={c.composition.eyebrow} title={c.composition.title} asOf={as_of} note={c.composition.note}>
            <RemoteFigure fig={figs.composition} height={360} ariaLabel={c.composition.aria} />
          </Figure>
        </div>
      </section>

      <section className="container-x pulse-section pt-0">
        <Figure eyebrow={c.seasonality.eyebrow} title={c.seasonality.title} asOf={as_of} note={c.seasonality.note}>
          <RemoteFigure fig={figs.seasonality} height={360} ariaLabel={c.seasonality.aria} />
        </Figure>
      </section>

      <DeepDivider eyebrow={t.deepEyebrow} lede={t.deepLede} />

      {/* Deep: occupation small-multiples full width */}
      <section className="container-x py-4">
        <Figure eyebrow={c.occupationTrends.eyebrow} title={c.occupationTrends.title} asOf={as_of} note={c.occupationTrends.note}>
          <RemoteFigure fig={figs.occupationTrends} ariaLabel={c.occupationTrends.aria} />
        </Figure>
      </section>

      {/* Deep: momentum + diffusion */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.momentum.eyebrow} title={c.momentum.title} asOf={as_of} note={c.momentum.note}>
            <RemoteFigure fig={figs.momentum} height={340} ariaLabel={c.momentum.aria} />
          </Figure>
          <Figure eyebrow={c.diffusion.eyebrow} title={c.diffusion.title} asOf={as_of} note={c.diffusion.note}>
            <RemoteFigure fig={figs.diffusion} height={340} ariaLabel={c.diffusion.aria} />
          </Figure>
        </div>
      </section>
    </div>
  );
}
