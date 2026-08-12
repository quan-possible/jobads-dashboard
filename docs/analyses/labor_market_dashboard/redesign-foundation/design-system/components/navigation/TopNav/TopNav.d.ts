/** Sticky top navigation: gradient ribbon, brand, uppercase links with orange active underline, EN/FR toggle.
 * @startingPoint section="Navigation" subtitle="Dashboard header chrome" viewport="1280x140"
 */
export interface TopNavItem { label: string; href: string; teamOnly?: boolean; }
export interface TopNavProps {
  /** Nav items. Defaults to the dashboard's eight tabs (Explore is teamOnly). */
  items?: TopNavItem[];
  /** href of the active tab. Default "/". */
  activeHref?: string;
  /** Reveals team-only tabs (Explore pill). Default false. */
  authenticated?: boolean;
  locale?: "en" | "fr";
  onNavigate?: (href: string) => void;
}
export declare function TopNav(props: TopNavProps): JSX.Element;
