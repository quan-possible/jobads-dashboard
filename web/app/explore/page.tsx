import { AuthGate } from "@/components/explore/AuthGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore",
  description: "Search the individual job postings behind the ACLMR aggregates (team access).",
};

export default function ExplorePage() {
  return (
    <div className="container-x py-10">
      <header className="mb-7 max-w-2xl">
        <div className="eyebrow mb-2">Explore</div>
        <h1 className="h-display mb-3">The postings behind the numbers</h1>
        <p className="lede">
          Every figure on this dashboard rolls up from individual job ads. Search and inspect those raw postings —
          title, employer, wage, requirements and the original text — filtered by the same region, occupation and
          industry controls used everywhere else.
        </p>
      </header>
      <AuthGate />
    </div>
  );
}
