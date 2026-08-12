/** Navy page footer with gradient ribbon, brand, section links, and data provenance. */
export interface FooterProps {
  /** Data-through month, e.g. "July 2026". */
  asOf?: string;
  source?: string;
  tagline?: string;
  year?: number;
  /** Section link labels. */
  links?: string[];
}
export declare function Footer(props: FooterProps): JSX.Element;
