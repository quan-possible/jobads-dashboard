// Shared chart styling so every Observable Plot chart reads as one family.

export const PLOT_FONT = "var(--font-pt-sans), ui-sans-serif, system-ui, sans-serif";

export const C = {
  orange: "#cf7730",
  orangeSoft: "#f0c79f",
  teal: "#345961",
  tealSoft: "#5b7e85",
  navy: "#041c2c",
  sand: "#c39e80",
  grid: "#e6e0da",
  axis: "#b9ab9d",
  ink: "#16242f",
  inkSoft: "#5d6b74",
  inkFaint: "#8a949b",
  pos: "#2f7d62",
  neg: "#c0563a",
  cats: ["#345961", "#cf7730", "#6f93a0", "#9a6a3c", "#3f7a5c", "#8a5f86", "#c2a23f", "#485b66"],
};

export const baseStyle: Partial<CSSStyleDeclaration> = {
  background: "transparent",
  color: C.ink,
  fontFamily: PLOT_FONT,
  fontSize: "12px",
  overflow: "visible",
};

/** Parse a 'YYYY-MM' string to a UTC Date at the first of the month. */
export function monthDate(iso: string): Date {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, 1));
}
