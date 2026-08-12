/** Descriptive findings panel beside the hero chart, with the required causation guard. */
export interface KeyPointsProps {
  /** Finding sentences. Descriptive only — never causal. */
  points: string[];
  title?: string;
  /** Causation guard footnote. Keep the default unless localising. */
  note?: string;
  /** Surface: "tinted" (surface-alt) or "navy" (dark panel, redesign treatment). Default "tinted". */
  tone?: "tinted" | "navy";
}
export declare function KeyPoints(props: KeyPointsProps): JSX.Element;
