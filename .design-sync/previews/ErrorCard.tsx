import { ErrorCard } from "web";

// ErrorCard is what a route error boundary renders. Boundaries mount OUTSIDE
// the i18n provider tree, so the component carries its own bilingual copy table
// and reads the locale cookie after mount — these cards therefore show the EN
// fallback, which is the correct default when no cookie is set.
//
// Two axes, swept here in full. `title` names the scope that failed
// (view / explore / page) and `body` explains why (service = the FastAPI data
// service on :8530 is likely down, generic = anything else). The three shipped
// combinations are app/error.tsx (view + service), app/explore/error.tsx
// (explore + service) and app/developers/error.tsx (page + generic); the fourth
// card covers the unshipped-but-reachable view + generic pairing.
//
// `reset` is Next's boundary retry. It is a no-op here so the card stays put.

const noop = () => {};

export const ViewServiceDown = () => (
  <div style={{ maxWidth: 560 }}>
    <ErrorCard reset={noop} title="view" body="service" />
  </div>
);

export const ExploreServiceDown = () => (
  <div style={{ maxWidth: 560 }}>
    <ErrorCard reset={noop} title="explore" body="service" />
  </div>
);

export const PageGenericFailure = () => (
  <div style={{ maxWidth: 560 }}>
    <ErrorCard reset={noop} title="page" body="generic" />
  </div>
);

export const ViewGenericFailure = () => (
  <div style={{ maxWidth: 560 }}>
    <ErrorCard reset={noop} title="view" body="generic" />
  </div>
);
