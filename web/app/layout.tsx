import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { getLocale, getServerDict } from "@/lib/i18n/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const fr = (await getLocale()) === "fr";
  const title = fr ? "Tableau de bord du marché du travail · ACLMR" : "Canadian Labour Market Dashboard · ACLMR";
  const description = fr
    ? "Tendances des offres d’emploi au Canada par région, profession, industrie, salaire et compétence."
    : "Canadian job-posting trends by region, occupation, industry, wage and skill.";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: "%s · ACLMR" },
    description,
    applicationName: fr ? "Marché du travail de l’ACLMR" : "ACLMR Labour Market",
    authors: [{ name: "ACLMR", url: "https://aclmr.ca" }],
    openGraph: {
      type: "website",
      title,
      description,
      siteName: fr ? "Marché du travail de l’ACLMR" : "ACLMR Labour Market",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, t } = await getServerDict();

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
            <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
            <Footer />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
