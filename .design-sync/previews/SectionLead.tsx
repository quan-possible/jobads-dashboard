import { SectionLead } from "web";

export const Standard = () => (
  <div style={{ maxWidth: 720, padding: 24, background: "var(--canvas)" }}>
    <SectionLead number="01" label="Map and ranking" asOf="2026-03" locale="en" />
  </div>
);

export const WrappedFrenchLabel = () => (
  <div style={{ maxWidth: 390, padding: 24, background: "var(--canvas)" }}>
    <SectionLead number="03" label="Dynamique régionale et spécialisation" asOf="2026-03" locale="fr" />
  </div>
);
