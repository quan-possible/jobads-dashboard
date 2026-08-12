/** Segmented measure switcher over pre-rendered figure variants (count / share / per-capita / LQ). */
export interface MapToggleOption { value: string; label: string; }
export interface MapToggleProps {
  options: MapToggleOption[];
  /** Map of option value → rendered figure node. */
  views: Record<string, React.ReactNode>;
  ariaLabel?: string;
  height?: number;
}
export declare function MapToggle(props: MapToggleProps): JSX.Element;
