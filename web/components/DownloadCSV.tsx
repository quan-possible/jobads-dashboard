"use client";

import { useState } from "react";
import { toCSV, downloadCSV } from "@/lib/csv";

interface ColSpec {
  key: string;
  header: string;
}

interface Props {
  /** Relative URL to fetch, e.g. `/api/wages?dim=occupation&geo=BC` */
  endpoint: string;
  /** Download filename, e.g. `aclmr-wages-2026-03.csv` */
  filename: string;
  /** Optional column spec — controls order and display headers. */
  columns?: ColSpec[];
  /**
   * Optional transform applied to the parsed JSON before CSV conversion.
   * Default: if the JSON has an `items` array use it; if it's an array use it as-is.
   */
  pick?: (json: unknown) => Record<string, unknown>[];
  /** Button label. Default: `↓ CSV` */
  label?: string;
}

function defaultPick(json: unknown): Record<string, unknown>[] {
  if (Array.isArray(json)) return json as Record<string, unknown>[];
  if (
    json !== null &&
    typeof json === "object" &&
    "items" in json &&
    Array.isArray((json as Record<string, unknown>).items)
  ) {
    return (json as { items: Record<string, unknown>[] }).items;
  }
  return [];
}

type State = "idle" | "loading" | "error";

export function DownloadCSV({ endpoint, filename, columns, pick, label = "↓ CSV" }: Props) {
  const [state, setState] = useState<State>("idle");

  async function handleClick() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch(endpoint, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = pick ? pick(json) : defaultPick(json);
      const csv = toCSV(rows, columns);
      downloadCSV(filename, csv);
      setState("idle");
    } catch (err) {
      console.error("[DownloadCSV] fetch failed", err);
      setState("error");
      // Reset to idle after a short delay so the user can retry.
      setTimeout(() => setState("idle"), 1800);
    }
  }

  const buttonLabel =
    state === "loading" ? "…" : state === "error" ? "✕" : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      aria-label="Download data as CSV"
      className="control h-[38px] shrink-0 border border-card-border px-3 text-[0.74rem] font-bold uppercase tracking-[0.02em] text-ink-soft transition-colors enabled:hover:border-orange enabled:hover:text-orange disabled:opacity-40"
    >
      {buttonLabel}
    </button>
  );
}
