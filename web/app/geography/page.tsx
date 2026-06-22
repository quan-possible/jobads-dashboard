import { Figure } from "@/components/Figure";
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
      shareChoropleth,
      rankedProvinces,
      lqChoropleth,
      lqHeatmap,
      shiftShare,
      yoyChoropleth,
      provinceTiles,
    ] = await Promise.all([
      api.meta(),
      api.figure("geography.share_choropleth", locale),
      api.figure("geography.ranked_provinces", locale),
      api.figure("geography.lq_choropleth", locale),
      api.figure("geography.lq_heatmap", locale),
      api.figure("geography.shift_share", locale),
      api.figure("geography.yoy_choropleth", locale),
      api.figure("geography.province_tiles", locale),
    ]);
    asOf = meta.latest_month;
    figs = {
      shareChoropleth,
      rankedProvinces,
      lqChoropleth,
      lqHeatmap,
      shiftShare,
      yoyChoropleth,
      provinceTiles,
    };
  } catch {
    return <ApiDown t={t} />;
  }

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">{t.eyebrow} · {fmtMonth(asOf)}</div>
          <h1 className="h-display max-w-3xl text-balance">{t.hero}</h1>
          <p className="lede mt-4 max-w-2xl">{t.lede}</p>
        </div>
      </section>

      {/* Core: share map + ranked list */}
      <section className="container-x py-8">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Figure eyebrow={c.shareChoropleth.eyebrow} title={c.shareChoropleth.title} asOf={asOf} note={c.shareChoropleth.note}>
            <RemoteFigure fig={figs.shareChoropleth} height={460} ariaLabel={c.shareChoropleth.aria} />
          </Figure>
          <Figure eyebrow={c.rankedProvinces.eyebrow} title={c.rankedProvinces.title} asOf={asOf} note={c.rankedProvinces.note}>
            <RemoteFigure fig={figs.rankedProvinces} height={420} ariaLabel={c.rankedProvinces.aria} />
          </Figure>
        </div>
      </section>

      {/* Core: specialisation map full width */}
      <section className="container-x py-4">
        <Figure eyebrow={c.lqChoropleth.eyebrow} title={c.lqChoropleth.title} asOf={asOf} note={c.lqChoropleth.note}>
          <RemoteFigure fig={figs.lqChoropleth} height={470} ariaLabel={c.lqChoropleth.aria} />
        </Figure>
      </section>

      {/* Deep divider */}
      <section className="container-x pt-8 pb-1">
        <div className="border-t border-card-border pt-6">
          <div className="eyebrow mb-1.5">{t.deepEyebrow}</div>
          <p className="lede max-w-2xl">{t.deepLede}</p>
        </div>
      </section>

      {/* Deep: LQ wall */}
      <section className="container-x py-4">
        <Figure eyebrow={c.lqHeatmap.eyebrow} title={c.lqHeatmap.title} asOf={asOf} note={c.lqHeatmap.note}>
          <RemoteFigure fig={figs.lqHeatmap} height={440} ariaLabel={c.lqHeatmap.aria} />
        </Figure>
      </section>

      {/* Deep: shift-share + momentum */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.shiftShare.eyebrow} title={c.shiftShare.title} asOf={asOf} note={c.shiftShare.note}>
            <RemoteFigure fig={figs.shiftShare} height={460} ariaLabel={c.shiftShare.aria} />
          </Figure>
          <Figure eyebrow={c.yoyChoropleth.eyebrow} title={c.yoyChoropleth.title} asOf={asOf} note={c.yoyChoropleth.note}>
            <RemoteFigure fig={figs.yoyChoropleth} height={460} ariaLabel={c.yoyChoropleth.aria} />
          </Figure>
        </div>
      </section>

      {/* Deep: tile grid full width */}
      <section className="container-x py-4">
        <Figure eyebrow={c.provinceTiles.eyebrow} title={c.provinceTiles.title} asOf={asOf} note={c.provinceTiles.note}>
          <RemoteFigure fig={figs.provinceTiles} height={300} ariaLabel={c.provinceTiles.aria} />
        </Figure>
      </section>
    </div>
  );
}
