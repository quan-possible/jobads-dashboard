/** EN/FR language toggle — square segmented control. */
export interface LocaleToggleProps {
  /** Initial locale. Default "en". */
  locale?: "en" | "fr";
  onChange?: (locale: "en" | "fr") => void;
  ariaLabel?: string;
}
export declare function LocaleToggle(props: LocaleToggleProps): JSX.Element;
