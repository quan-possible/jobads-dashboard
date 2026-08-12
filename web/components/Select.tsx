"use client";

import type { Option } from "@/lib/options";

export function Select({
  label,
  value,
  options,
  onChange,
  id,
  tone = "light",
}: {
  label: string;
  value: string | undefined;
  options: Option[];
  onChange: (value: string) => void;
  id: string;
  /** Optional dark analytical surface treatment; default stays source-compatible. */
  tone?: "light" | "dark";
}) {
  // Guard an empty option set: render a disabled placeholder rather than
  // crashing on options[0] (S28).
  if (options.length === 0) {
    return (
      <label htmlFor={id} className="flex min-w-0 flex-col gap-1">
        <span className={`t-label font-bold uppercase tracking-[0.05em] ${tone === "dark" ? "text-ink-invert/70" : "text-ink-faint"}`}>{label}</span>
        <select
          id={id}
          disabled
          className={`control w-full cursor-not-allowed appearance-none border py-2 pl-3 pr-9 t-body opacity-60 ${tone === "dark" ? "border-white/20 bg-navy-deep text-ink-invert/60" : "border-card-border bg-surface text-ink-faint"}`}
        >
          <option>—</option>
        </select>
      </label>
    );
  }
  const current = value ?? options[0].value;
  const isDefault = current === options[0].value;
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1">
      <span className={`t-label font-bold uppercase tracking-[0.05em] ${tone === "dark" ? "text-ink-invert/70" : "text-ink-faint"}`}>{label}</span>
      <div className="relative">
        <select
          id={id}
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className={[
            "control w-full cursor-pointer appearance-none border bg-surface py-2 pl-3 pr-9 t-body font-bold transition-colors",
            "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange",
            tone === "dark"
              ? "border-white/25 bg-navy-deep text-ink-invert hover:border-orange"
              : isDefault
                ? "border-card-border text-navy"
                : "border-orange/60 text-navy-deep",
          ].join(" ")}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 ${tone === "dark" ? "text-ink-invert/70" : "text-ink-soft"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="square" />
        </svg>
      </div>
    </label>
  );
}
