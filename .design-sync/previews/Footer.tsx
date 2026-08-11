import { Footer } from "web";

// The site footer, mounted once in the root layout. Navy surface, three
// columns: wordmark + tagline, the section links (same NAV list as the header,
// with the gated Explore tab filtered out of the public build), and the
// "About the data" column — source line, the Vicinity 10-category disclosure,
// an optional as-of month, and the pointer to the method page.
//
// Two optional props, both strings, both shown here:
//   asOf   — already-formatted month, exactly what `fmtMonth` emits ("Jun 2026").
//            Omitted, the "Data through …" line disappears; the real layout
//            omits it when the meta call fails.
//   source — overrides the default "Built from Vicinity online job-ads
//            aggregates." line.
//
// The footer carries its own `mt-20`, so every cell shows ~5rem of clear space
// above the navy block. That is the shipped spacing, not a layout fault.
//
// This renders FULL PAGE WIDTH and will not fit a half-width grid cell; judge
// the render, not the fit. See .design-sync/learnings/BATCH_C.md for the
// cardMode override this needs.

export const Default = () => <Footer />;

export const WithDataThrough = () => <Footer asOf="Jun 2026" />;

export const CustomSourceLine = () => (
  <Footer
    asOf="Jun 2026"
    source="Built from Vicinity Jobs online job-ads aggregates, Atlantic Canada extract."
  />
);
