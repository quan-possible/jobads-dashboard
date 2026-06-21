"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// A small segmented control bound to a single URL search param.

export function SegmentToggle({
  param,
  options,
  defaultValue,
  ariaLabel,
}: {
  param: string;
  options: { value: string; label: string }[];
  defaultValue: string;
  ariaLabel: string;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = sp.get(param) ?? defaultValue;

  const set = (value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value === defaultValue) next.delete(param);
    else next.set(param, value);
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex border border-card-border bg-surface">
      {options.map((o, i) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => set(o.value)}
            aria-pressed={active}
            className={[
              "px-3 py-1.5 text-[0.74rem] font-bold uppercase tracking-[0.02em] transition-colors",
              i > 0 ? "border-l border-card-border" : "",
              active ? "bg-navy-deep text-ink-invert" : "text-ink-soft hover:text-navy",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
