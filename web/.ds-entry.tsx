"use client";

// Design-sync bundle entry. NOT part of the Next app — nothing imports this at
// runtime. It exists because `web` is an application, not a published package:
// the design-sync converter needs one module that names the public surface of
// the ACLMR design system, and one provider that stands in for the app root so
// components relying on router / i18n / auth context render in isolation.
//
// See .design-sync/NOTES.md. Regenerate types with `npx tsc -p tsconfig.ds.json`.

import "./.ds-process-shim"; // must stay first — see the shim's header
import * as React from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { AuthProvider } from "./lib/auth/provider";
import { getDictionary } from "./lib/i18n";
import { I18nProvider } from "./lib/i18n/provider";
import type { Locale } from "./lib/i18n/locale";

// ── the design system's public surface ────────────────────────────────────
export { Brand } from "./components/Brand";
export { CoverageBar } from "./components/CoverageBar";
export { DeepDivider } from "./components/DeepDivider";
export { ErrorCard } from "./components/ErrorCard";
export { Figure } from "./components/Figure";
export { Footer } from "./components/Footer";
export { KeyPoints } from "./components/KeyPoints";
export { KpiTile } from "./components/KpiTile";
export { LocaleToggle } from "./components/LocaleToggle";
export { MapToggle } from "./components/MapToggle";
export { PixelTiles } from "./components/PixelTiles";
export { RouteMasthead } from "./components/RouteMasthead";
export { SectionLead } from "./components/SectionLead";
export { Select } from "./components/Select";
export { Sparkline } from "./components/Sparkline";
export { TopNav } from "./components/TopNav";

// Context providers — exported so designs can wrap their own trees the way the
// app root does. They carry no preview card of their own.
export { I18nProvider } from "./lib/i18n/provider";
export { AuthProvider } from "./lib/auth/provider";

// ── preview / design-time app-root stand-in ───────────────────────────────

// A router that satisfies next/link and next/navigation without navigating.
// Every method is a no-op: previews are static renders, and a real navigation
// would tear down the card.
const staticRouter = {
  back() {},
  forward() {},
  refresh() {},
  push() {},
  replace() {},
  prefetch() {},
} as unknown as React.ContextType<typeof AppRouterContext>;

/**
 * Wraps children in everything the app root provides: Next's app-router
 * context (so `next/link` and `usePathname` work outside a Next server),
 * the i18n dictionary, and the team-auth session.
 *
 * Nav-aware components (`TopNav`, `Footer`, `Brand`) need this. Pure
 * presentational ones (`KpiTile`, `Sparkline`, `KeyPoints`, …) render without it.
 */
export function DsPreviewProvider({
  children,
  locale = "en",
  pathname = "/",
}: {
  children: React.ReactNode;
  /** Which dictionary to render with. The dashboard ships EN and FR. */
  locale?: Locale;
  /** Drives the active-link state in `TopNav`. */
  pathname?: string;
}) {
  const searchParams = React.useMemo(() => new URLSearchParams(), []);
  return (
    <AppRouterContext.Provider value={staticRouter}>
      <PathnameContext.Provider value={pathname}>
        <SearchParamsContext.Provider value={searchParams}>
          <I18nProvider locale={locale} dict={getDictionary(locale)}>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}
