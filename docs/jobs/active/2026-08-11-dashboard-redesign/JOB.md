# Dashboard redesign implementation

Status: planned; waiting on baseline and responsive-design gates.

## Objective

Migrate the current nine-route Next.js/FastAPI dashboard to the approved ACLMR
redesign without disrupting the current public site or weakening data, auth,
category-cap, bilingual, accessibility, or deployment contracts.

## Source of truth

- [`PLAN.md`](PLAN.md) owns the implementation and release plan.
- [`../../../analyses/labor_market_dashboard/redesign-foundation/`](../../../analyses/labor_market_dashboard/redesign-foundation/)
  owns the approved desktop targets and design reference.
- [`../../../analyses/labor_market_dashboard_spec/report.md`](../../../analyses/labor_market_dashboard_spec/report.md)
  owns the product and metric contract.

## Current position

- The preserved Pulse and Explore desktop targets are verified redesign
  groundwork.
- The running app is healthy at `127.0.0.1:8522` and the API is healthy at
  `127.0.0.1:8530`, but the deployed bundle is not proven to match current
  `main`.
- The current site was inspected at desktop and 390 px widths. It is responsive
  enough to provide a behavioural baseline, but it is not the approved redesign
  and the redesign has no mobile target yet.
- `main` is two local commits ahead of `origin/main`; `AGENTS.md` has unrelated
  user-owned modifications that must remain outside this job.
- The intended Keychain password lookup exits 44, so production authenticated
  verification remains blocked pending credential-source restoration or
  confirmation.

## Next action

Execute Gate 0 in `PLAN.md`, then create and approve the responsive targets in
Gate 1. Do not edit production UI or restart the public services before those
gates pass.
