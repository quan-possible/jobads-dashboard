import { Figure } from "@/components/Figure";
import { RemoteFigure } from "@/components/RemoteFigure";
import { DeepDivider } from "@/components/DeepDivider";
import { RouteMasthead } from "@/components/RouteMasthead";
import { SectionLead } from "@/components/SectionLead";
import { api } from "@/lib/api";
import { figureServer } from "@/lib/api.server";
import { getLocale } from "@/lib/i18n/server";
import { wagesDict, type WagesDictEntry } from "@/lib/i18n/dict/page-wages";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = wagesDict[await getLocale()];
  return { title: t.eyebrowPrefix, description: t.heroLede };
}

function ApiDown({ t }: { t: WagesDictEntry }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">{t.apiDownTitle}</h1>
        <p className="text-ink-soft">
          {t.apiDownBody}{" "}
          <code className="bg-surface-alt px-1">
            uvicorn api.main:app --port 8530 --no-proxy-headers
          </code>
          .
        </p>
      </div>
    </div>
  );
}

export default async function WagesPage() {
  const locale = await getLocale();
  const t = wagesDict[locale];
  const c = t.charts;

  // National only (the figure bridge is national by construction). The as-of
  // stamp comes from meta; every chart body comes from the figure bridge,
  // fetched (and cached) server-side in parallel.
  let asOf: string;
  let figs;
  try {
    const [meta, wageBand, wageDumbbell, wageDemandQuadrant, educationWageProxy, wageByEducation, conditionsMix, languageGap] =
      await Promise.all([
        api.meta(),
        figureServer("pay.wage_band", locale),
        figureServer("pay.wage_dumbbell", locale),
        figureServer("pay.wage_demand_quadrant", locale),
        figureServer("pay.education_wage_proxy", locale),
        figureServer("pay.wage_by_education", locale),
        figureServer("pay.conditions_mix", locale),
        figureServer("pay.language_gap", locale),
      ]);
    asOf = meta.latest_month;
    figs = { wageBand, wageDumbbell, wageDemandQuadrant, educationWageProxy, wageByEducation, conditionsMix, languageGap };
  } catch {
    return <ApiDown t={t} />;
  }

  return (
    <div className="pb-4">
      <RouteMasthead eyebrow={t.eyebrowPrefix} title={t.heroTitle} lede={t.heroLede} asOf={asOf} locale={locale} />

      {/* Core: advertised wage band + provincial spread */}
      <section className="container-x py-8 md:py-10">
        <SectionLead number="01" label={locale === "fr" ? "Niveaux et écarts" : "Levels and spreads"} asOf={asOf} locale={locale} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.wageBand.eyebrow} title={c.wageBand.title} asOf={asOf} note={c.wageBand.note}>
            <RemoteFigure fig={figs.wageBand} height={380} ariaLabel={c.wageBand.aria} />
          </Figure>
          <Figure eyebrow={c.wageDumbbell.eyebrow} title={c.wageDumbbell.title} asOf={asOf} note={c.wageDumbbell.note}>
            <RemoteFigure fig={figs.wageDumbbell} height={440} ariaLabel={c.wageDumbbell.aria} />
          </Figure>
        </div>
      </section>

      <DeepDivider eyebrow={t.deepEyebrow} lede={t.deepLede} />

      {/* Deep: the conditioned wage premium — credential ladder + pay vs demand */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="02" label={locale === "fr" ? "Scolarité et offres" : "Education and postings"} asOf={asOf} locale={locale} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure
            eyebrow={c.wageByEducation.eyebrow}
            title={c.wageByEducation.title}
            asOf={asOf}
            note={c.wageByEducation.note}
          >
            <RemoteFigure fig={figs.wageByEducation} height={420} ariaLabel={c.wageByEducation.aria} />
          </Figure>
          <Figure
            eyebrow={c.educationWageProxy.eyebrow}
            title={c.educationWageProxy.title}
            asOf={asOf}
            note={c.educationWageProxy.note}
          >
            <RemoteFigure fig={figs.educationWageProxy} height={420} ariaLabel={c.educationWageProxy.aria} />
          </Figure>
        </div>
      </section>

      {/* Deep: pay vs demand quadrant */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="03" label={locale === "fr" ? "Salaire et volume" : "Pay and volume"} asOf={asOf} locale={locale} />
        <Figure
          eyebrow={c.wageDemandQuadrant.eyebrow}
          title={c.wageDemandQuadrant.title}
          asOf={asOf}
          note={c.wageDemandQuadrant.note}
        >
          <RemoteFigure fig={figs.wageDemandQuadrant} height={440} ariaLabel={c.wageDemandQuadrant.aria} />
        </Figure>
      </section>

      {/* Deep: posting conditions */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="04" label={locale === "fr" ? "Conditions annoncées" : "Advertised conditions"} asOf={asOf} locale={locale} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.conditionsMix.eyebrow} title={c.conditionsMix.title} asOf={asOf} note={c.conditionsMix.note}>
            <RemoteFigure fig={figs.conditionsMix} height={360} ariaLabel={c.conditionsMix.aria} />
          </Figure>
          <Figure eyebrow={c.languageGap.eyebrow} title={c.languageGap.title} asOf={asOf} note={c.languageGap.note}>
            <RemoteFigure fig={figs.languageGap} height={360} ariaLabel={c.languageGap.aria} />
          </Figure>
        </div>
      </section>
    </div>
  );
}
