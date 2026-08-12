import { Brand } from "web";

// The official vendored ACLMR wordmark, with an optional second line carrying
// the localised tagline ("Labour Market" / "Marché du travail"). It is always
// a link home, so it only ever appears in chrome. PixelTiles are deliberately
// not part of the identity mark.
//
// `compact` is the whole prop surface: false (the default, and what the real
// TopNav uses) keeps the tagline; true drops it to a single line for tight
// bars. Both cells are boxed at the width the wordmark actually gets in the
// 64px header row, so the two-line vs one-line difference is the visible axis.

export const DefaultOnNavy = () => (
  <div className="bg-surface-navy" style={{ maxWidth: 260, padding: "1rem" }}>
    <Brand />
  </div>
);

export const CompactOnNavy = () => (
  <div className="bg-surface-navy" style={{ maxWidth: 260, padding: "1rem" }}>
    <Brand compact />
  </div>
);

export const DarkInkOnCream = () => (
  <div className="bg-canvas" style={{ maxWidth: 260, padding: "1rem" }}>
    <Brand inverted={false} />
  </div>
);
