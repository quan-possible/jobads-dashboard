import { CoverageBar } from "@/components/CoverageBar";
import { Figure } from "@/components/Figure";
import { RouteMasthead } from "@/components/RouteMasthead";
import { SectionLead } from "@/components/SectionLead";
import { api } from "@/lib/api";
import { fmtInt, fmtMonth } from "@/lib/format";
import { methodDict } from "@/lib/i18n/dict/page-method";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === "fr"
    ? { title: "Méthode", description: "Sources, couverture des champs, mises en garde et définitions du tableau de bord de l’ACLMR." }
    : { title: "Method", description: "Data sources, field coverage, caveats and definitions for the ACLMR dashboard." };
}

function ApiDown({ t }: { t: (typeof methodDict)[keyof typeof methodDict] }) {
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

export default async function MethodPage() {
  const locale = await getLocale();
  const t = methodDict[locale];

  let meta;
  try {
    meta = await api.meta();
  } catch {
    return <ApiDown t={t} />;
  }

  return (
    <div className="pb-4">
      <RouteMasthead eyebrow={t.heroEyebrow} title={t.heroTitle} lede={t.heroIntro} />

      {/* What it measures / what it doesn't */}
      <section className="container-x py-8 md:py-10">
        <SectionLead number="01" label={locale === "fr" ? "Portée et limites" : "Scope and limits"} />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="border-l-4 border-teal bg-surface p-5 md:p-7">
            <h2 className="h-card mb-3">{t.measuresTitle}</h2>
            <ul className="flex flex-col gap-2 t-body leading-snug text-ink">
              {t.measuresItems.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-teal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-l-4 border-orange bg-surface-alt p-5 md:p-7">
            <h2 className="h-card mb-3">{t.notMeasuresTitle}</h2>
            <ul className="flex flex-col gap-2 t-body leading-snug text-ink">
              {t.notMeasuresItems.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Field coverage */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="02" label={locale === "fr" ? "Couverture des champs" : "Field coverage"} />
        <Figure
          eyebrow={t.coverageEyebrow}
          title={t.coverageTitle}
          note={t.coverageNote}
        >
          <p className="mb-4 t-body text-ink-soft">
            {t.coverageBuiltFrom}{" "}
            <span className="num font-bold text-navy">{fmtInt(meta.postings_total, locale)}</span>{" "}
            {t.coveragePostingsSpanning}{" "}
            <span className="num font-bold text-navy">
              {fmtMonth(meta.source_window.min_date, locale)} – {fmtMonth(meta.source_window.max_date, locale)}
            </span>
            .
          </p>
          <div className="flex flex-col gap-4">
            {meta.coverage.map((item) => (
              <CoverageBar
                key={item.field}
                label={t.coverageLabels[item.field] ?? item.label}
                share={item.share}
                count={item.postings}
                postingsLabel={t.coveragePostingsLabel}
                locale={locale}
              />
            ))}
          </div>
        </Figure>
      </section>

      {/* Category cap — public charts limited to 10 categories (Vicinity TOS) */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="03" label={locale === "fr" ? "Règles de présentation" : "Presentation rules"} />
        <Figure eyebrow={t.capEyebrow} title={t.capTitle}>
          <p className="t-body leading-relaxed text-ink-soft">{t.capBody}</p>
        </Figure>
      </section>

      {/* Caveats — text comes from the API, no translation */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="04" label={locale === "fr" ? "Mises en garde" : "Caveats"} />
        <Figure eyebrow={t.caveatsEyebrow} title={t.caveatsTitle}>
          <ul className="flex flex-col gap-3.5">
            {meta.caveats.map((caveat, i) => (
              <li key={i} className="flex gap-3 t-body leading-snug text-ink">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                <span>{t.caveatTranslations[caveat] ?? caveat}</span>
              </li>
            ))}
          </ul>
        </Figure>
      </section>

      {/* Glossary */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="05" label={locale === "fr" ? "Glossaire" : "Glossary"} />
        <Figure eyebrow={t.glossaryEyebrow} title={t.glossaryTitle}>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {t.glossaryTerms.map(({ term, def }) => (
              <div key={term}>
                <dt className="h-card mb-1">{term}</dt>
                <dd className="t-body text-ink-soft">{def}</dd>
              </div>
            ))}
          </dl>
        </Figure>
      </section>

      {/* Version */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="06" label={locale === "fr" ? "Version" : "Version"} />
        <Figure eyebrow={t.versionEyebrow} title={t.versionTitle}>
          <p className="t-body text-ink-soft">
            <span className="num font-bold text-navy">v1</span> ·{" "}
            {fmtMonth(meta.latest_month, locale)} — {t.versionRelease}{" "}
            {fmtMonth(meta.latest_month, locale)}; {t.versionGenerated}{" "}
            {fmtMonth(meta.generated_at_utc.slice(0, 7), locale)}.
          </p>
        </Figure>
      </section>
    </div>
  );
}
