import { Figure } from "@/components/Figure";
import { RemoteFigure } from "@/components/RemoteFigure";
import { TunableFigure } from "@/components/TunableFigure";
import { DeepDivider } from "@/components/DeepDivider";
import { RouteMasthead } from "@/components/RouteMasthead";
import { SectionLead } from "@/components/SectionLead";
import { api } from "@/lib/api";
import { figureServer } from "@/lib/api.server";
import { getLocale } from "@/lib/i18n/server";
import { skillsDict } from "@/lib/i18n/dict/page-skills";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = skillsDict[await getLocale()];
  return { title: t.heroEyebrowPrefix, description: t.heroLede };
}

function ApiDown({ t }: { t: (typeof skillsDict)[keyof typeof skillsDict] }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">{t.apiDownTitle}</h1>
        <p className="text-ink-soft">{t.apiDownBody}</p>
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
    const [meta, topSkillsTrend, aiSkillDiffusion, skillLift, skillOccupationHeatmap, education, experience] = await Promise.all([
      api.meta(),
      figureServer("skills.top_skills_trend", locale),
      figureServer("skills.ai_skill_diffusion", locale),
      figureServer("skills.skill_lift", locale),
      figureServer("skills.skill_occupation_heatmap", locale),
      figureServer("skills.education", locale),
      figureServer("skills.experience", locale),
    ]);
    asOf = meta.latest_month;
    figs = { topSkillsTrend, aiSkillDiffusion, skillLift, skillOccupationHeatmap, education, experience };
  } catch {
    return <ApiDown t={t} />;
  }

  // Year-picker bounds for the general (tunable) charts. Data starts 2016; the
  // index base defaults to 2019 (the conventional, rebaseable base).
  const FIRST_YEAR = 2016;
  const asOfYear = Number(asOf.slice(0, 4));
  const latestComplete = asOf.slice(5, 7) === "12" ? asOfYear : asOfYear - 1;
  const BASE_YEAR = 2019;

  return (
    <div className="pb-4">
      <RouteMasthead eyebrow={t.heroEyebrowPrefix} title={t.heroTitle} lede={t.heroLede} asOf={asOf} locale={locale} />

      {/* Core: most-demanded skills and their trend (rebaseable index) */}
      <section className="container-x py-8 md:py-10">
        <SectionLead number="01" label={locale === "fr" ? "Tendances" : "Trends"} asOf={asOf} locale={locale} />
        <TunableFigure
          chartId="skills.top_skills_trend" initialFig={figs.topSkillsTrend} mode="base"
          minYear={FIRST_YEAR} maxYear={latestComplete} defaultBaseYear={BASE_YEAR}
          eyebrow={c.topSkillsTrend.eyebrow} title={c.topSkillsTrend.title} asOf={asOf}
          note={c.topSkillsTrend.note} ariaLabel={c.topSkillsTrend.aria} height={420} />
      </section>

      {/* Core: the AI-skill surge */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="02" label={locale === "fr" ? "Compétences en IA" : "AI skills"} asOf={asOf} locale={locale} />
        <Figure eyebrow={c.aiSkillDiffusion.eyebrow} title={c.aiSkillDiffusion.title} asOf={asOf} note={c.aiSkillDiffusion.note}>
          <RemoteFigure fig={figs.aiSkillDiffusion} height={380} ariaLabel={c.aiSkillDiffusion.aria} />
        </Figure>
      </section>

      {/* Core: what each occupation demands */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="03" label={locale === "fr" ? "Par profession" : "By occupation"} asOf={asOf} locale={locale} />
        <Figure eyebrow={c.skillOccupationHeatmap.eyebrow} title={c.skillOccupationHeatmap.title} asOf={asOf} note={c.skillOccupationHeatmap.note}>
          <RemoteFigure fig={figs.skillOccupationHeatmap} height={520} ariaLabel={c.skillOccupationHeatmap.aria} />
        </Figure>
      </section>

      <DeepDivider eyebrow={t.deepEyebrow} lede={t.deepLede} />

      {/* Deep: distinctive skills by lift */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="04" label={locale === "fr" ? "Par rapport à la part nationale" : "Compared with national share"} asOf={asOf} locale={locale} />
        <Figure eyebrow={c.skillLift.eyebrow} title={c.skillLift.title} asOf={asOf} note={c.skillLift.note}>
          <RemoteFigure fig={figs.skillLift} height={440} ariaLabel={c.skillLift.aria} />
        </Figure>
      </section>

      {/* Deep: education + experience requirements over time */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="05" label={locale === "fr" ? "Scolarité et expérience" : "Education and experience"} asOf={asOf} locale={locale} />
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
