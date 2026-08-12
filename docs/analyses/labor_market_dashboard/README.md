# Labor Market Dashboard Analysis Home

## Purpose

This directory is the durable home for dashboard-specific design work,
operator notes, inspection artifacts, and screenshots.

## Expected Contents

- [`redesign-foundation/`](redesign-foundation/) — the 2026-08-11 redesign
  directions, high-fidelity targets, portable design system, source-state UI
  kit, and ACLMR brand audit
- screenshots or captured verification artifacts from the dashboard
- short notes about caveat wording and section coverage
- any future lightweight operator walkthroughs for refresh and launch

## Core Commands

```bash
jobads-dashboard refresh
jobads-dashboard validate
jobads-dashboard app
```

## Interpretation Guardrails

- Treat postings as a measure of posted labor demand, not employment or unemployment.
- Keep the 2025 provenance caveat visible.
- Keep denominator context visible for wages, remote work, language, and other sparse fields.

## Historical Verification Snapshot

- 2026-03-25 verification used `pytest`, a full `jobads-dashboard refresh`, `jobads-dashboard validate`, Streamlit `AppTest`, an independent upstream parquet spot check, and a live Streamlit health check. This predates the current Next.js/FastAPI application and is retained only as history.
- The validated derived package reconciled to `23,618,893` postings with source window `2016-01-01` through `2025-07-31`.
- The app rendered without Streamlit exceptions and exposed the seven expected tabs plus the eight overview metrics required by the current implementation contract.
