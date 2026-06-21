import { DownloadCSV } from "@/components/DownloadCSV";
import { Figure } from "@/components/Figure";
import { ShareBars } from "@/components/ShareBars";
import { SkillBars } from "@/components/SkillBars";
import { api } from "@/lib/api";
import { fmtCompact, fmtMonth } from "@/lib/format";
import { ALL_GEO, ALL_IND, ALL_OCC, GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS, labelFor } from "@/lib/options";
import type { Filters } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Skills and requirements most commonly listed in Canadian job postings, by region, occupation and industry.",
};

function ApiDown() {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">Data service unavailable</h1>
        <p className="text-ink-soft">
          The API isn&apos;t responding. Start it with{" "}
          <code className="bg-surface-alt px-1">
            uvicorn api.main:app --port 8530
          </code>
          .
        </p>
      </div>
    </div>
  );
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters: Filters = {
    geo: typeof sp.geo === "string" ? sp.geo : undefined,
    occ: typeof sp.occ === "string" ? sp.occ : undefined,
    ind: typeof sp.ind === "string" ? sp.ind : undefined,
  };

  const scopeActive =
    (filters.geo !== undefined && filters.geo !== ALL_GEO) ||
    (filters.occ !== undefined && filters.occ !== ALL_OCC) ||
    (filters.ind !== undefined && filters.ind !== ALL_IND);

  let top, distinctive, requirements;
  try {
    [top, distinctive, requirements] = await Promise.all([
      api.skills(filters, { mode: "top", limit: 15 }),
      api.skills(filters, { mode: "distinctive", limit: 12 }),
      api.requirements(filters),
    ]);
  } catch {
    return <ApiDown />;
  }

  const regionLabel = labelFor(GEO_OPTIONS, filters.geo);
  const occLabel = labelFor(OCC_OPTIONS, filters.occ);
  const indLabel = labelFor(IND_OPTIONS, filters.ind);

  // Build a compact scope descriptor for the hero eyebrow
  const scopeParts = [regionLabel];
  if (filters.occ) scopeParts.push(occLabel);
  if (filters.ind) scopeParts.push(indLabel);

  const as_of = top.as_of;

  // Build query strings for CSV download endpoints.
  function skillsQS(mode: string, limit: number): string {
    const p = new URLSearchParams({ mode, limit: String(limit) });
    if (filters.geo) p.set("geo", filters.geo);
    if (filters.occ) p.set("occ", filters.occ);
    if (filters.ind) p.set("ind", filters.ind);
    return p.toString();
  }

  const asOfSlug = as_of ?? "latest";

  const skillColumns = [
    { key: "code", header: "Code" },
    { key: "label", header: "Skill" },
    { key: "group", header: "Group" },
    { key: "share", header: "Share" },
    { key: "count", header: "Count" },
    { key: "lift", header: "Lift" },
  ];

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            Skills &amp; requirements &middot; {scopeParts.join(" · ")} &middot; {fmtMonth(as_of)}
          </div>
          <h1 className="h-display max-w-4xl text-balance">
            What employers are asking for
          </h1>
          <p className="lede mt-4 max-w-2xl">
            Skills and requirements drawn from job postings that explicitly list
            them. Coverage varies — education and remote-work fields are sparsely
            reported, so those figures reflect only the postings that include
            them.
          </p>
        </div>
      </section>

      {/* Most-requested skills */}
      <section className="container-x py-4">
        <Figure
          eyebrow={`Share of postings · skills`}
          title="Most-requested skills"
          asOf={as_of}
          actions={
            <DownloadCSV
              endpoint={`/api/skills?${skillsQS("top", 15)}`}
              filename={`aclmr-skills-top-${asOfSlug}.csv`}
              columns={skillColumns}
            />
          }
          note={`Among the ${fmtCompact(top.n)} postings that list skills.`}
        >
          <SkillBars items={top.items} metric="share" />
        </Figure>
      </section>

      {/* Distinctive skills */}
      <section className="container-x py-4">
        <Figure
          eyebrow="Vs the national mix"
          title="What’s distinctive here"
          asOf={as_of}
          actions={
            scopeActive ? (
              <DownloadCSV
                endpoint={`/api/skills?${skillsQS("distinctive", 12)}`}
                filename={`aclmr-skills-distinctive-${asOfSlug}.csv`}
                columns={skillColumns}
              />
            ) : undefined
          }
          note="Skills more common here than across Canada (lift = local share ÷ national share)."
        >
          {!scopeActive ? (
            <p className="py-8 text-center text-[0.88rem] text-ink-faint">
              Select a region, occupation or industry in the filter bar to see
              the skills that set it apart.
            </p>
          ) : (
            <SkillBars items={distinctive.items} metric="lift" />
          )}
        </Figure>
      </section>

      {/* Requirements grid */}
      <section className="container-x py-4">
        <div className="grid gap-5 md:grid-cols-2">
          {requirements.education.length > 0 && (
            <Figure
              eyebrow="Requirements · education"
              title="Education"
              asOf={as_of}
              note="Sparsely reported — reflects only postings that specify an education requirement."
            >
              <ShareBars items={requirements.education} />
            </Figure>
          )}
          {requirements.experience.length > 0 && (
            <Figure
              eyebrow="Requirements · experience"
              title="Experience"
              asOf={as_of}
            >
              <ShareBars items={requirements.experience} />
            </Figure>
          )}
          {requirements.language.length > 0 && (
            <Figure
              eyebrow="Requirements · work language"
              title="Work language"
              asOf={as_of}
            >
              <ShareBars items={requirements.language} />
            </Figure>
          )}
          {requirements.remote.length > 0 && (
            <Figure
              eyebrow="Requirements · remote work"
              title="Remote work"
              asOf={as_of}
              note="Sparsely reported — most postings do not specify a remote-work arrangement."
            >
              <ShareBars items={requirements.remote} />
            </Figure>
          )}
        </div>
      </section>
    </div>
  );
}
