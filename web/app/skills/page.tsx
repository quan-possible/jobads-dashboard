import { Figure } from "@/components/Figure";
import { RemoteFigure } from "@/components/RemoteFigure";
import { api } from "@/lib/api";
import { fmtMonth } from "@/lib/format";
import { getLocale } from "@/lib/i18n/server";
import { skillsDict } from "@/lib/i18n/dict/page-skills";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Skills and requirements most commonly listed in Canadian job postings, by region, occupation and industry.",
};

function ApiDown({ t }: { t: typeof skillsDict.en }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">{t.apiDownTitle}</h1>
        <p className="text-ink-soft">
          {t.apiDownBody}
          <code className="bg-surface-alt px-1">{t.apiDownCode}</code>.
        </p>
      </div>
    </div>
  );
}

export default async function SkillsPage() {
  const locale = await getLocale();
  const t = skillsDict[locale];
  const c = t.charts;

  // National only (the figure bridge is national by construction). Every chart
  // body comes from the figure bridge, fetched (and cached) server-side in
  // parallel; the as-of stamp comes from the meta endpoint.
  let figs;
  let asOf: string;
  try {
    const [meta, skillLift, education, experience] = await Promise.all([
      api.meta(),
      api.figure("skills.skill_lift", locale),
      api.figure("skills.education", locale),
      api.figure("skills.experience", locale),
    ]);
    asOf = meta.latest_month;
    figs = { skillLift, education, experience };
  } catch {
    return <ApiDown t={t} />;
  }

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            {t.heroEyebrowPrefix} · {fmtMonth(asOf)}
          </div>
          <h1 className="h-display max-w-4xl text-balance">{t.heroTitle}</h1>
          <p className="lede mt-4 max-w-2xl">{t.heroLede}</p>
        </div>
      </section>

      {/* Core: distinctive skills by lift */}
      <section className="container-x py-4">
        <Figure eyebrow={c.skillLift.eyebrow} title={c.skillLift.title} asOf={asOf} note={c.skillLift.note}>
          <RemoteFigure fig={figs.skillLift} height={420} ariaLabel={c.skillLift.aria} />
        </Figure>
      </section>

      {/* Deep divider */}
      <section className="container-x pt-8 pb-1">
        <div className="border-t border-card-border pt-6">
          <div className="eyebrow mb-1.5">{t.deepEyebrow}</div>
          <p className="lede max-w-2xl">{t.deepLede}</p>
        </div>
      </section>

      {/* Deep: education + experience requirements over time */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={c.education.eyebrow} title={c.education.title} asOf={asOf} note={c.education.note}>
            <RemoteFigure fig={figs.education} height={360} ariaLabel={c.education.aria} />
          </Figure>
          <Figure eyebrow={c.experience.eyebrow} title={c.experience.title} asOf={asOf} note={c.experience.note}>
            <RemoteFigure fig={figs.experience} height={360} ariaLabel={c.experience.aria} />
          </Figure>
        </div>
      </section>
    </div>
  );
}
