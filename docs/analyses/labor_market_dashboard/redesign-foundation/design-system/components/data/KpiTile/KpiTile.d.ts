/** One headline metric: label, big tabular value, optional delta chip and sparkline.
 * @startingPoint section="Data display" subtitle="Headline metric tile" viewport="700x200"
 */
export interface KpiTileProps {
  label: string;
  /** Pre-formatted display value, e.g. "412K", "$28.50", "—". */
  value: string;
  /** Unit suffix, e.g. "/hr". */
  unit?: string;
  /** Denominator/context shown top-right, e.g. "2019 = 100", "n = 212K". */
  context?: string;
  /** Delta in PERCENTAGE POINTS (18 → "18%"). */
  delta?: number | null;
  deltaLabel?: string;
  /** When set, the headline value gets visible ▲/▼ + colour and an accessible direction word. */
  valueTrend?: number | null;
  spark?: number[];
  sparkColor?: string;
  /** Lead-metric treatment: orange top bar + card shadow. Default false. */
  accent?: boolean;
}
export declare function KpiTile(props: KpiTileProps): JSX.Element;
