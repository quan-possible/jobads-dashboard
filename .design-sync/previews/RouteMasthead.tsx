import { RouteMasthead } from "web";

export const ResearchRoute = () => (
  <RouteMasthead
    eyebrow="Geography"
    title="Where in Canada are postings concentrated?"
    lede="Active postings by province, as a share of the labour force, a location quotient, or a raw count."
    asOf="2026-03"
    locale="en"
  />
);

export const FrenchLongCopy = () => (
  <RouteMasthead
    eyebrow="Géographie"
    title="Où les offres d’emploi sont-elles concentrées au Canada?"
    lede="Offres actives par province, en proportion de la population active, selon un quotient de localisation ou en nombre brut."
    asOf="2026-03"
    locale="fr"
  />
);
