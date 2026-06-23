"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { AuthGate } from "./AuthGate";
import { ExploreBuilder } from "./ExploreBuilder";

// Two tiers of Explore under one page: the public "Build a chart" tool and the
// team-gated "Find postings" raw lookup. Both sit below the shared FilterSpine,
// so the region / occupation / industry scope carries across either tab.

type Tab = "build" | "find";
const TABS: Tab[] = ["build", "find"];

export function ExploreTabs({ minYear, maxYear }: { minYear: number; maxYear: number }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("build");

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label={t.explore.eyebrow} className="flex gap-1 border-b border-card-border">
        {TABS.map((k) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(k)}
              className={[
                "-mb-px border-b-2 px-4 py-2.5 text-[0.82rem] font-bold uppercase tracking-[0.02em] transition-colors",
                active
                  ? "border-orange text-navy-deep"
                  : "border-transparent text-ink-faint hover:text-ink-soft",
              ].join(" ")}
            >
              {t.explore.tabs[k]}
            </button>
          );
        })}
      </div>

      {tab === "build" ? <ExploreBuilder minYear={minYear} maxYear={maxYear} /> : <AuthGate />}
    </div>
  );
}
