import type { Metadata } from "next";
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
        <code className="font-mono text-[0.82rem] text-navy">{p.name}</code>
      </td>
      <td className="py-2 pr-4 align-top">
        <code className="font-mono text-[0.78rem] text-ink-faint">{p.type}</code>
      </td>
      <td className="py-2 align-top text-[0.88rem] text-ink-soft">{p.desc}</td>
    </tr>
  );
}

function EndpointCard({ ep, headers }: { ep: Endpoint; headers: { param: string; type: string; description: string } }) {
  return (
    <div className="card card-pad flex flex-col gap-4">
      {/* Method + path */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="shrink-0 rounded-none border border-teal px-2 py-0.5 font-mono text-[0.72rem] font-bold uppercase tracking-wider text-teal">
          {ep.method}
        </span>
        <code className="font-mono text-[1rem] font-bold text-navy-deep">{ep.path}</code>
      </div>

      {/* Purpose */}
      <p className="text-[0.95rem] text-ink-soft">{ep.purpose}</p>

      {/* Params table */}
      {ep.params.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">{headers.param}</th>
                <th className="pb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">{headers.type}</th>
                <th className="pb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">{headers.description}</th>
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

export default async function DevelopersPage() {
  const t = developersDict[await getLocale()];
  const headers = { param: t.thParam, type: t.thType, description: t.thDescription };

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">{t.eyebrow}</div>
          <h1 className="h-display max-w-3xl text-balance">{t.title}</h1>
          <p className="lede mt-4 max-w-2xl">
            {t.ledeIntro} <code className="font-mono text-[0.9em] text-navy">/api</code>.{" "}
            {t.ledeDocsBefore}{" "}
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-orange underline underline-offset-2 hover:text-orange-deep"
            >
              {t.docsLabel}
            </a>
            .
          </p>
        </div>
      </section>

      {/* Scope parameters */}
      <section className="container-x py-8">
        <div className="mb-5">
          <div className="eyebrow mb-1.5">{t.scopeEyebrow}</div>
          <h2 className="h-section">{t.scopeTitle}</h2>
          <p className="mt-2 max-w-2xl text-[0.95rem] text-ink-soft">{t.scopeDesc}</p>
        </div>

        <div className="card card-pad overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">{t.thParam}</th>
                <th className="pb-2 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">{t.thType}</th>
                <th className="pb-2 text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-faint">{t.thDescription}</th>
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
      <section className="container-x py-4">
        <div className="mb-5">
          <div className="eyebrow mb-1.5">{t.endpointsEyebrow}</div>
          <h2 className="h-section">{t.endpointsTitle}</h2>
        </div>

        <div className="flex flex-col gap-5">
          {t.endpoints.map((ep) => (
            <EndpointCard key={ep.path} ep={ep} headers={headers} />
          ))}
        </div>
      </section>

      {/* Privacy note */}
      <section className="container-x py-8">
        <div className="card card-pad max-w-2xl border-l-2 border-l-sand bg-surface-alt/50">
          <div className="eyebrow mb-1.5">{t.accessEyebrow}</div>
          <h2 className="h-card mb-2">{t.accessTitle}</h2>
          <p className="text-[0.9rem] text-ink-soft">{t.accessBody}</p>
        </div>
      </section>
    </div>
  );
}
