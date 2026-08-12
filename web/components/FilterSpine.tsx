"use client";

import { usePathname } from "next/navigation";
import { GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS, labelFor, optionsFor } from "@/lib/options";
import { useFilters } from "@/lib/useFilters";
import { useI18n } from "@/lib/i18n/provider";
import { useState } from "react";
import { Select } from "./Select";

export function FilterSpine() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const { filters, setFilter, reset, activeCount } = useFilters();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Only the Explore posting lookup is filter-driven. The curated national
  // visuals ignore scope, so the filter bar would be dead chrome there.
  if (!pathname.startsWith("/explore")) return null;

  const scopeSummary = [
    labelFor(GEO_OPTIONS, filters.geo, locale),
    labelFor(OCC_OPTIONS, filters.occ, locale),
    labelFor(IND_OPTIONS, filters.ind, locale),
  ].join(" · ");

  const controls = (idSuffix = "") => (
    <>
      <div className="mr-1 hidden flex-col md:flex">
        <span className="t-label font-bold uppercase tracking-[0.05em] text-orange-soft">{t.filter.eyebrow}</span>
        <span className="t-caption font-bold uppercase tracking-[0.02em] text-ink-invert/70">
          {t.filter.scope}
        </span>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <Select
          id={`filter-geo${idSuffix}`}
          label={t.filter.region}
          value={filters.geo}
          options={optionsFor(GEO_OPTIONS, locale)}
          onChange={(v) => setFilter("geo", v)}
          tone="dark"
        />
        <Select
          id={`filter-occ${idSuffix}`}
          label={t.filter.occupation}
          value={filters.occ}
          options={optionsFor(OCC_OPTIONS, locale)}
          onChange={(v) => setFilter("occ", v)}
          tone="dark"
        />
        <Select
          id={`filter-ind${idSuffix}`}
          label={t.filter.industry}
          value={filters.ind}
          options={optionsFor(IND_OPTIONS, locale)}
          onChange={(v) => setFilter("ind", v)}
          tone="dark"
        />
      </div>
      <button
        type="button"
        onClick={reset}
        disabled={activeCount === 0}
        className="control h-[38px] shrink-0 self-end border border-white/25 px-3 t-caption font-bold uppercase tracking-[0.02em] text-ink-invert transition-colors enabled:hover:border-orange enabled:hover:text-orange disabled:opacity-40"
      >
        {t.filter.reset}{activeCount > 0 ? ` · ${activeCount}` : ""}
      </button>
    </>
  );

  return (
    /* Explore owns this toolbar directly after its hero. It remains sticky
       while the results scroll, without displacing or preceding the page's
       primary heading. */
    <div
      role="toolbar"
      aria-label={t.filter.scope}
      className="sticky top-16 z-30 border-y border-white/15 bg-surface-navy text-ink-invert backdrop-blur-md"
      style={{ borderTopColor: "var(--orange)", borderTopWidth: "2px" }}
    >
      <div className="container-x flex items-center gap-3 py-3 md:hidden">
        <p className="min-w-0 flex-1 truncate t-body-sm font-bold text-ink-invert" title={scopeSummary}>
          {scopeSummary}
        </p>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="explore-mobile-filters"
          onClick={() => setMobileOpen((open) => !open)}
          className="control min-h-11 shrink-0 border border-teal-soft/70 px-3 t-caption font-bold uppercase tracking-[0.04em] text-ink-invert transition-colors hover:border-orange hover:text-orange-soft"
        >
          <span aria-hidden className="mr-2 text-teal-soft">☷</span>
          {t.filter.filters}{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
      </div>
      <div
        id="explore-mobile-filters"
        hidden={!mobileOpen}
        className="container-x border-t border-white/10 py-3 md:hidden"
      >
        <div className="flex flex-col gap-3">{controls("-mobile")}</div>
      </div>
      <div className="container-x hidden flex-wrap items-end gap-x-4 gap-y-3 py-3 md:flex">
        {controls()}
      </div>
    </div>
  );
}
