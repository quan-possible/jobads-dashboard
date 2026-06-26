"""Per-request switch for the 10-category public cap.

Every visual asset is capped at ten categories for the public view — a contract
imposed by the Vicinity Jobs API terms of service. An authenticated team viewer
sees full detail instead. Rather than thread an ``uncapped`` flag through ~25
figure-factory signatures, the API sets this :class:`contextvars.ContextVar` for
the duration of one :func:`api.figures.build` call; the cap helpers in
``figures/_common.py`` and the province-fold helpers in ``datasource.py`` read it.

``build`` is synchronous and per-request (not cached), so a set/reset token pair
keeps the switch request-local and leak-free.
"""

from __future__ import annotations

import contextvars

#: True ⇒ serve full, uncapped detail (authenticated team view). Default False
#: ⇒ the public capped contract.
UNCAPPED: contextvars.ContextVar[bool] = contextvars.ContextVar("UNCAPPED", default=False)


def is_uncapped() -> bool:
    return UNCAPPED.get()


def category_cap(n: int, full: int | None = None) -> int | None:
    """Return the cap for a ``top``/``head`` reduction site.

    Public view → ``n``. Authenticated team view → ``full``: pass ``None`` for
    "no limit — every category" (right for a bounded universe like provinces or
    sectors), or a larger integer for a long-tail top-k chart whose universe is
    thousands of sparse items (individual skills, every CMA) where a complete
    render is not a usable visual. ``full`` is always ≥ ``n`` by construction, so
    the team always sees at least as much as the public.
    """
    return full if UNCAPPED.get() else n
