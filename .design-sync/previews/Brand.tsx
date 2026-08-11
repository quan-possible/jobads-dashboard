import { Brand } from "web";

// The ACLMR wordmark: the 3x3 PixelTiles glyph plus "ACLMR", with an optional
// second line carrying the localised tagline ("Labour Market" / "Marché du
// travail"). It is always a link home, so it only ever appears in chrome.
//
// `compact` is the whole prop surface: false (the default, and what the real
// TopNav uses) keeps the tagline; true drops it to a single line for tight
// bars. Both cells are boxed at the width the wordmark actually gets in the
// 64px header row, so the two-line vs one-line difference is the visible axis.

export const Default = () => (
  <div style={{ maxWidth: 260, padding: "0.5rem 0" }}>
    <Brand />
  </div>
);

export const Compact = () => (
  <div style={{ maxWidth: 260, padding: "0.5rem 0" }}>
    <Brand compact />
  </div>
);
