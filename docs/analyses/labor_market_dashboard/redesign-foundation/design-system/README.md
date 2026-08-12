# ACLMR dashboard design system

Portable design reference for the Canadian Labour Market Pulse redesign. It is
derived from the production dashboard and the live ACLMR brand, but it is not
the runtime source of truth. Production tokens and components remain in
`web/app/globals.css` and `web/components/`.

## Essential visual language

- Use PT Sans throughout.
- Use the official ACLMR wordmark for identity. Pixel tiles are a sparse
  decorative motif, not a substitute logo.
- Anchor the interface with dark navy; keep the analytical workspace cream and
  white.
- Use the navy–teal–sand–orange gradient as a thin accent or transition, never
  as wallpaper or chart fill.
- Reserve orange for emphasis. Use semantic and categorical colours only when
  they encode data.
- Use bold uppercase headings with no tracking, readable body text, and tabular
  numerals for data.
- Keep figure cards softly rounded and lightly bordered. Avoid glass effects,
  heavy shadows, and generic SaaS card walls.
- Keep analytical controls square. Use the live gradient-ring or solid-orange
  pill families for meaningful navigation, access, or promotional actions.
- Design for English and French, including longer French labels.

## Package map

- `styles.css`, `tokens/`, `assets/` — portable foundations, fonts, and the
  official wordmark
- `components/` — redesign-aligned presentational components and usage prompts;
  `TopNav` defaults to the selected navy treatment
- `guidelines/` — visual specimens
- `ui_kits/dashboard/` — source-dashboard recreation for comparison, not the
  redesign target; its explicit `tone="source"` is comparison-only
- `SKILL.md` — short agent-facing entry point

For product meaning, data limits, authentication, accessibility, and runtime
behavior, follow the repository's canonical specification and implementation.
Do not mechanically copy this package into production.
