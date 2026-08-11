import { PixelTiles } from "web";

// PixelTiles is the ACLMR house mark. It is aria-hidden and takes no content,
// so the variant axis is purely geometry — rows, cols, size, gap.
//
// WHAT IT ACTUALLY RENDERS TODAY: a solid navy (#041c2c) block. The source
// intends a navy → teal → sand → orange gradient biased left-to-right, but
// PixelTiles.tsx:12 clamps with `Math.min(0.999, ...)` before `Math.floor(t)`,
// so the stop index is always 0 and only the first stop is ever used. The
// clamp was almost certainly meant to be `STOPS.length - 0.001`. Every cell
// below therefore shows navy squares — that is faithful to what ships, not a
// preview defect. Do not "fix" these previews to fake the gradient; fix the
// component and these cells will start showing colour on their own.
//
// Every cell below is a real call site:
//   Brand.tsx:11        rows={3} cols={3} size={7} gap={2}
//   Footer.tsx:21       rows={3} cols={3} size={8} gap={2}
//   KeyPoints.tsx:19    rows={2} cols={4} size={7} gap={2}
//   AuthGate.tsx:52     size={11} (defaults: rows=3, cols=8)
// plus the bare default, which is what a new call site gets.
//
// The Brand and Footer cells differ only in tile size (7px vs 8px), which is
// the point: the mark has to hold at both without the grid going muddy.
//
// Deliberately skipped: the `group-hover:scale-105` transform Brand.tsx applies,
// since hover states do not capture statically.

export const BrandMark = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="flex items-center gap-3">
      <PixelTiles rows={3} cols={3} size={7} gap={2} />
      <span className="flex flex-col leading-none">
        <span className="text-[1.05rem] font-bold uppercase tracking-[0.01em] text-navy-deep">
          ACLMR
        </span>
        <span className="t-caption font-bold uppercase tracking-[0.08em] text-ink-soft">
          Labour Market
        </span>
      </span>
    </div>
  </div>
);

export const FooterMark = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="flex items-center gap-3">
      <PixelTiles rows={3} cols={3} size={8} gap={2} />
      <span className="t-caption text-ink-soft">
        Job postings collected from Vicinity Jobs, 2018–2025.
      </span>
    </div>
  </div>
);

export const KeyPointsRule = () => (
  <div style={{ maxWidth: 260 }}>
    <div className="mb-2 flex items-center gap-2">
      <PixelTiles rows={2} cols={4} size={7} gap={2} />
      <span className="eyebrow">What to take away</span>
    </div>
    <p className="t-body-sm text-ink-soft">
      Nova Scotia postings are 12% below their 2022 peak, with health and trades
      the only groups still growing.
    </p>
  </div>
);

export const AuthGateBadge = () => (
  <div style={{ maxWidth: 340 }}>
    <div className="card card-pad">
      <div className="flex items-center gap-3">
        <PixelTiles size={11} className="shrink-0" />
        <div>
          <div className="eyebrow">Protected</div>
          <h2 className="text-[1.1rem] font-bold leading-snug text-navy-deep">
            Build a chart
          </h2>
        </div>
      </div>
    </div>
  </div>
);

export const DefaultMosaic = () => (
  <div style={{ maxWidth: 260 }}>
    <PixelTiles />
  </div>
);

export const LargeMosaic = () => (
  <div style={{ maxWidth: 260 }}>
    <PixelTiles rows={6} cols={14} size={14} gap={3} />
  </div>
);
