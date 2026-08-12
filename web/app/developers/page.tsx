import type { Metadata } from "next";
import { RouteMasthead } from "@/components/RouteMasthead";
import { SectionLead } from "@/components/SectionLead";
import { getLocale } from "@/lib/i18n/server";
import { developersDict } from "@/lib/i18n/dict/page-developers";

type Param = { name: string; type: string; desc: string };
type Endpoint = { method: "GET"; path: string; purpose: string; params: readonly Param[] };

export async function generateMetadata(): Promise<Metadata> {
  const t = developersDict[await getLocale()];
  return { title: t.metaTitle, description: t.metaDescription };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ParamRow({ p }: { p: Param }) {
  return (
    <tr className="border-t border-hairline">
      <td className="py-2 pr-4 align-top">
        <code className="font-mono t-meta text-navy">{p.name}</code>
      </td>
      <td className="py-2 pr-4 align-top">
        <code className="font-mono t-meta text-ink-faint">{p.type}</code>
      </td>
      <td className="py-2 align-top t-body-sm text-ink-soft">{p.desc}</td>
    </tr>
  );
}

function EndpointCard({ ep, headers }: { ep: Endpoint; headers: { param: string; type: string; description: string } }) {
  return (
    <article className="border-t border-card-border py-6 first:border-t-2 first:border-navy">
      {/* Method + path */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="control shrink-0 border border-teal bg-surface px-2 py-1 font-mono t-caption font-bold uppercase tracking-wider text-teal">
          {ep.method}
        </span>
        <code className="font-mono text-[1rem] font-bold text-navy-deep">{ep.path}</code>
      </div>

      {/* Purpose */}
      <p className="mt-3 max-w-3xl t-body text-ink-soft">{ep.purpose}</p>

      {/* Params table */}
      {ep.params.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-1.5 t-caption font-bold uppercase tracking-[0.05em] text-ink-faint">{headers.param}</th>
                <th className="pb-1.5 t-caption font-bold uppercase tracking-[0.05em] text-ink-faint">{headers.type}</th>
                <th className="pb-1.5 t-caption font-bold uppercase tracking-[0.05em] text-ink-faint">{headers.description}</th>
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
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DevelopersPage() {
  const t = developersDict[await getLocale()];
  const headers = { param: t.thParam, type: t.thType, description: t.thDescription };

  return (
    <div className="pb-16">
      <RouteMasthead eyebrow={t.eyebrow} title={t.title} lede={
        <>
            {t.ledeIntro} <code className="font-mono text-[0.9em] !text-orange-soft">/api</code>.{" "}
            {t.ledeDocsBefore}{" "}
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold !text-orange-soft underline underline-offset-2 hover:!text-ink-invert"
            >
              {t.docsLabel}
            </a>
            .
        </>
      } />

      {/* Scope parameters */}
      <section className="container-x py-8 md:py-10">
        <SectionLead number="01" label={t.scopeEyebrow} />
        <div className="mb-5">
          <h2 className="h-section">{t.scopeTitle}</h2>
          <p className="mt-2 max-w-2xl t-body text-ink-soft">{t.scopeDesc}</p>
        </div>

        <div className="overflow-x-auto border border-card-border bg-surface p-4 md:p-6">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2 t-caption font-bold uppercase tracking-[0.05em] text-ink-faint">{t.thParam}</th>
                <th className="pb-2 t-caption font-bold uppercase tracking-[0.05em] text-ink-faint">{t.thType}</th>
                <th className="pb-2 t-caption font-bold uppercase tracking-[0.05em] text-ink-faint">{t.thDescription}</th>
              </tr>
            </thead>
            <tbody>
              {t.scopeParams.map((p) => (
                <ParamRow key={p.name} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Endpoints */}
      <section className="container-x py-4 md:py-6">
        <SectionLead number="02" label={t.endpointsEyebrow} />
        <div className="mb-5">
          <h2 className="h-section">{t.endpointsTitle}</h2>
        </div>

        <div className="bg-surface px-4 md:px-6">
          {t.endpoints.map((ep) => (
            <EndpointCard key={ep.path} ep={ep} headers={headers} />
          ))}
        </div>
      </section>

      {/* Privacy note */}
      <section className="container-x py-8 md:py-10">
        <SectionLead number="03" label={t.accessEyebrow} />
        <div className="max-w-2xl border-l-4 border-l-sand bg-surface-alt p-5 md:p-7">
          <h2 className="h-card mb-2">{t.accessTitle}</h2>
          <p className="t-body text-ink-soft">{t.accessBody}</p>
        </div>
      </section>
    </div>
  );
}
