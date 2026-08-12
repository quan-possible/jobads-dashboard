# Final visual evidence

These captures come from the isolated worktree preview at `127.0.0.1:8521`
with its isolated FastAPI service at `127.0.0.1:8531`. They do not depict or
modify the canonical public service.

- `pulse-1440-final.png`: complete desktop Pulse surface.
- `pulse-390-final.png`: complete mobile Pulse surface.
- `geography-390-final.png`: dense mobile proving route with compact horizontal
  choropleth legends.
- `explore-locked-390-final.png`: public locked Explore state.
- `explore-auth-390-final.png`: authenticated results-first Explore state after
  the long-title containment fix.

The parent visually inspected all five files directly. Automated browser checks
separately covered all nine routes at 390, 768, 1280, and 1440 px in English and
all nine routes at 390 px in French, with no page-level overflow, console error,
failed request, missing heading, or non-200 response.
