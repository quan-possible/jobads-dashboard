/** ACLMR pill CTA: gradient-ring institutional treatment or solid-orange direct action. */
export interface CtaButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: "gradient" | "orange";
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  className?: string;
  ariaLabel?: string;
}
export declare function CtaButton(props: CtaButtonProps): JSX.Element;
