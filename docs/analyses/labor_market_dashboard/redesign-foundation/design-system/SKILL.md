---
name: aclmr-dashboard-design
description: Use this package when designing or implementing ACLMR Labour Market Pulse dashboard surfaces from the preserved redesign foundation. It contains dashboard-specific tokens, official brand geometry, redesign-aligned components, desktop targets, and a source-state comparison kit; it is not a general ACLMR brand authority or the production runtime source of truth.
user-invocable: true
---

Before production work, read this directory's `README.md`, the parent
`BRAND_AUDIT.md`, and the repository's canonical dashboard specification. Treat
the high-fidelity Pulse and Explore files as desktop visual targets, the default
components here as redesign grammar, and the UI kit's explicit source tone as a
comparison with the prior product—not as the selected redesign.

Use the official ACLMR wordmark for identity and keep pixel tiles decorative.
Use PT Sans throughout, including operational numbers; use tabular numerals
rather than a second typeface. Anchor the redesign with the navy shell, use the
four-stop gradient sparingly, and keep orange meaningful. Dense analytical
controls stay square. Meaningful navigation, access, or promotional actions use
the live ACLMR gradient-ring or solid-orange pill families.

Do not copy the static prototypes or exported components mechanically into
production. Reconcile them with current behavior, accessibility, data,
authentication, and i18n. Public charts retain the shared category-cap
behavior; production remains EN/FR bilingual. The preserved targets settle
desktop only: create and inspect separate mobile targets before responsive
implementation.
