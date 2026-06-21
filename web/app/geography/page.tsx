import { Choropleth } from "@/components/Choropleth";
import { DownloadCSV } from "@/components/DownloadCSV";
import { Figure } from "@/components/Figure";
import { SegmentToggle } from "@/components/SegmentToggle";
import { api } from "@/lib/api";
import { fmtCompact, fmtInt, fmtMonth } from "@/lib/format";
import { GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS, labelFor } from "@/lib/options";
import type { Filters, GeoItem } from "@/lib/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Geography",
  description:
    "Posted hiring demand by Canadian province — per-capita, concentration, and raw count views.",
};

function ApiDown() {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">Data service unavailable</h1>
        <p className="text-ink-soft">The API isn’t responding. Start it with <code className="bg-surface-alt px-1">uvicorn api.main:app --port 8530</code>.</p>
      </div>
    </div>
  );
}

const MEASURES = [
  { value: "per10k", label: "Per 10k" },
  { value: "lq", label: "Concentration" },
  { value: "count", label: "Count" },
];

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
  const sp = await searchParams;
  const filters: Filters = {
    geo: typeof sp.geo === "string" ? sp.geo : undefined,
    occ: typeof sp.occ === "string" ? sp.occ : undefined,
    ind: typeof sp.ind === "string" ? sp.ind : undefined,
  };
  const measure = typeof sp.measure === "string" ? sp.measure : "per10k";

  let data;
  try {
    data = await api.geography(filters, measure);
  } catch {
    return <ApiDown />;
  }

  const occLabel = labelFor(OCC_OPTIONS, filters.occ);
  const indLabel = labelFor(IND_OPTIONS, filters.ind);
  const sliceNote =
    filters.occ || filters.ind
      ? `Showing ${occLabel.toLowerCase() === "all occupations" ? "all occupations" : occLabel}${filters.ind ? ` in ${indLabel}` : ""}.`
      : "Showing all postings.";

  const measureExplainer =
    measure === "per10k"
      ? "Postings per 10,000 people in each province’s labour force — adjusts for the size of the workforce."
      : measure === "lq"
        ? "Location quotient: a province’s share of postings divided by its share of the labour force. Above 1.0 means hiring is concentrated there relative to its size."
        : "Raw count of active postings — larger provinces lead simply because they are larger.";

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
          <div className="eyebrow mb-3">Geography · {labelFor(GEO_OPTIONS, filters.geo)} · {fmtMonth(data.as_of)}</div>
          <h1 className="h-display max-w-3xl text-balance">Where the hiring is</h1>
          <p className="lede mt-4 max-w-2xl">
            Posted demand by province. Per-capita and concentration views correct for the simple fact that
            bigger provinces post more — so you can see where hiring runs hot relative to the local workforce.
          </p>
        </div>
      </section>

      <section className="container-x py-8">
        <Figure
          eyebrow="By province"
          title="Posted hiring demand across Canada"
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
              <SegmentToggle param="measure" defaultValue="per10k" options={MEASURES} ariaLabel="Choose how to measure demand" />
            </>
          }
          note={
            <>
              <span className="block">{measureExplainer}</span>
              <span className="mt-1 block text-ink-faint">{sliceNote} Nunavut and Yukon are not covered in the source data and show as “no data.”</span>
            </>
          }
        >
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Choropleth items={data.items} measure={measure} />
            <div>
              <p className="eyebrow mb-3 text-ink-faint">Ranked · {MEASURES.find((m) => m.value === measure)?.label}</p>
              <RankedProvinces items={data.items} measure={measure} />
            </div>
          </div>
        </Figure>
      </section>
    </div>
  );
}
