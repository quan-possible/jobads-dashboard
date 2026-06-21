// Primary navigation, shared by the client TopNav and the Footer.
// `key` indexes the nav dictionary (lib/i18n/dict/nav.ts) for the label.

export type NavKey =
  | "pulse"
  | "occupations"
  | "industries"
  | "geography"
  | "wages"
  | "skills"
  | "method"
  | "explore";

export interface NavItem {
  href: string;
  key: NavKey;
}

export const NAV: NavItem[] = [
  { href: "/", key: "pulse" },
  { href: "/occupations", key: "occupations" },
  { href: "/industries", key: "industries" },
  { href: "/geography", key: "geography" },
  { href: "/wages", key: "wages" },
  { href: "/skills", key: "skills" },
  { href: "/method", key: "method" },
  { href: "/explore", key: "explore" },
];
