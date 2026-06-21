// Primary navigation, shared by the client TopNav and the server Footer.
// Kept in a plain module so server components can import the array directly.

export interface NavItem {
  href: string;
  label: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "Pulse" },
  { href: "/occupations", label: "Occupations" },
  { href: "/industries", label: "Industries" },
  { href: "/geography", label: "Geography" },
  { href: "/wages", label: "Wages" },
  { href: "/skills", label: "Skills" },
  { href: "/method", label: "Method" },
];
