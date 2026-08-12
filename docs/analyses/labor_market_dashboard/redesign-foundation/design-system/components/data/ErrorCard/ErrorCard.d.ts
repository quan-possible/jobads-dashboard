/** Bilingual route-error card with a square Retry control. Renders its own page-level padding. */
export interface ErrorCardProps {
  reset: () => void;
  /** Which surface failed. Default "view". */
  title?: "view" | "explore" | "page";
  /** Which explanation to show. Default "service". */
  body?: "service" | "generic";
  locale?: "en" | "fr";
}
export declare function ErrorCard(props: ErrorCardProps): JSX.Element;
