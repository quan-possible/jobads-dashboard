# ACLMR dashboard design system

Portable design reference for the Canadian Labour Market Pulse redesign. It is
derived from the production dashboard and the live ACLMR brand, but it is not
the runtime source of truth. Production tokens and components remain in
`web/app/globals.css` and `web/components/`.

## Essential visual language

- Use PT Sans throughout.
- Anchor the interface with dark navy; keep the analytical workspace cream and
  white.
- Use the navy–teal–sand–orange gradient as a thin accent or transition, never
  as wallpaper or chart fill.
- Reserve orange for emphasis. Use semantic and categorical colours only when
  they encode data.
- Use bold uppercase headings with no tracking, readable body text, and tabular
  numerals for data.
- Use the pixel mosaic sparingly as the identifying decorative motif.
- Keep figure cards softly rounded and lightly bordered. Avoid glass effects,
  heavy shadows, and generic SaaS card walls.
- Keep analytical controls square; use rounded pills for primary navigation or
  access actions.
- Design for English and French, including longer French labels.

## Package map

- `styles.css`, `tokens/`, `assets/fonts/` — portable foundations
- `components/` — exported presentational components and usage prompts
- `guidelines/` — visual specimens
- `ui_kits/dashboard/` — source-dashboard recreation for comparison, not the
  redesign target
- `SKILL.md` — short agent-facing entry point

For product meaning, data limits, authentication, accessibility, and runtime
behavior, follow the repository's canonical specification and implementation.
