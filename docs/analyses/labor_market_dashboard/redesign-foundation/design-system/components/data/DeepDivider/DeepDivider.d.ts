/** Section break between headline ("core") and diagnostic ("deep") charts. */
export interface DeepDividerProps {
  /** Uppercase kicker. Default "Going deeper". */
  eyebrow?: string;
  /** One-line introduction to the deeper charts below. */
  lede: string;
}
export declare function DeepDivider(props: DeepDividerProps): JSX.Element;
