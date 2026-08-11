import { DeepDivider } from "web";

// The "Core → Deep" section break that sits between the headline charts and the
// deeper ones on every researcher page (app/page.tsx:165, occupations:117,
// wages:89, geography:135, skills:103, industries:96). All six call sites pass
// the same two props from their page dictionary: `eyebrow` and `lede`.
//
// The eyebrow is invariant across the English pages — it is always "Going
// deeper" — so the real variant axis is lede length and locale. The cells below
// are the verbatim EN strings from web/lib/i18n/dict/page-*.ts, shortest to
// longest, plus the French pair to show the divider under a longer translation.
//
// The component renders `container-x` (max-width: var(--container), gutter
// padding) around a top hairline. In a narrow card cell that collapses to the
// cell width, which is the correct responsive behaviour but makes the rule look
// short; the cells are sized wide so the hairline and the lede wrap read the way
// they do on a real page.

export const PulseDivider = () => (
  <div style={{ maxWidth: 560 }}>
    <DeepDivider
      eyebrow="Going deeper"
      lede="Decomposition and diagnostics for readers who want the mechanics behind the headline."
    />
  </div>
);

export const OccupationsDivider = () => (
  <div style={{ maxWidth: 560 }}>
    <DeepDivider
      eyebrow="Going deeper"
      lede="Composition, contribution and concentration for readers who want the structure behind the headline."
    />
  </div>
);

export const GeographyDivider = () => (
  <div style={{ maxWidth: 560 }}>
    <DeepDivider
      eyebrow="Going deeper"
      lede="Specialisation, structure and momentum for readers who want the regional detail beneath the headline map."
    />
  </div>
);

export const WagesDividerLongLede = () => (
  <div style={{ maxWidth: 560 }}>
    <DeepDivider
      eyebrow="Going deeper"
      lede="Provincial spread, the pay-versus-hiring quadrant, and posting conditions for readers who want the texture behind the headline pay."
    />
  </div>
);

export const FrenchDivider = () => (
  <div style={{ maxWidth: 560 }}>
    <DeepDivider
      eyebrow="Pour aller plus loin"
      lede="Spécialisation, structure et dynamique pour qui veut le détail régional sous la carte principale."
    />
  </div>
);
