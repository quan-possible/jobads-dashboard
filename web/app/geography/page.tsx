import { Figure } from "@/components/Figure";
import { MapToggle } from "@/components/MapToggle";
import { RemoteFigure } from "@/components/RemoteFigure";
import { TunableFigure } from "@/components/TunableFigure";
import { DeepDivider } from "@/components/DeepDivider";
import { RouteMasthead } from "@/components/RouteMasthead";
import { SectionLead } from "@/components/SectionLead";
import { api } from "@/lib/api";
import { figureServer } from "@/lib/api.server";
import { geographyDict } from "@/lib/i18n/dict/page-geography";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Geography",
  description:
    "Posted hiring demand by Canadian province — per-capita, concentration, and raw count views.",
};

function ApiDown({ t }: { t: (typeof geographyDict)[keyof typeof geographyDict] }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">{t.apiDownTitle}</h1>
        <p className="text-ink-soft">{t.apiDownBody} <code className="bg-surface-alt px-1">uvicorn api.main:app --port 8530</code>.</p>
      </div>
    </div>
  );
}

export default async function GeographyPage() {
  const locale = await getLocale();
  const t = geographyDict[locale];
  const c = t.charts;

  // National only (the figure bridge is national by construction). The as-of
  // stamp comes from /api/meta; every chart body comes from the figure bridge,
  // fetched (and cached) server-side in parallel.
  let asOf: string;
  let figs;
  try {
    const [
      meta,
      mapShare,
      mapCount,
      mapPercap,
      mapLq,
      rankedProvinces,
      cmaDemand,
      yoyChoropleth,
      shiftShare,
      aiExposure,
    ] = await Promise.all([
      api.meta(),
      figureServer("geography.demand_map_share", locale),
      figureServer("geography.demand_map_count", locale),
      figureServer("geography.demand_map_percap", locale),
      figureServer("geography.demand_map_lq", locale),
      figureServer("geography.ranked_provinces", locale),
      figureServer("geography.cma_demand", locale),
      figureServer("geography.yoy_choropleth", locale),
      figureServer("geography.shift_share", locale),
      figureServer("geography.ai_exposure", locale),
    ]);
    asOf = meta.latest_month;
    figs = {
      mapShare,
      mapCount,
      mapPercap,
      mapLq,
      rankedProvinces,
      cmaDemand,
      yoyChoropleth,
      shiftShare,
      aiExposure,
    };
  } catch {
    return <ApiDown t={t} />;
  }

  const measureOptions = [
    { value: "share", label: t.mapMeasures.share },
    { value: "count", label: t.mapMeasures.count },
    { value: "percap", label: t.mapMeasures.percap },
    { value: "lq", label: t.mapMeasures.lq },
  ];

  // Year-picker bounds for the general (tunable) shift-share decomposition.
  const FIRST_YEAR = 2016;
  const asOfYear = Number(asOf.slice(0, 4));
  const latestComplete = asOf.slice(5, 7) === "12" ? asOfYear : asOfYear - 1;
  const BASE_YEAR = 2019;

  return (
    <div className="pb-4">
      <RouteMasthead eyebrow={t.eyebrow} title={t.hero} lede={t.lede} asOf={asOf} locale={locale} />

      {/* Core: authoritative map (measure toggle) + ranked list */}
      <section className="container-x py-8 md:py-10">
        <SectionLead number="01" label={locale === "fr" ? "Carte et classement" : "Map and ranking"} asOf={asOf} locale={locale} />
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
          <Figure eyebrow={c.demandMap.eyebrow} title={c.demandMap.title} asOf={asOf} note={c.demandMap.note}>
            <MapToggle
              options={measureOptions}
              figs={{
                share: figs.mapShare,
                count: figs.mapCount,
                percap: figs.mapPercap,
                lq: figs.mapLq,
              }}
              height={480}
              ariaLabel={c.demandMap.aria}
            />
          </Figure>
          <Figure eyebrow={c.rankedProvinces.eyebrow} title={c.rankedProvinces.title} asOf={asOf} note={c.rankedProvinces.note}>
            <RemoteFigure fig={figs.rankedProvinces} height={420} ariaLabel={c.rankedProvinces.aria} />
          </Figure>
        </div>
      </section>

      {/* Core: city / CMA demand full width */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="02" label={locale === "fr" ? "Marchés métropolitains" : "Metropolitan markets"} asOf={asOf} locale={locale} />
        <Figure eyebrow={c.cmaDemand.eyebrow} title={c.cmaDemand.title} asOf={asOf} note={c.cmaDemand.note}>
          <RemoteFigure fig={figs.cmaDemand} height={520} ariaLabel={c.cmaDemand.aria} />
        </Figure>
      </section>

      <DeepDivider eyebrow={t.deepEyebrow} lede={t.deepLede} />

      {/* Deep: momentum + AI exposure */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="03" label={locale === "fr" ? "Dynamique régionale" : "Regional momentum"} asOf={asOf} locale={locale} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.yoyChoropleth.eyebrow} title={c.yoyChoropleth.title} asOf={asOf} note={c.yoyChoropleth.note}>
            <RemoteFigure fig={figs.yoyChoropleth} height={460} ariaLabel={c.yoyChoropleth.aria} />
          </Figure>
          <Figure eyebrow={c.aiExposure.eyebrow} title={c.aiExposure.title} asOf={asOf} note={c.aiExposure.note}>
            <RemoteFigure fig={figs.aiExposure} height={460} ariaLabel={c.aiExposure.aria} />
          </Figure>
        </div>
      </section>

      {/* Deep: shift-share decomposition (secondary, general window) */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="04" label={locale === "fr" ? "Décomposition" : "Decomposition"} asOf={asOf} locale={locale} />
        <TunableFigure
          chartId="geography.shift_share" initialFig={figs.shiftShare} mode="baseEnd"
          minYear={FIRST_YEAR} maxYear={latestComplete} defaultBaseYear={BASE_YEAR} defaultEndYear={latestComplete}
          eyebrow={c.shiftShare.eyebrow} title={c.shiftShare.title} asOf={asOf}
          note={c.shiftShare.note} ariaLabel={c.shiftShare.aria} height={460} />
      </section>
    </div>
  );
}
