import { PixelTiles } from "./PixelTiles";

// Descriptive findings (causation-guarded by the API). Presented as a small
// "what to read" panel beside the hero chart.

export function KeyPoints({ points, title = "What stands out" }: { points: string[]; title?: string }) {
  if (!points || points.length === 0) return null;
  return (
    <div className="card card-pad flex h-full flex-col bg-surface-alt">
      <div className="mb-4 flex items-center gap-3">
        <PixelTiles rows={2} cols={4} size={7} gap={2} />
        <h2 className="h-card">{title}</h2>
      </div>
      <ul className="flex flex-col gap-3.5">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3 text-[0.95rem] leading-snug text-ink">
            <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 bg-orange" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-4 text-[0.72rem] leading-relaxed text-ink-faint">
        Descriptive signals only — postings show posted demand, not causes.
      </p>
    </div>
  );
}
