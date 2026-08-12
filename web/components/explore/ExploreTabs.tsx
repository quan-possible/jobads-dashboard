"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { ExploreBuilder } from "./ExploreBuilder";
import { ExploreView } from "./ExploreView";
import styles from "./explore.module.css";

// Two views of Explore under one page: the "Build a chart" tool and the
// "Find postings" raw lookup. Both sit below the shared FilterSpine, so the
// region / occupation / industry scope carries across either tab. The whole
// component renders inside an unlocked AuthGate (see app/explore/page.tsx), so
// both tabs are team-access.

type Tab = "build" | "find";
const TABS: Tab[] = ["build", "find"];

export function ExploreTabs({ minYear, maxYear }: { minYear: number; maxYear: number }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("find");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // APG tabs keyboard pattern: arrow keys move selection + focus, Home/End jump
  // to the ends (S14).
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className={styles.panel}>
      <div role="tablist" aria-label={t.explore.eyebrow} className={styles.tabs}>
        {TABS.map((k, i) => {
          const active = tab === k;
          return (
            <button
              key={k}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`explore-tab-${k}`}
              aria-controls={`explore-panel-${k}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(k)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`${styles.tab} ${active ? styles.tabActive : ""}`}
            >
              {t.explore.tabs[k]}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`explore-panel-${tab}`}
        aria-labelledby={`explore-tab-${tab}`}
        tabIndex={0}
        className="outline-none"
      >
        {tab === "build" ? <ExploreBuilder minYear={minYear} maxYear={maxYear} /> : <ExploreView />}
      </div>
    </div>
  );
}
