import { Figure } from "@/components/Figure";
import { RemoteFigure } from "@/components/RemoteFigure";
import { api } from "@/lib/api";
import { fmtMonth } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { occupationsDict } from "@/lib/i18n/dict/page-occupations";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Occupations",
  description:
    "Posted hiring demand across Canada's broad occupational groups (NOC), with trends, wages and in-demand skills.",
};

function ApiDown({ t }: { t: (typeof occupationsDict)[keyof typeof occupationsDict] }) {
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

export default async function OccupationsPage() {
  const locale = await getLocale();
  const t = occupationsDict[locale];
  const c = t.charts;

  // National only (the figure bridge is national by construction). Every chart
  // body comes from the figure bridge, fetched (and cached) server-side in
  // parallel; meta gives the as-of stamp.
  let asOf: string;
  let figs;
  try {
    const [
      meta,
      treemap,
      indexedLines,
      contributionBars,
      waterfall,
      dumbbell,
      skillChurn,
      aiExposure,
      nocNaicsHeatmap,
    ] = await Promise.all([
      api.meta(),
      api.figureSafe("occupations.treemap", locale),
      api.figureSafe("occupations.indexed_lines", locale),
      api.figureSafe("occupations.contribution_bars", locale),
      api.figureSafe("occupations.waterfall", locale),
      api.figureSafe("occupations.dumbbell", locale),
      api.figureSafe("occupations.skill_churn", locale),
      api.figureSafe("occupations.ai_exposure", locale),
      api.figureSafe("occupations.noc_naics_heatmap", locale),
    ]);
    asOf = meta.latest_month;
    figs = {
      treemap,
      indexedLines,
      contributionBars,
      waterfall,
      dumbbell,
      skillChurn,
      aiExposure,
      nocNaicsHeatmap,
    };
  } catch {
    return <ApiDown t={t} />;
  }

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            {t.eyebrow} · {fmtMonth(asOf, locale)}
          </div>
          <h1 className="h-display max-w-4xl text-balance">{t.hero}.</h1>
          <p className="lede mt-4 max-w-2xl">{t.lede}</p>
        </div>
      </section>

      {/* Core: what's in demand, and who grew */}
      <section className="container-x py-4">
        <Figure eyebrow={c.treemap.eyebrow} title={c.treemap.title} asOf={asOf} note={c.treemap.note}>
          <RemoteFigure fig={figs.treemap} height={460} ariaLabel={c.treemap.aria} />
        </Figure>
      </section>

      <section className="container-x py-4">
        <Figure eyebrow={c.indexedLines.eyebrow} title={c.indexedLines.title} asOf={asOf} note={c.indexedLines.note}>
          <RemoteFigure fig={figs.indexedLines} height={380} ariaLabel={c.indexedLines.aria} />
        </Figure>
      </section>

      {/* Deep divider */}
      <section className="container-x pt-8 pb-1">
        <div className="border-t border-card-border pt-6">
          <div className="eyebrow mb-1.5">{t.deepEyebrow}</div>
          <p className="lede max-w-2xl">{t.deepLede}</p>
        </div>
      </section>

      {/* Deep: contribution + reconciliation */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.contributionBars.eyebrow} title={c.contributionBars.title} asOf={asOf} note={c.contributionBars.note}>
            <RemoteFigure fig={figs.contributionBars} height={420} ariaLabel={c.contributionBars.aria} />
          </Figure>
          <Figure eyebrow={c.waterfall.eyebrow} title={c.waterfall.title} asOf={asOf} note={c.waterfall.note}>
            <RemoteFigure fig={figs.waterfall} height={440} ariaLabel={c.waterfall.aria} />
          </Figure>
        </div>
      </section>

      {/* Deep: then-vs-now + skill churn */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.dumbbell.eyebrow} title={c.dumbbell.title} asOf={asOf} note={c.dumbbell.note}>
            <RemoteFigure fig={figs.dumbbell} height={440} ariaLabel={c.dumbbell.aria} />
          </Figure>
          <Figure eyebrow={c.skillChurn.eyebrow} title={c.skillChurn.title} asOf={asOf} note={c.skillChurn.note}>
            <RemoteFigure fig={figs.skillChurn} height={460} ariaLabel={c.skillChurn.aria} />
          </Figure>
        </div>
      </section>

      {/* Deep: occupation-by-sector + AI exposure (the ceiling) */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.nocNaicsHeatmap.eyebrow} title={c.nocNaicsHeatmap.title} asOf={asOf} note={c.nocNaicsHeatmap.note}>
            <RemoteFigure fig={figs.nocNaicsHeatmap} height={460} ariaLabel={c.nocNaicsHeatmap.aria} />
          </Figure>
          <Figure eyebrow={c.aiExposure.eyebrow} title={c.aiExposure.title} asOf={asOf} note={c.aiExposure.note}>
            <RemoteFigure fig={figs.aiExposure} height={480} ariaLabel={c.aiExposure.aria} />
          </Figure>
        </div>
      </section>
    </div>
  );
}
