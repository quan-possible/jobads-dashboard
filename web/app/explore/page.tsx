import { AuthGate } from "@/components/explore/AuthGate";
import { getServerDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore",
  description: "Search the individual job postings behind the ACLMR aggregates (team access).",
};

export default async function ExplorePage() {
  const { t } = await getServerDict();
  return (
    <div>
      {/* Shared hero template (eyebrow · big headline · lede), matching every
          other data page (U05). */}
      <section className="border-b border-card-border bg-gradient-to-b from-surface-alt/60 to-canvas">
        <div className="container-x py-10 md:py-14">
          <div className="eyebrow mb-3">{t.explore.eyebrow}</div>
          <h1 className="h-display max-w-3xl text-balance">{t.explore.hero}</h1>
          <p className="lede mt-4 max-w-2xl">{t.explore.lede}</p>
        </div>
      </section>
      <div className="container-x py-8">
        <AuthGate />
      </div>
    </div>
  );
}
