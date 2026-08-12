import React from "react";

// ACLMR's two live-site CTA families: gradient-ring institutional/promotional
// treatment and solid-orange direct action. `variant` describes appearance,
// not a universal hierarchy. Dense analytical controls remain square.
export function CtaButton({ children, href, variant = "gradient", onClick, className = "", ariaLabel }) {
  const classes = "cta " + (variant === "orange" ? "cta-primary" : "cta-gradient") + " " + className;
  if (href) {
    return <a href={href} onClick={onClick} className={classes} aria-label={ariaLabel}>{children}</a>;
  }
  return <button type="button" onClick={onClick} className={classes} aria-label={ariaLabel}>{children}</button>;
}
