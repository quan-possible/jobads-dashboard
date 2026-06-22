"use client";

import { usePathname } from "next/navigation";
import { GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS } from "@/lib/options";
import { useFilters } from "@/lib/useFilters";
import { useI18n } from "@/lib/i18n/provider";
import { Select } from "./Select";

export function FilterSpine() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { filters, setFilter, reset, activeCount } = useFilters();

  // Only the Explore posting lookup is filter-driven. The curated national
  // visuals ignore scope, so the filter bar would be dead chrome there.
  if (!pathname.startsWith("/explore")) return null;

  return (
    <div className="sticky top-16 z-30 border-b border-card-border bg-surface-alt/80 backdrop-blur-md">
      <div className="container-x flex flex-wrap items-end gap-x-4 gap-y-3 py-3">
        <div className="mr-1 flex flex-col">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.05em] text-orange-deep">{t.filter.eyebrow}</span>
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.02em] text-ink-soft">
            {t.filter.scope}
          </span>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Select
            id="filter-geo"
            label={t.filter.region}
            value={filters.geo}
            options={GEO_OPTIONS}
            onChange={(v) => setFilter("geo", v)}
          />
          <Select
            id="filter-occ"
            label={t.filter.occupation}
            value={filters.occ}
            options={OCC_OPTIONS}
            onChange={(v) => setFilter("occ", v)}
          />
          <Select
            id="filter-ind"
            label={t.filter.industry}
            value={filters.ind}
            options={IND_OPTIONS}
            onChange={(v) => setFilter("ind", v)}
          />
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={activeCount === 0}
          className="control h-[38px] shrink-0 self-end border border-card-border px-3 text-[0.74rem] font-bold uppercase tracking-[0.02em] text-ink-soft transition-colors enabled:hover:border-orange enabled:hover:text-orange disabled:opacity-40"
        >
          {t.filter.reset}{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
      </div>
    </div>
  );
}
