import { Figure } from "@/components/Figure";
import { MapToggle } from "@/components/MapToggle";
import { RemoteFigure } from "@/components/RemoteFigure";
import { api } from "@/lib/api";
import { fmtMonth } from "@/lib/format";
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
      api.figureSafe("geography.demand_map_share", locale),
      api.figureSafe("geography.demand_map_count", locale),
      api.figureSafe("geography.demand_map_percap", locale),
      api.figureSafe("geography.demand_map_lq", locale),
      api.figureSafe("geography.ranked_provinces", locale),
      api.figureSafe("geography.cma_demand", locale),
      api.figureSafe("geography.yoy_choropleth", locale),
      api.figureSafe("geography.shift_share", locale),
      api.figureSafe("geography.ai_exposure", locale),
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

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">{t.eyebrow} · {fmtMonth(asOf, locale)}</div>
          <h1 className="h-display max-w-3xl text-balance">{t.hero}</h1>
          <p className="lede mt-4 max-w-2xl">{t.lede}</p>
        </div>
      </section>

      {/* Core: authoritative map (measure toggle) + ranked list */}
      <section className="container-x py-8">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
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
      <section className="container-x py-4">
        <Figure eyebrow={c.cmaDemand.eyebrow} title={c.cmaDemand.title} asOf={asOf} note={c.cmaDemand.note}>
          <RemoteFigure fig={figs.cmaDemand} height={520} ariaLabel={c.cmaDemand.aria} />
        </Figure>
      </section>

      {/* Deep divider */}
      <section className="container-x pt-8 pb-1">
        <div className="border-t border-card-border pt-6">
          <div className="eyebrow mb-1.5">{t.deepEyebrow}</div>
          <p className="lede max-w-2xl">{t.deepLede}</p>
        </div>
      </section>

      {/* Deep: momentum + AI exposure */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.yoyChoropleth.eyebrow} title={c.yoyChoropleth.title} asOf={asOf} note={c.yoyChoropleth.note}>
            <RemoteFigure fig={figs.yoyChoropleth} height={460} ariaLabel={c.yoyChoropleth.aria} />
          </Figure>
          <Figure eyebrow={c.aiExposure.eyebrow} title={c.aiExposure.title} asOf={asOf} note={c.aiExposure.note}>
            <RemoteFigure fig={figs.aiExposure} height={460} ariaLabel={c.aiExposure.aria} />
          </Figure>
        </div>
      </section>

      {/* Deep: shift-share decomposition (secondary) */}
      <section className="container-x py-4">
        <Figure eyebrow={c.shiftShare.eyebrow} title={c.shiftShare.title} asOf={asOf} note={c.shiftShare.note}>
          <RemoteFigure fig={figs.shiftShare} height={460} ariaLabel={c.shiftShare.aria} />
        </Figure>
      </section>
    </div>
  );
}
