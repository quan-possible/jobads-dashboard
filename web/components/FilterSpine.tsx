"use client";

import { usePathname } from "next/navigation";
import { GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS, optionsFor } from "@/lib/options";
import { useFilters } from "@/lib/useFilters";
import { useI18n } from "@/lib/i18n/provider";
import { Select } from "./Select";

export function FilterSpine() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const { filters, setFilter, reset, activeCount } = useFilters();

  // Only the Explore posting lookup is filter-driven. The curated national
  // visuals ignore scope, so the filter bar would be dead chrome there.
  if (!pathname.startsWith("/explore")) return null;

  return (
    /* U06: FilterSpine renders in the root layout (above <main>) so it
       structurally precedes the page hero. We compensate with a distinct
       "toolbar" treatment — full-bleed opaque chrome + orange accent bar —
       so the strip reads as persistent navigation chrome, not page content,
       and the hero below still opens the page visually. */
    <div
      role="toolbar"
      aria-label={t.filter.scope}
      className="sticky top-16 z-30 border-y border-card-border bg-surface-alt backdrop-blur-md"
      style={{ borderTopColor: "var(--orange)", borderTopWidth: "2px" }}
    >
      <div className="container-x flex flex-wrap items-end gap-x-4 gap-y-3 py-3">
        <div className="mr-1 flex flex-col">
          <span className="t-label font-bold uppercase tracking-[0.05em] text-orange-deep">{t.filter.eyebrow}</span>
          <span className="t-caption font-bold uppercase tracking-[0.02em] text-ink-soft">
            {t.filter.scope}
          </span>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Select
            id="filter-geo"
            label={t.filter.region}
            value={filters.geo}
            options={optionsFor(GEO_OPTIONS, locale)}
            onChange={(v) => setFilter("geo", v)}
          />
          <Select
            id="filter-occ"
            label={t.filter.occupation}
            value={filters.occ}
            options={optionsFor(OCC_OPTIONS, locale)}
            onChange={(v) => setFilter("occ", v)}
          />
          <Select
            id="filter-ind"
            label={t.filter.industry}
            value={filters.ind}
            options={optionsFor(IND_OPTIONS, locale)}
            onChange={(v) => setFilter("ind", v)}
          />
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={activeCount === 0}
          className="control h-[38px] shrink-0 self-end border border-card-border px-3 t-caption font-bold uppercase tracking-[0.02em] text-ink-soft transition-colors enabled:hover:border-orange enabled:hover:text-orange disabled:opacity-40"
        >
          {t.filter.reset}{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
      </div>
    </div>
  );
}
