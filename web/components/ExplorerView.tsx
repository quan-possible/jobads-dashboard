import Link from "next/link";
import { ClickableRanks } from "@/components/ClickableRanks";
import { DemandChart } from "@/components/DemandChart";
import { DownloadCSV } from "@/components/DownloadCSV";
import { Figure } from "@/components/Figure";
import { KpiTile } from "@/components/KpiTile";
import { SkillBars } from "@/components/SkillBars";
import { api } from "@/lib/api";
import { fmtCompact, fmtInt, fmtMonth, fmtPct, fmtWage } from "@/lib/format";
import { GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS, labelFor } from "@/lib/options";
import type { Filters } from "@/lib/types";

const COPY = {
  occupations: {
    param: "occ" as const,
    options: OCC_OPTIONS,
    eyebrow: "Occupations",
    title: "Which occupations employers are hiring for",
    lede: "Posted hiring demand across the ten broad occupational groups (NOC). Select a group to see its trend, pay and most-requested skills — your choice carries across every page.",
    rankTitle: "Hiring demand by occupational group",
    rankNote: "Active postings this month, with year-over-year change. Click a group to filter the whole dashboard.",
  },
  industries: {
    param: "ind" as const,
    options: IND_OPTIONS,
    eyebrow: "Industries",
    title: "Which industries are posting jobs",
    lede: "Posted hiring demand across industry sectors (NAICS). Select a sector to see its trend, pay and most-requested skills — your choice carries across every page.",
    rankTitle: "Hiring demand by industry sector",
    rankNote: "Active postings this month, with year-over-year change. Click a sector to filter the whole dashboard.",
  },
};

export async function ExplorerView({ filters, dim }: { filters: Filters; dim: "occupations" | "industries" }) {
  const c = COPY[dim];
  const selectedValue = dim === "occupations" ? filters.occ : filters.ind;
  const selectedLabel = selectedValue ? labelFor(c.options, selectedValue) : null;

  const [ranks, ov] = await Promise.all([
    api.rank(dim, filters, { limit: 20, order: "value" }),
    api.overview(filters),
  ]);

  let skills = null;
  let wage = null;
  if (selectedValue) {
    [skills, wage] = await Promise.all([
      api.skills(filters, { mode: "top", limit: 10 }),
      api.wages(filters, "overall"),
    ]);
  }
  const wageItem = wage?.items?.[0] ?? null;

  // Build CSV download endpoint for the ranked list.
  const rankQS = (() => {
    const p = new URLSearchParams({ limit: "20", order: "value" });
    if (filters.geo) p.set("geo", filters.geo);
    if (filters.occ) p.set("occ", filters.occ);
    if (filters.ind) p.set("ind", filters.ind);
    return p.toString();
  })();
  const rankEndpoint = `/api/rank/${dim}?${rankQS}`;
  const asOfSlug = ov.as_of ?? "latest";

  return (
    <div className="pb-4">
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">
            {c.eyebrow} · {labelFor(GEO_OPTIONS, filters.geo)} · {fmtMonth(ov.as_of)}
          </div>
          <h1 className="h-display max-w-3xl text-balance">{c.title}</h1>
          <p className="lede mt-4 max-w-2xl">{c.lede}</p>
        </div>
      </section>

      <section className="container-x py-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <Figure
            eyebrow={`${c.eyebrow} · year over year`}
            title={c.rankTitle}
            asOf={ov.as_of}
            note={c.rankNote}
            actions={
              <DownloadCSV
                endpoint={rankEndpoint}
                filename={`aclmr-${dim}-${asOfSlug}.csv`}
                columns={[
                  { key: "code", header: "Code" },
                  { key: "label", header: "Label" },
                  { key: "value", header: "Active Postings" },
                  { key: "yoy", header: "YoY (%)" },
                  { key: "share", header: "Share" },
                ]}
                pick={(json) => (Array.isArray(json) ? json : [])}
              />
            }
          >
            <ClickableRanks items={ranks} param={c.param} options={c.options} />
          </Figure>
          <Figure
            eyebrow="Demand over time"
            title={selectedLabel ? `${selectedLabel}: demand vs the 2019 norm` : "Demand vs the 2019 norm"}
            asOf={ov.as_of}
            note="Indexed monthly active postings for the current selection, January 2019 = 100."
          >
            <DemandChart series={ov.series} height={260} />
          </Figure>
        </div>
      </section>

      {selectedLabel ? (
        <section className="container-x py-4">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="h-section">{selectedLabel}</h2>
            <Link
              href={dim === "occupations" ? "/occupations" : "/industries"}
              className="text-[0.74rem] font-bold uppercase tracking-[0.02em] text-orange hover:underline"
            >
              Clear selection ✕
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiTile label="Active postings" value={fmtCompact(ov.kpis.active_postings)} context="this month" delta={ov.kpis.active_mom_pct} deltaLabel="MoM" />
            <KpiTile label="Vs last year" value={fmtPct(ov.kpis.active_yoy_pct, { sign: true })} context="year over year" />
            <KpiTile
              label="Median wage"
              value={fmtWage(wageItem && !wageItem.gated ? wageItem.median : null)}
              unit={wageItem && !wageItem.gated ? "/hr" : undefined}
              context={wageItem ? (wageItem.gated ? "insufficient sample" : `n = ${fmtCompact(wageItem.n)}`) : "—"}
            />
          </div>

          <div className="mt-5">
            <Figure
              eyebrow="Skills"
              title={`Most-requested skills in ${selectedLabel.toLowerCase()}`}
              asOf={ov.as_of}
              note={skills ? `Among the ${fmtInt(skills.n)} postings in this selection that list skills.` : undefined}
            >
              {skills && skills.items.length > 0 ? (
                <SkillBars items={skills.items} metric="share" />
              ) : (
                <p className="py-6 text-center text-[0.85rem] text-ink-faint">No skill data for this selection.</p>
              )}
            </Figure>
          </div>
        </section>
      ) : (
        <section className="container-x py-2">
          <p className="text-[0.9rem] text-ink-soft">
            Select a {dim === "occupations" ? "group" : "sector"} above to see its trend, pay and most-requested skills.
          </p>
        </section>
      )}
    </div>
  );
}
