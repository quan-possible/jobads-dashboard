/** Field-completeness row; flips teal → orange below 40% coverage. */
export interface CoverageBarProps {
  label: string;
  /** Coverage as a 0–1 PROPORTION (not a percentage). */
  share: number;
  /** Number of postings behind the share. */
  count: number;
  /** Localised word for "postings". */
  postingsLabel?: string;
}
export declare function CoverageBar(props: CoverageBarProps): JSX.Element;
