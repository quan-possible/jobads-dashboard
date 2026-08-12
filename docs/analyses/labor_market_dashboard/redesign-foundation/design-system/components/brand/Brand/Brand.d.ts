/** ACLMR wordmark lockup (pixel tiles + name + tagline). */
export interface BrandProps {
  /** Hide the tagline line. Default false. */
  compact?: boolean;
  /** Tagline under the wordmark. Default "Labour Market Pulse". */
  tagline?: string;
  href?: string;
  /** Cream-on-navy variant for dark surfaces. Default false. */
  inverted?: boolean;
}
export declare function Brand(props: BrandProps): JSX.Element;
