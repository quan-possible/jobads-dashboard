import { Figure } from "@/components/Figure";
import { RemoteFigure } from "@/components/RemoteFigure";
import { TunableFigure } from "@/components/TunableFigure";
import { DeepDivider } from "@/components/DeepDivider";
import { RouteMasthead } from "@/components/RouteMasthead";
import { SectionLead } from "@/components/SectionLead";
import { api } from "@/lib/api";
import { figureServer } from "@/lib/api.server";
import { getLocale } from "@/lib/i18n/server";
import { industriesDict } from "@/lib/i18n/dict/page-industries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Posted hiring demand across Canadian industry sectors (NAICS), with trends, wages and in-demand skills.",
};

function ApiDown({ t }: { t: (typeof industriesDict)[keyof typeof industriesDict] }) {
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

export default async function IndustriesPage() {
  const locale = await getLocale();
  const t = industriesDict[locale];
  const c = t.charts;

  // National only (the figure bridge is national by construction). Every chart
  // body comes from the figure bridge, fetched (and cached) server-side in
  // parallel; the as-of stamp comes from meta.
  let figs;
  let asOf: string;
  try {
    const [meta, coverageLine, treemap, shareOverTime, contributionBars] = await Promise.all([
      api.meta(),
      figureServer("industries.coverage_line", locale),
      figureServer("industries.treemap", locale),
      figureServer("industries.share_over_time", locale),
      figureServer("industries.contribution_bars", locale),
    ]);
    asOf = meta.latest_month;
    figs = { coverageLine, treemap, shareOverTime, contributionBars };
  } catch {
    return <ApiDown t={t} />;
  }

  // Year-picker bounds for the general (tunable) contribution chart.
  const FIRST_YEAR = 2016;
  const asOfYear = Number(asOf.slice(0, 4));
  const latestComplete = asOf.slice(5, 7) === "12" ? asOfYear : asOfYear - 1;
  const BASE_YEAR = 2019;

  return (
    <div className="pb-4">
      <RouteMasthead eyebrow={t.eyebrow} title={`${t.hero}.`} lede={t.lede} asOf={asOf} locale={locale} />

      {/* Core: coverage + industry mix over time */}
      <section className="container-x py-8 md:py-10">
        <SectionLead number="01" label={locale === "fr" ? "Couverture et composition" : "Coverage and composition"} asOf={asOf} locale={locale} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.coverageLine.eyebrow} title={c.coverageLine.title} asOf={asOf} note={c.coverageLine.note}>
            <RemoteFigure fig={figs.coverageLine} height={360} ariaLabel={c.coverageLine.aria} />
          </Figure>
          <Figure eyebrow={c.shareOverTime.eyebrow} title={c.shareOverTime.title} asOf={asOf} note={c.shareOverTime.note}>
            <RemoteFigure fig={figs.shareOverTime} height={380} ariaLabel={c.shareOverTime.aria} />
          </Figure>
        </div>
      </section>

      {/* Core: sector treemap */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="02" label={locale === "fr" ? "Structure sectorielle" : "Sector structure"} asOf={asOf} locale={locale} />
        <Figure eyebrow={c.treemap.eyebrow} title={c.treemap.title} asOf={asOf} note={c.treemap.note}>
          <RemoteFigure fig={figs.treemap} height={460} ariaLabel={c.treemap.aria} />
        </Figure>
      </section>

      <DeepDivider eyebrow={t.deepEyebrow} lede={t.deepLede} />

      {/* Deep: contribution to growth (general window) */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="03" label={locale === "fr" ? "Contribution à la variation" : "Contribution to change"} asOf={asOf} locale={locale} />
        <TunableFigure
          chartId="industries.contribution_bars" initialFig={figs.contributionBars} mode="baseEnd"
          minYear={FIRST_YEAR} maxYear={latestComplete} defaultBaseYear={BASE_YEAR} defaultEndYear={latestComplete}
          eyebrow={c.contributionBars.eyebrow} title={c.contributionBars.title} asOf={asOf}
          note={c.contributionBars.note} ariaLabel={c.contributionBars.aria} height={420} />
      </section>
    </div>
  );
}
