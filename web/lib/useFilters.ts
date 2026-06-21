"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ALL_GEO, ALL_IND, ALL_OCC } from "./options";
import type { Filters } from "./types";

const DEFAULTS: Record<string, string> = {
  geo: ALL_GEO,
  occ: ALL_OCC,
  ind: ALL_IND,
};

export function useFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: Filters = useMemo(
    () => ({
      geo: sp.get("geo") ?? undefined,
      occ: sp.get("occ") ?? undefined,
      ind: sp.get("ind") ?? undefined,
      start: sp.get("start") ?? undefined,
      end: sp.get("end") ?? undefined,
      cmp: sp.get("cmp") ?? undefined,
    }),
    [sp],
  );

  const setFilter = useCallback(
    (key: keyof Filters, value: string | undefined) => {
      const next = new URLSearchParams(sp.toString());
      if (!value || value === DEFAULTS[key]) next.delete(key);
      else next.set(key, value);
      const q = next.toString();
      router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [sp, router, pathname],
  );

  const reset = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const activeCount = ["geo", "occ", "ind"].filter(
    (k) => filters[k as keyof Filters] && filters[k as keyof Filters] !== DEFAULTS[k],
  ).length;

  return { filters, setFilter, reset, activeCount };
}
