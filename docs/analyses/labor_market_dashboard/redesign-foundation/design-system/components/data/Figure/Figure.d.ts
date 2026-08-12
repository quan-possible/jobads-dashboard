/** The chart wrapper: eyebrow, finding-first title, as-of stamp, body, source note.
 * @startingPoint section="Data display" subtitle="Chart card wrapper" viewport="700x330"
 */
export interface FigureProps {
  /** Small uppercase orange kicker naming the analytical lens. */
  eyebrow?: string;
  /** Finding-first title — state the reading, not the chart type. */
  title: React.ReactNode;
  /** Pre-formatted month stamp, e.g. "Jul 2026". */
  asOf?: string;
  /** Source / denominator note under a hairline rule. */
  note?: React.ReactNode;
  /** Controls rendered beside the as-of stamp. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
export declare function Figure(props: FigureProps): JSX.Element;
