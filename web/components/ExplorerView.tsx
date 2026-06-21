import Link from "next/link";
import { ClickableRanks } from "@/components/ClickableRanks";
import { ExplorerChart } from "@/components/ExplorerChart";
import { CompositionArea } from "@/components/CompositionArea";
import { MatrixHeatmap } from "@/components/MatrixHeatmap";
import { CoverageTrend } from "@/components/CoverageTrend";
import { DownloadCSV } from "@/components/DownloadCSV";
import { Figure } from "@/components/Figure";
import { KpiTile } from "@/components/KpiTile";
import { SkillBars } from "@/components/SkillBars";
import { api } from "@/lib/api";
import { fmtCompact, fmtInt, fmtMonth, fmtPct, fmtWage } from "@/lib/format";
import { GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS, labelFor } from "@/lib/options";
import type { ExplorersDictEntry } from "@/lib/i18n/dict/page-explorers";
import { explorerDict } from "@/lib/i18n/dict/explorer";
import type { Filters } from "@/lib/types";

const DIM_OPTS = {
  occupations: {
    param: "occ" as const,
    options: OCC_OPTIONS,
    eyebrow: (d: ExplorersDictEntry) => d.occEyebrow,
    title: (d: ExplorersDictEntry) => d.occTitle,
    lede: (d: ExplorersDictEntry) => d.occLede,
    rankTitle: (d: ExplorersDictEntry) => d.occRankTitle,
    rankNote: (d: ExplorersDictEntry) => d.occRankNote,
    selectHint: (d: ExplorersDictEntry) => d.occSelectHint,
  },
  industries: {
    param: "ind" as const,
    options: IND_OPTIONS,
    eyebrow: (d: ExplorersDictEntry) => d.indEyebrow,
    title: (d: ExplorersDictEntry) => d.indTitle,
    lede: (d: ExplorersDictEntry) => d.indLede,
    rankTitle: (d: ExplorersDictEntry) => d.indRankTitle,
    rankNote: (d: ExplorersDictEntry) => d.indRankNote,
    selectHint: (d: ExplorersDictEntry) => d.indSelectHint,
  },
};

export async function ExplorerView({
  filters,
  dim,
  dict,
  locale,
}: {
  filters: Filters;
  dim: "occupations" | "industries";
  dict: ExplorersDictEntry;
  locale: "en" | "fr";
}) {
  const c = DIM_OPTS[dim];
  const selectedValue = dim === "occupations" ? filters.occ : filters.ind;
  const selectedLabel = selectedValue ? labelFor(c.options, selectedValue) : null;

  const [ranks, ov, conc, comp, matrix, coverage] = await Promise.all([
    api.rank(dim, filters, { limit: 20, order: "value" }),
    api.overview(filters),
    api.concentration(dim, filters),
    api.composition(dim, filters),
    dim === "occupations" ? api.matrixOccProvince(filters, "lq") : Promise.resolve(null),
    dim === "industries" ? api.coverageTrend(filters, "naics") : Promise.resolve(null),
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
            {c.eyebrow(dict)} · {labelFor(GEO_OPTIONS, filters.geo)} · {fmtMonth(ov.as_of)}
          </div>
          <h1 className="h-display max-w-3xl text-balance">{c.title(dict)}</h1>
          <p className="lede mt-4 max-w-2xl">{c.lede(dict)}</p>
        </div>
      </section>

      <section className="container-x py-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <Figure
            eyebrow={`${c.eyebrow(dict)} · ${dict.rankEyebrowSuffix}`}
            title={c.rankTitle(dict)}
            asOf={ov.as_of}
            note={c.rankNote(dict)}
            actions={
              <DownloadCSV
                endpoint={rankEndpoint}
                filename={`aclmr-${dim}-${asOfSlug}.csv`}
                columns={[
                  { key: "code", header: dict.csvCode },
                  { key: "label", header: dict.csvLabel },
                  { key: "value", header: dict.csvActive },
                  { key: "yoy", header: dict.csvYoy },
                  { key: "share", header: dict.csvShare },
                ]}
              />
            }
          >
            <ClickableRanks items={ranks} param={c.param} options={c.options} />
          </Figure>
          <Figure
            eyebrow={dict.demandEyebrow}
            title={
              selectedLabel
                ? `${selectedLabel}: ${dict.demandTitleSelected}`
                : dict.demandTitleBase
            }
            asOf={ov.as_of}
            note={dict.demandNote}
          >
            <ExplorerChart series={ov.series} height={280} labels={explorerDict[locale]} />
          </Figure>
        </div>
      </section>

      {/* Concentration KPIs */}
      <section className="container-x py-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiTile label={dict.hhiLabel} value={fmtInt(conc.hhi)} context={dict.hhiContext} />
          <KpiTile label={dict.top5Label} value={`${Math.round(conc.top5_share * 100)}%`} context={dict.top5Context} />
          <KpiTile label={dict.nGroupsLabel} value={fmtInt(conc.n_groups)} context={dict.nGroupsContext} />
        </div>
      </section>

      {/* Composition over time + (occ: occ×province heatmap | ind: coverage line) */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-2">
          <Figure eyebrow={dict.compEyebrow} title={dict.compTitle} asOf={ov.as_of} note={dict.compNote}>
            <CompositionArea data={comp} />
          </Figure>
          {dim === "occupations" && matrix ? (
            <Figure eyebrow={dict.matrixEyebrow} title={dict.matrixTitle} asOf={ov.as_of} note={dict.matrixNote}>
              <MatrixHeatmap data={matrix} />
            </Figure>
          ) : coverage ? (
            <Figure eyebrow={dict.coverageEyebrow} title={dict.coverageTitle} asOf={ov.as_of} note={dict.coverageNote}>
              <CoverageTrend data={coverage} height={320} />
            </Figure>
          ) : null}
        </div>
      </section>

      {selectedLabel ? (
        <section className="container-x py-4">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 className="h-section">{selectedLabel}</h2>
            <Link
              href={dim === "occupations" ? "/occupations" : "/industries"}
              className="text-[0.74rem] font-bold uppercase tracking-[0.02em] text-orange-deep hover:underline"
            >
              {dict.clearSelection}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiTile
              label={dict.kpiActive}
              value={fmtCompact(ov.kpis.active_postings)}
              context={dict.kpiActiveContext}
              delta={ov.kpis.active_mom_pct}
              deltaLabel={dict.kpiActiveMonthLabel}
            />
            <KpiTile
              label={dict.kpiVsYear}
              value={fmtPct(ov.kpis.active_yoy_pct, { sign: true })}
              context={dict.kpiVsYearContext}
            />
            <KpiTile
              label={dict.kpiWage}
              value={fmtWage(wageItem && !wageItem.gated ? wageItem.median : null)}
              unit={wageItem && !wageItem.gated ? dict.kpiWageUnit : undefined}
              context={
                wageItem
                  ? wageItem.gated
                    ? dict.kpiInsufficient
                    : `n = ${fmtCompact(wageItem.n)}`
                  : "—"
              }
            />
          </div>

          <div className="mt-5">
            <Figure
              eyebrow={dict.skillsEyebrow}
              title={`${dict.skillsTitlePrefix} ${selectedLabel.toLowerCase()}`}
              asOf={ov.as_of}
              note={
                skills
                  ? `${dict.skillsNotePrefix} ${fmtInt(skills.n)} ${dict.skillsNotePostfix}`
                  : undefined
              }
            >
              {skills && skills.items.length > 0 ? (
                <SkillBars
                  items={skills.items}
                  metric="share"
                  ariaLabel={dict.skillBarsAriaLabel}
                  emptyText={dict.skillBarsEmptyText}
                />
              ) : (
                <p className="py-6 text-center text-[0.85rem] text-ink-faint">
                  {dict.skillsEmpty}
                </p>
              )}
            </Figure>
          </div>
        </section>
      ) : (
        <section className="container-x py-2">
          <p className="text-[0.9rem] text-ink-soft">{c.selectHint(dict)}</p>
        </section>
      )}
    </div>
  );
}
