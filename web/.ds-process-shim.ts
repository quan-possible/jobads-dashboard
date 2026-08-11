// Design-sync only. Two identifiers that Next/webpack defines for browser builds
// and the design-system esbuild bundle does not. Both failures happen at module
// evaluation, before React renders, so the whole bundle is dead without them.
//
// Imported first in .ds-entry.tsx; esbuild emits modules in import order, so this
// executes ahead of everything it protects.

const g = globalThis as unknown as Record<string, unknown>;

// `web/lib/api.ts` reads process.env.NEXT_PUBLIC_API_BASE at module scope. Next
// inlines that at build time; here it throws "process is not defined" and takes
// every card down with it.
if (typeof g.process === "undefined") {
  g.process = { env: {} };
}

// plotly.js pulls in `has-hover`, which reads the bare identifier `global`.
// Without this, every chart silently degrades to RemoteFigure's "chart
// temporarily unavailable" notice — its .catch swallows the ReferenceError, so
// nothing reaches the console and the failure looks like missing data.
if (typeof g.global === "undefined") {
  g.global = globalThis;
}

export {};
