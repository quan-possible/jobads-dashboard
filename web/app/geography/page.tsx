import { Choropleth } from "@/components/Choropleth";
import { ChoroplethTime } from "@/components/ChoroplethTime";
import { CumulativeCurve } from "@/components/CumulativeCurve";
import { DownloadCSV } from "@/components/DownloadCSV";
import { Figure } from "@/components/Figure";
import { SegmentToggle } from "@/components/SegmentToggle";
import { api } from "@/lib/api";
import { fmtCompact, fmtInt, fmtMonth } from "@/lib/format";
import { geographyDict } from "@/lib/i18n/dict/page-geography";
import { getLocale } from "@/lib/i18n/server";
import { GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS, labelFor } from "@/lib/options";
import type { Filters, GeoItem } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Geography",
  description:
    "Posted hiring demand by Canadian province — per-capita, concentration, and raw count views.",
};

function ApiDown({ t }: { t: (typeof geographyDict)[keyof typeof geographyDict] }) {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">{t.apiDownTitle}</h1>
        <p className="text-ink-soft">{t.apiDownBody} <code className="bg-surface-alt px-1">uvicorn api.main:app --port 8530</code>.</p>
      </div>
    </div>
  );
}

function valueText(item: GeoItem, measure: string): string {
  const v = item.value;
  if (v === null || v === undefined) return "—";
  if (measure === "count") return fmtCompact(v);
  if (measure === "lq") return v.toFixed(2);
  return fmtInt(v);
}

function RankedProvinces({ items, measure }: { items: GeoItem[]; measure: string }) {
  const max = Math.max(1, ...items.map((i) => i.value ?? 0));
  return (
    <ol className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.code} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[0.9rem] font-bold text-navy" title={it.label}>{it.label}</span>
          <span className="num text-[0.85rem] font-bold text-teal">{valueText(it, measure)}</span>
          <div className="col-span-2 h-2 w-full overflow-hidden rounded-sm bg-surface-alt">
            <div className="h-full rounded-sm bg-teal transition-[width] duration-500" style={{ width: `${Math.max(3, ((it.value ?? 0) / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function GeographyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const t = geographyDict[locale];

  const sp = await searchParams;
  const filters: Filters = {
    geo: typeof sp.geo === "string" ? sp.geo : undefined,
    occ: typeof sp.occ === "string" ? sp.occ : undefined,
    ind: typeof sp.ind === "string" ? sp.ind : undefined,
  };
  const measure = typeof sp.measure === "string" ? sp.measure : "per10k";

  let data, trend;
  try {
    [data, trend] = await Promise.all([api.geography(filters, measure), api.geographyTrend(filters)]);
  } catch {
    return <ApiDown t={t} />;
  }

  const occLabel = labelFor(OCC_OPTIONS, filters.occ);
  const indLabel = labelFor(IND_OPTIONS, filters.ind);
  const sliceNote =
    filters.occ || filters.ind
      ? `${t.sliceShowing}${occLabel.toLowerCase() === "all occupations" ? occLabel : occLabel}${filters.ind ? `${t.sliceIn}${indLabel}` : ""}${t.sliceTrailing}`
      : t.sliceAll;

  const measureExplainer =
    measure === "per10k"
      ? t.explainerPer10k
      : measure === "lq"
        ? t.explainerLq
        : t.explainerCount;

  const MEASURES = [
    { value: "per10k", label: t.measurePer10k },
    { value: "lq", label: t.measureLq },
    { value: "count", label: t.measureCount },
  ];

  // Build query string for CSV download.
  const geoQS = (() => {
    const p = new URLSearchParams({ measure });
    if (filters.geo) p.set("geo", filters.geo);
    if (filters.occ) p.set("occ", filters.occ);
    if (filters.ind) p.set("ind", filters.ind);
    return p.toString();
  })();
  const asOfSlug = data.as_of ?? "latest";

  return (
    <div className="pb-4">
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">{t.eyebrow} · {labelFor(GEO_OPTIONS, filters.geo)} · {fmtMonth(data.as_of)}</div>
          <h1 className="h-display max-w-3xl text-balance">{t.hero}</h1>
          <p className="lede mt-4 max-w-2xl">{t.lede}</p>
        </div>
      </section>

      <section className="container-x py-8">
        <Figure
          eyebrow={t.figureEyebrow}
          title={t.figureTitle}
          asOf={data.as_of}
          actions={
            <>
              <DownloadCSV
                endpoint={`/api/geography?${geoQS}`}
                filename={`aclmr-geography-${measure}-${asOfSlug}.csv`}
                columns={[
                  { key: "code", header: "Code" },
                  { key: "label", header: "Province" },
                  { key: "value", header: "Value" },
                  { key: "count", header: "Count" },
                  { key: "per10k", header: "Per 10k" },
                  { key: "lq", header: "Location Quotient" },
                ]}
              />
              <SegmentToggle param="measure" defaultValue="per10k" options={MEASURES} ariaLabel={t.toggleAriaLabel} />
            </>
          }
          note={
            <>
              <span className="block">{measureExplainer}</span>
              <span className="mt-1 block text-ink-faint">{sliceNote} {t.territoryNote}</span>
            </>
          }
        >
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Choropleth items={data.items} measure={measure} labels={t.legend} />
            <div>
              <p className="eyebrow mb-3 text-ink-faint">{t.rankedPrefix}{MEASURES.find((m) => m.value === measure)?.label}</p>
              <RankedProvinces items={data.items} measure={measure} />
            </div>
          </div>
        </Figure>
      </section>

      {/* Time-scrubbed choropleth + cumulative concentration */}
      <section className="container-x py-4">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Figure eyebrow={t.timeEyebrow} title={t.timeTitle} asOf={data.as_of} note={t.timeNote}>
            <ChoroplethTime data={trend} playLabel={t.playLabel} monthPrefix={t.monthPrefix} />
          </Figure>
          <Figure eyebrow={t.cumEyebrow} title={t.cumTitle} asOf={data.as_of} note={t.cumNote}>
            <CumulativeCurve
              items={data.items.map((i) => ({ label: i.label, value: i.count ?? 0 }))}
              unitLabel={t.cumUnit}
            />
          </Figure>
        </div>
      </section>
    </div>
  );
}
