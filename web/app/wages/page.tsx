import { Figure } from "@/components/Figure";
import { RemoteFigure } from "@/components/RemoteFigure";
import { api } from "@/lib/api";
import { fmtMonth } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { wagesDict, type WagesDictEntry } from "@/lib/i18n/dict/page-wages";
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
        api.figureSafe("pay.wage_band", locale),
        api.figureSafe("pay.wage_dumbbell", locale),
        api.figureSafe("pay.wage_demand_quadrant", locale),
        api.figureSafe("pay.education_wage_proxy", locale),
        api.figureSafe("pay.wage_by_education", locale),
        api.figureSafe("pay.conditions_mix", locale),
        api.figureSafe("pay.language_gap", locale),
      ]);
    asOf = meta.latest_month;
    figs = { wageBand, wageDumbbell, wageDemandQuadrant, educationWageProxy, wageByEducation, conditionsMix, languageGap };
  } catch {
    return <ApiDown t={t} />;
  }

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            {t.eyebrowPrefix} · {fmtMonth(asOf, locale)}
          </div>
          <h1 className="h-display max-w-4xl text-balance">{t.heroTitle}</h1>
          <p className="lede mt-4 max-w-2xl">{t.heroLede}</p>
        </div>
      </section>

      {/* Core: advertised wage band + provincial spread */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.wageBand.eyebrow} title={c.wageBand.title} asOf={asOf} note={c.wageBand.note}>
            <RemoteFigure fig={figs.wageBand} height={380} ariaLabel={c.wageBand.aria} />
          </Figure>
          <Figure eyebrow={c.wageDumbbell.eyebrow} title={c.wageDumbbell.title} asOf={asOf} note={c.wageDumbbell.note}>
            <RemoteFigure fig={figs.wageDumbbell} height={440} ariaLabel={c.wageDumbbell.aria} />
          </Figure>
        </div>
      </section>

      {/* Deep divider */}
      <section className="container-x pt-8 pb-1">
        <div className="border-t border-card-border pt-6">
          <div className="eyebrow mb-1.5">{t.deepEyebrow}</div>
          <p className="lede max-w-2xl">{t.deepLede}</p>
        </div>
      </section>

      {/* Deep: the conditioned wage premium — credential ladder + pay vs demand */}
      <section className="container-x py-4">
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
      <section className="container-x py-4">
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
      <section className="container-x py-4">
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
