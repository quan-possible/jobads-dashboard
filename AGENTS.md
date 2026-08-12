# Repository Guidelines

## Start here

Before planning or editing the dashboard product, read
`docs/analyses/labor_market_dashboard_spec/report.md`. Use `README.md` for the
current architecture, setup, commands, and documentation map.

## Project boundaries

- Keep dashboard implementation and derived data in this repository. The
  canonical upstream data is
  `../jobads-data/main/data/processed/<year>/processed_*.parquet`; use the
  upstream metadata and config as its schema contract. Do not write dashboard
  outputs back to `jobads-data/main` or depend on `ai_labor`.
- Precompute runtime aggregates under `data/derived/`; do not repeatedly query
  the full processed corpus at app runtime.
- Treat job ads as descriptive evidence of posted demand, not direct measures
  of employment, unemployment, or economy-wide vacancies. Keep provenance and
  sparse-field caveats visible where they affect interpretation.

## Public category limit

Unauthenticated charts may show at most 10 distinct categorical items because
of the Vicinity Jobs API terms. Use the shared visualization cap helpers rather
than hard-coding limits per chart. Preserve totals with an honest residual such
as `Other` when showing a whole; an explicitly labelled top-10 chart may show
only its leaders. The limit applies to either categorical axis of a heatmap and
to distinct choropleth fill values. Time axes are exempt.

A verified team session receives uncapped detail site-wide. The server must
enforce `uncapped = full AND authed`; a request flag alone must never bypass the
public cap. Keep uncapped responses private and uncached.

## Public deployment and secrets

- After a dashboard UI change or page bug fix, rebuild and deploy the
  Next.js/FastAPI page through the existing public stack before sign-off. Reuse
  FastAPI on `127.0.0.1:8530`, Next.js on `127.0.0.1:8522`, and the active
  Cloudflare quick tunnel rather than creating a parallel deployment.
- Recover and verify the current tunnel hostname from
  `/Users/brucenguyen/jobads-dashboard-logs/cloudflared-launchd.err.log`; quick
  tunnel hostnames are not durable. If a restart rotates it, report the verified
  replacement.
- Public credentials belong in macOS Keychain, never the repository. Use
  `security find-generic-password -a jobads-dashboard-public -s jobads-dashboard-public-password -w`;
  if it is unavailable, stop the password-bearing handoff. Never commit a
  plaintext password or password hash.
