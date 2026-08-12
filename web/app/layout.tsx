import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { TopNav } from "@/components/TopNav";
import { FilterSpine } from "@/components/FilterSpine";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";
import { fmtMonth } from "@/lib/format";
import { getServerDict } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";
import { AuthProvider } from "@/lib/auth/provider";

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pt-sans",
  display: "swap",
});

// Public origin for absolute OG/canonical URLs. Prefer an explicit site URL;
// on Render the platform injects RENDER_EXTERNAL_URL; fall back to localhost
// only for local dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Canadian Labour Market Pulse · ACLMR",
    template: "%s · ACLMR",
  },
  description:
    "An interactive view of Canada's online job postings — demand, wages, skills and geography — from the ACLMR aggregates.",
  applicationName: "ACLMR Labour Market",
  authors: [{ name: "ACLMR", url: "https://aclmr.ca" }],
  openGraph: {
    type: "website",
    title: "Canadian Labour Market Pulse · ACLMR",
    description:
      "An interactive view of Canada's online job postings — demand, wages, skills and geography — from the ACLMR aggregates.",
    siteName: "ACLMR Labour Market",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getServerDict();

  let asOf: string | undefined;
  try {
    const meta = await api.meta();
    asOf = fmtMonth(meta.latest_month, locale);
  } catch {
    asOf = undefined;
  }

  return (
    <html lang={locale} className={`${ptSans.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-canvas overflow-x-clip">
        <I18nProvider locale={locale} dict={t}>
          <AuthProvider>
            <a
              href="#main"
              className="sr-only z-[100] bg-navy px-4 py-2 text-sm font-bold text-canvas focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:outline focus:outline-2 focus:outline-orange"
            >
              {t.nav.skipToContent}
            </a>
            <TopNav />
            <Suspense fallback={<div className="h-[68px] border-b border-card-border bg-surface-alt/70" />}>
              <FilterSpine />
            </Suspense>
            <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
            <Footer asOf={asOf} />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
