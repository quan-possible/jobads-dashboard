# Labor Market Dashboard Analysis Home

## Purpose

This directory is the durable home for the current dashboard design reference,
operator notes, and verification artifacts.

## Expected Contents

- [`redesign-foundation/`](redesign-foundation/) — the current high-fidelity
  targets, portable design system, source-state UI kit, and ACLMR brand audit
- current screenshots or captured verification artifacts from the dashboard
- short notes about caveat wording and section coverage
- any future lightweight operator walkthroughs for refresh and launch

## Core Commands

```bash
jobads-dashboard refresh
jobads-dashboard validate
uvicorn api.main:app --host 127.0.0.1 --port 8530 --no-proxy-headers
npm --prefix web run dev -- --hostname 127.0.0.1 --port 8522
```

## Interpretation Guardrails

- Treat postings as a measure of posted labor demand, not employment or unemployment.
- Keep the upstream provenance caveat visible.
- Keep denominator context visible for wages, remote work, language, and other sparse fields.

Historical UI captures were removed from the live documentation tree. Use Git
history for retired implementations and the redesign foundation plus completed
release evidence for the current product.
