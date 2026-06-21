import { CoverageBar } from "@/components/CoverageBar";
import { Figure } from "@/components/Figure";
import { api } from "@/lib/api";
import { fmtCompact, fmtInt, fmtMonth } from "@/lib/format";

export const dynamic = "force-dynamic";

function ApiDown() {
  return (
    <div className="container-x py-24">
      <div className="card card-pad mx-auto max-w-xl text-center">
        <h1 className="h-section mb-2">Data service unavailable</h1>
        <p className="text-ink-soft">
          The API isn't responding. Start it with{" "}
          <code className="bg-surface-alt px-1">uvicorn api.main:app --port 8530</code>.
        </p>
      </div>
    </div>
  );
}

export default async function MethodPage() {
  let meta;
  try {
    meta = await api.meta();
  } catch {
    return <ApiDown />;
  }

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">Method &amp; data</div>
          <h1 className="h-display max-w-4xl text-balance">How to read this dashboard.</h1>
          <p className="lede mt-4 max-w-2xl">
            These figures come from online job postings and describe posted hiring demand — not
            employment, unemployment, vacancies, or hires.
          </p>
        </div>
      </section>

      {/* What it measures / what it doesn't */}
      <section className="container-x py-4">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="card card-pad">
            <h2 className="h-card mb-3">What this measures</h2>
            <ul className="flex flex-col gap-2 text-[0.95rem] leading-snug text-ink">
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-teal" />
                <span>Posted hiring demand from Canadian online job ads</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-teal" />
                <span>Demand by month, region, occupation (NOC), and industry (NAICS)</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-teal" />
                <span>Wage ranges posted in ads (25th / median / 75th percentile)</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-teal" />
                <span>Skills mentioned in postings and their relative frequency</span>
              </li>
            </ul>
          </div>

          <div className="card card-pad">
            <h2 className="h-card mb-3">What it does NOT measure</h2>
            <ul className="flex flex-col gap-2 text-[0.95rem] leading-snug text-ink">
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                <span>Not employment — how many people hold jobs</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                <span>Not the unemployment rate</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                <span>Not job vacancies as defined by Statistics Canada (JVWS)</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                <span>Not actual hires — a posting may never lead to a hire</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                <span>A single ad may not equal one open job</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Field coverage */}
      <section className="container-x py-4">
        <Figure
          eyebrow="How complete each field is"
          title="Field coverage"
          note="Share of all postings that report each field. Wage, remote-work and similar fields are sparse — read them with care."
        >
          <p className="mb-4 text-[0.95rem] text-ink-soft">
            Built from{" "}
            <span className="num font-bold text-navy">{fmtInt(meta.postings_total)}</span>{" "}
            postings spanning{" "}
            <span className="num font-bold text-navy">
              {fmtMonth(meta.source_window.min_date)} – {fmtMonth(meta.source_window.max_date)}
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
              />
            ))}
          </div>
        </Figure>
      </section>

      {/* Caveats */}
      <section className="container-x py-4">
        <Figure eyebrow="Caveats" title="Things to keep in mind">
          <ul className="flex flex-col gap-3.5">
            {meta.caveats.map((caveat, i) => (
              <li key={i} className="flex gap-3 text-[0.95rem] leading-snug text-ink">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
                <span>{caveat}</span>
              </li>
            ))}
          </ul>
        </Figure>
      </section>

      {/* Glossary */}
      <section className="container-x py-4">
        <Figure eyebrow="Glossary" title="Key terms defined">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="h-card mb-1">Demand index</dt>
              <dd className="text-[0.92rem] text-ink-soft">
                Monthly active postings indexed to January 2019 = 100. A value of 110 means 10%
                more postings than in the 2019 baseline.
              </dd>
            </div>
            <div>
              <dt className="h-card mb-1">Year over year</dt>
              <dd className="text-[0.92rem] text-ink-soft">
                Change versus the same month a year earlier, expressed as a percentage.
              </dd>
            </div>
            <div>
              <dt className="h-card mb-1">Wage range</dt>
              <dd className="text-[0.92rem] text-ink-soft">
                25th percentile / median / 75th percentile of posted hourly wages. Shown only when
                at least 100 postings list a wage.
              </dd>
            </div>
            <div>
              <dt className="h-card mb-1">Location quotient</dt>
              <dd className="text-[0.92rem] text-ink-soft">
                A region's share of postings divided by its share of the labour force. Values above
                1 mean the region is over-represented in that type of posting.
              </dd>
            </div>
            <div>
              <dt className="h-card mb-1">Distinctive skills / lift</dt>
              <dd className="text-[0.92rem] text-ink-soft">
                A scope's skill share divided by the national share. High lift means a skill appears
                disproportionately often in this filter.
              </dd>
            </div>
            <div>
              <dt className="h-card mb-1">Sample gate, n</dt>
              <dd className="text-[0.92rem] text-ink-soft">
                Statistics are withheld when fewer than 100 postings support them. Shown as "—"
                with a note indicating insufficient sample.
              </dd>
            </div>
          </dl>
        </Figure>
      </section>

      {/* Version */}
      <section className="container-x py-4">
        <Figure eyebrow="Version" title="Changelog">
          <p className="text-[0.95rem] text-ink-soft">
            <span className="num font-bold text-navy">v1</span> ·{" "}
            {fmtMonth(meta.latest_month)} — initial public release. Data current through{" "}
            {fmtMonth(meta.latest_month)}; generated {fmtMonth(meta.generated_at_utc.slice(0, 7))}.
          </p>
        </Figure>
      </section>
    </div>
  );
}
