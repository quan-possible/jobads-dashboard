import { PixelTiles } from "web";

// PixelTiles is a decorative ACLMR motif, not the identity mark. It is
// aria-hidden and takes no content, so the variant axis is geometry — rows,
// cols, size and gap. The component uses the four live ACLMR gradient stops.
//
// Every cell below is a real call site:
//   KeyPoints.tsx:19    rows={2} cols={4} size={7} gap={2}
//   AuthGate.tsx:52     size={11} (defaults: rows=3, cols=8)
// plus the bare default, which is what a new call site gets.

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
  <div aria-label="Decorative gradient tile specimen" style={{ maxWidth: 260 }}>
    <PixelTiles />
  </div>
);

export const LargeMosaic = () => (
  <div style={{ maxWidth: 260 }}>
    <PixelTiles rows={6} cols={14} size={14} gap={3} />
  </div>
);
