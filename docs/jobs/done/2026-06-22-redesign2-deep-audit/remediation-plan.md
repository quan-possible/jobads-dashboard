# redesign2 deep audit — remediation plan

Plan for working off the 58 confirmed items as coherent fix units, highest-value/highest-risk first. **Audit only — nothing here is applied.** Branch off `redesign2`; verify and commit per unit. After each unit: `tsc --noEmit` + `eslint` (web) or `pytest` (py), and re-render the touched screen/figure.

## Fix units (suggested order)

**1 — Production correctness & security defaults (do first; ship-blockers for a public deploy).**
`S11` secure cookies · `S22` real `metadataBase` · `S24` reachable `/docs` · `S25` dev API port · `S04` date-param 400 · `S03` graceful missing posting-lookup. Small, isolated, high-value. Group as **FIX-PROD-DEFAULTS**. Risk: low; mind local-HTTP dev when defaulting cookies to `Secure`.

**2 — Data honesty & correctness (user-visible wrong numbers).**
`S01` YoY date-keyed lookup · `S02` surface national fallback (model + TS + caveat) · `S08` decomposition centring · `S09` index zero-base. These change displayed figures, so each needs a unit test. Highest correctness value: `S01`/`S02` (silently wrong/substituted numbers in a tool whose whole pitch is honesty).

**3 — Fix the broken review tool.**
`S05` reconcile `review.py` to the current factory API (12 names) **and add an import/resolve smoke test** so it can't silently rot again. Self-contained; regenerate `tmp/review/index.html` to confirm. Medium risk (must map each entry to the *right* renamed chart).

**4 — Accessibility pass (FIX-A11Y).**
`S30` drawer focus trap/restore · `S31` table semantics · `S32` closed-nav focusability · `S33` MapToggle keyboard · `S34` skip link · `S35` single figcaption · `S36` landmark labels · `S37` stable drawer deps. One coherent PR; test with keyboard + a screen reader. `S30`/`S31` are the most impactful (the Explore data tool is the least accessible surface today).

**5 — Bilingual/i18n completion (FIX-I18N).**
`S16` months · `S17` FR `$` · `S18` Pulse hero · `S19` Developers page · `S20` drawer unit · `S21` figure `<extra>` chrome · `U09` Skills period (FR). One pass + a test asserting no English month/doubled-`$` artifacts under `locale="fr"`. High user-facing value (the product advertises EN/FR but FR is visibly broken).

**6 — Figure craft & remaining UI defects.**
`S06` P75 hover · `S07` provisional tails · `S10` heatmap labels · `S23` per-figure degradation · `S26` stale-offset fetch · `S27` re-login path · `S28`/`S29` Select/DownloadCSV guards · `L01` footer eyebrow. `S23` (per-figure degradation) is the highest-value here — today one bad figure blanks a whole page.

**7 — Design-craft polish (systemic, low-risk).**
`U01` tokenize small text · `U02` KPI mobile sparkline · `U03` KPI delta convention · `U04` chart font · `U05` Explore hero template · `U06` resolve DownloadCSV (wire or delete) · `U07` dark-mode decision · `U08` brand tagline. `U01` is the one systemic change that touches many files; do it as its own diff with screenshot review. `U02`/`U03`/`U04` are quick, visible wins.

**8 — Security hardening (lower urgency).**
`S12` auth rate-limit · `S13` PBKDF2 floor · `S14` plaintext-password guard · `S15` session-secret length. Defense-in-depth around the single shared password; batch together.

## Per-batch rules
- One fix unit per commit/PR; keep the diff to that unit (leave unrelated working-tree changes alone).
- Re-run the matching gate (`pytest` for `api/`+`viz/`, `tsc`+`eslint` for `web/`) and re-render the touched page/figure before sign-off.
- For units 2 and 3, add the regression tests named above — they're the cheapest guard against silent recurrence.
- The eslint `set-state-in-effect`/`immutability` errors are mostly lint-noise (see `rejected.md`); fix `S26`'s effect coupling regardless, then decide whether to silence the rule or refactor the remaining effects.

## Highest-value items across both fronts
1. `S05` (HIGH) review tool broken — regenerate-the-spec capability is gone.
2. `S01` + `S02` (MED) silently wrong / silently-national numbers — worst fit for an honesty-first dashboard.
3. `S11` + `S22` + `S24` (MED) production defaults — cookie not `Secure`, broken OG, dead docs link on the public site.
4. `S23` (MED) one figure failure blanks a whole page.
5. FIX-I18N cluster — the advertised bilingual mode is visibly broken in FR.
6. `S30`/`S31` (MED) the Explore tool's accessibility.
