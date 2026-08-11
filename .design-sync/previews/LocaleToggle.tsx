import { LocaleToggle } from "web";

// The EN/FR segmented switch. It takes no props at all: it reads the active
// locale from the i18n context and writes a locale cookie on click, so its only
// real variant axis is the surrounding locale — supplied by the preview
// provider, not by anything a preview file can pass. Two cells therefore cover
// it: the control on its own, and the control on the translucent canvas bar it
// actually lives on, right-aligned the way TopNav places it.
//
// FR (the "FR" segment filled navy instead of EN) is deliberately not shown —
// producing it would mean re-wrapping the cell in a second provider, which
// preview files here do not do.
//
// Both wrappers are shrink-to-fit. The control's root is a block-level flex
// box, so a plain block parent stretches its border across the whole cell,
// which is not a state the app can produce: TopNav always hands it a flex row.

export const Default = () => (
  <div style={{ display: "inline-flex", padding: "0.5rem 0" }}>
    <LocaleToggle />
  </div>
);

export const InHeaderBar = () => (
  <div className="border-b border-card-border bg-canvas/85 backdrop-blur-md">
    <div className="flex h-16 items-center justify-end gap-3 px-4">
      <LocaleToggle />
    </div>
  </div>
);
