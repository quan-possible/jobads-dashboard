import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { TopNav } from "@/components/TopNav";
import { FilterSpine } from "@/components/FilterSpine";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";
import { fmtMonth } from "@/lib/format";

const ptSans = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pt-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ACLMR Labour Market Dashboard",
    template: "%s · ACLMR Labour Market",
  },
  description:
    "Labour-market signals from Canadian online job postings — a descriptive view of posted demand across regions, occupations, industries, wages and skills.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let asOf: string | undefined;
  try {
    const meta = await api.meta();
    asOf = fmtMonth(meta.latest_month);
  } catch {
    asOf = undefined;
  }

  return (
    <html lang="en" className={`${ptSans.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-canvas">
        <TopNav />
        <Suspense fallback={<div className="h-[68px] border-b border-card-border bg-surface-alt/70" />}>
          <FilterSpine />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer asOf={asOf} />
      </body>
    </html>
  );
}
