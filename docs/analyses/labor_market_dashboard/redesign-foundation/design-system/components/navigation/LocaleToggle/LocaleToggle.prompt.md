The EN/FR language switch that sits in the top nav — a square two-segment
control with an explicit active fill.

    <LocaleToggle locale="en" onChange={(l) => setLocale(l)} />
    <LocaleToggle inverted locale="en" onChange={(l) => setLocale(l)} />

Use `inverted` inside the navy redesign shell. Every production string is
bilingual; place this in any chrome you design.
