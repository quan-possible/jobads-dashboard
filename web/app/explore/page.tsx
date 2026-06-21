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
    <div className="container-x py-10">
      <header className="mb-7 max-w-2xl">
        <div className="eyebrow mb-2">{t.explore.eyebrow}</div>
        <h1 className="h-display mb-3">{t.explore.hero}</h1>
        <p className="lede">{t.explore.lede}</p>
      </header>
      <AuthGate />
    </div>
  );
}
