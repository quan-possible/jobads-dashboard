---
codex_session_id: unavailable_in_env
codex_session_ids:
  - 019d37ea-a885-7b81-ab16-e320dfd79eea
---

# Render hosting setup

## Goal
- Make `jobads-dashboard` deployable on Render without relying on a local laptop or ngrok.

## Scope
- Keep the existing standalone repo structure.
- Prefer the lightest deployment change set.
- Do not touch unrelated in-progress UI edits in `src/jobads_dashboard/dashboard/app.py`.

## Plan
1. Make the Docker entrypoint honor Render's dynamic `PORT`.
2. Add a `render.yaml` blueprint for repeatable service setup.
3. Document the Render deployment flow in `README.md`.
4. Validate the blueprint and locally sanity-check the app entrypoint behavior.
5. If Render auth is available, create the service; otherwise report the exact remaining auth step.

## Notes
- Public repo confirmed: `https://github.com/quan-possible/jobads-dashboard`
- Render CLI was installed locally during this task.
- Render CLI currently reports unauthenticated and requires `render login`.
