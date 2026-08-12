/** Tiny inline SVG trend line with a soft area fill and an end dot. Decorative. */
export interface SparklineProps {
  /** Series values; needs at least 2 points. Min-max normalised. */
  data: number[];
  width?: number;
  height?: number;
  /** Stroke colour — use var(--orange) for the lead metric, var(--teal) otherwise. */
  stroke?: string;
  /** Draw the 10% area fill. Default true. */
  fill?: boolean;
}
export declare function Sparkline(props: SparklineProps): JSX.Element;
