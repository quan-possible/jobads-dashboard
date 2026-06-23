import { CoverageBar } from "@/components/CoverageBar";
import { Figure } from "@/components/Figure";
import { api } from "@/lib/api";
import { fmtCompact, fmtInt, fmtMonth } from "@/lib/format";
import { methodDict } from "@/lib/i18n/dict/page-method";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Method",
  description:
    "How the ACLMR dashboard works — data sources, field coverage, caveats and key term definitions.",
};

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
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">{t.heroEyebrow}</div>
          <h1 className="h-display max-w-4xl text-balance">{t.heroTitle}</h1>
          <p className="lede mt-4 max-w-2xl">{t.heroIntro}</p>
        </div>
      </section>

      {/* What it measures / what it doesn't */}
      <section className="container-x py-4">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card card-pad">
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

          <div className="card card-pad">
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
      <section className="container-x py-4">
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
                label={item.label}
                share={item.share}
                count={item.postings}
                postingsLabel={t.coveragePostingsLabel}
                locale={locale}
              />
            ))}
          </div>
        </Figure>
      </section>

      {/* Caveats — text comes from the API, no translation */}
      <section className="container-x py-4">
        <Figure eyebrow={t.caveatsEyebrow} title={t.caveatsTitle}>
          <ul className="flex flex-col gap-3.5">
            {meta.caveats.map((caveat, i) => (
              <li key={i} className="flex gap-3 t-body leading-snug text-ink">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                <span>{caveat}</span>
              </li>
            ))}
          </ul>
        </Figure>
      </section>

      {/* Glossary */}
      <section className="container-x py-4">
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
      <section className="container-x py-4">
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
