/** Labelled square select; border goes orange when a non-default value is active. */
export interface SelectOption { value: string; label: string; }
export interface SelectProps {
  label: string;
  /** Current value; defaults to the first option. */
  value?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  id: string;
}
export declare function Select(props: SelectProps): JSX.Element;
