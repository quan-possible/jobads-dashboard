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

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pt-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
    asOf = fmtMonth(meta.latest_month);
  } catch {
    asOf = undefined;
  }

  return (
    <html lang={locale} className={`${ptSans.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-canvas">
        <I18nProvider locale={locale} dict={t}>
          <TopNav />
          <Suspense fallback={<div className="h-[68px] border-b border-card-border bg-surface-alt/70" />}>
            <FilterSpine />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer asOf={asOf} />
        </I18nProvider>
      </body>
    </html>
  );
}
