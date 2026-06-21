import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers",
  description: "Public JSON API over the ACLMR labour-market aggregates.",
};

// ── Types ────────────────────────────────────────────────────────────────────

type Param = {
  name: string;
  type: string;
  desc: string;
};

type Endpoint = {
  method: "GET";
  path: string;
  purpose: string;
  params?: Param[];
};

// ── Data ─────────────────────────────────────────────────────────────────────

const SCOPE_PARAMS: Param[] = [
  { name: "geo",   type: "string",  desc: 'Province code (e.g. "ON") or "All Canada".' },
  { name: "occ",   type: "string",  desc: 'NOC broad code and label (e.g. "6 | Sales and service") or "All occupations".' },
  { name: "ind",   type: "string",  desc: 'NAICS code and label (e.g. "62 | Health care") or "All industries".' },
  { name: "start", type: "YYYY-MM", desc: "Start month of the data window (inclusive)." },
  { name: "end",   type: "YYYY-MM", desc: "End month of the data window (inclusive)." },
];

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/meta",
    purpose: "Dataset metadata: date window, total posting count, field coverage rates, caveats, and glossary.",
    params: [],
  },
  {
    method: "GET",
    path: "/api/overview",
    purpose: "High-level snapshot of posting demand for the active scope: current level, YoY change, and context.",
    params: SCOPE_PARAMS,
  },
  {
    method: "GET",
    path: "/api/series/postings",
    purpose: "Monthly time series of posting demand.",
    params: [
      { name: "metric", type: '"index" | "level" | "yoy"', desc: 'Demand index (Jan 2019 = 100), raw posting count, or year-over-year % change. Required.' },
      ...SCOPE_PARAMS,
    ],
  },
  {
    method: "GET",
    path: "/api/rank/{dim}",
    purpose: "Ranked list of occupations or industries by posting volume or YoY growth.",
    params: [
      { name: "dim",   type: '"occupations" | "industries"', desc: "Dimension to rank (path param). Required." },
      { name: "limit", type: "integer",                      desc: "Number of rows to return. Default: 10." },
      { name: "order", type: '"value" | "yoy"',              desc: 'Sort by posting volume or year-over-year change. Default: "value".' },
      ...SCOPE_PARAMS,
    ],
  },
  {
    method: "GET",
    path: "/api/geography",
    purpose: "Posting intensity by province using the chosen geographic measure.",
    params: [
      { name: "measure", type: '"per10k" | "lq" | "count"', desc: "Postings per 10k labour-force, location quotient, or raw count. Required." },
      ...SCOPE_PARAMS,
    ],
  },
  {
    method: "GET",
    path: "/api/wages",
    purpose: "Posted wage percentiles (p25 / median / p75) broken down by the chosen dimension.",
    params: [
      { name: "dim", type: '"occupation" | "province" | "overall"', desc: "Breakdown dimension. Required." },
      ...SCOPE_PARAMS,
    ],
  },
  {
    method: "GET",
    path: "/api/skills",
    purpose: "Top or distinctive skills mentioned in postings within the active scope.",
    params: [
      { name: "mode",  type: '"top" | "distinctive"', desc: 'Most frequent skills ("top") or skills with high lift vs. Canada ("distinctive"). Required.' },
      { name: "limit", type: "integer",               desc: "Number of skills to return. Default: 20." },
      ...SCOPE_PARAMS,
    ],
  },
  {
    method: "GET",
    path: "/api/requirements",
    purpose: "Share of postings specifying remote/hybrid work, education, or experience requirements.",
    params: SCOPE_PARAMS,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ParamRow({ p }: { p: Param }) {
  return (
    <tr className="border-t border-hairline">
      <td className="py-2 pr-4 align-top">
        <code className="font-mono text-[0.82rem] text-navy">{p.name}</code>
      </td>
      <td className="py-2 pr-4 align-top">
        <code className="font-mono text-[0.78rem] text-ink-faint">{p.type}</code>
      </td>
      <td className="py-2 align-top text-[0.88rem] text-ink-soft">{p.desc}</td>
    </tr>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  return (
    <div className="card card-pad flex flex-col gap-4">
      {/* Method + path */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span
          className="shrink-0 rounded-none border border-teal px-2 py-0.5 font-mono text-[0.72rem] font-bold uppercase tracking-wider text-teal"
        >
          {ep.method}
        </span>
        <code className="font-mono text-[1rem] font-bold text-navy-deep">{ep.path}</code>
      </div>

      {/* Purpose */}
      <p className="text-[0.95rem] text-ink-soft">{ep.purpose}</p>

      {/* Params table */}
      {ep.params && ep.params.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">Param</th>
                <th className="pb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">Type</th>
                <th className="pb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">Description</th>
              </tr>
            </thead>
            <tbody>
              {ep.params.map((p) => (
                <ParamRow key={p.name} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DevelopersPage() {
  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">Developers</div>
          <h1 className="h-display max-w-3xl text-balance">Public data API</h1>
          <p className="lede mt-4 max-w-2xl">
            Typed JSON over the ACLMR labour-market aggregates. Read-only and CORS-enabled.
            Base URL: <code className="font-mono text-[0.9em] text-navy">/api</code>.
            Interactive OpenAPI docs are available at the API origin:{" "}
            <a
              href="http://127.0.0.1:8530/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-orange underline underline-offset-2 hover:text-orange-deep"
            >
              /docs
            </a>
            .
          </p>
        </div>
      </section>

      {/* Scope parameters */}
      <section className="container-x py-8">
        <div className="mb-5">
          <div className="eyebrow mb-1.5">Shared parameters</div>
          <h2 className="h-section">Scope parameters</h2>
          <p className="mt-2 max-w-2xl text-[0.95rem] text-ink-soft">
            Every endpoint that filters data accepts these five shared scope params. Omit any to use the default (all of Canada, all occupations/industries, trailing 12 months).
          </p>
        </div>

        <div className="card card-pad overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">Param</th>
                <th className="pb-2 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">Type</th>
                <th className="pb-2 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">Description</th>
              </tr>
            </thead>
            <tbody>
              {SCOPE_PARAMS.map((p) => (
                <ParamRow key={p.name} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Endpoints */}
      <section className="container-x py-4">
        <div className="mb-5">
          <div className="eyebrow mb-1.5">Reference</div>
          <h2 className="h-section">Endpoints</h2>
        </div>

        <div className="flex flex-col gap-5">
          {ENDPOINTS.map((ep) => (
            <EndpointCard key={ep.path} ep={ep} />
          ))}
        </div>
      </section>

      {/* Privacy note */}
      <section className="container-x py-8">
        <div className="card card-pad max-w-2xl border-l-2 border-l-sand bg-surface-alt/50">
          <div className="eyebrow mb-1.5">Access</div>
          <h2 className="h-card mb-2">Aggregate data only</h2>
          <p className="text-[0.9rem] text-ink-soft">
            These endpoints expose pre-aggregated statistics. The posting-level Explore dataset is private
            and not part of the public API. No authentication is required for the endpoints listed above.
          </p>
        </div>
      </section>
    </div>
  );
}
