import { TopNav } from "web";

// The site header, mounted once in the root layout. It takes no props: the
// active tab comes from `usePathname`, the labels from the i18n dictionary, and
// whether the gated Explore pill appears at all from the team-auth session.
// All three are supplied by the preview provider, so there is exactly one cell
// to render — a second export would be a byte-identical copy.
//
// What to look at: the orange gradient hairline above the bar, the Brand
// wordmark at left, the uppercase tab row with the orange underline sitting
// under the active tab (Pulse, since the provider's pathname is "/"), then the
// EN/FR toggle and the team log-in affordance. An unauthenticated session hides
// the Explore pill by design — that is the public nav, not a missing item.
//
// This renders FULL PAGE WIDTH and will not fit a half-width grid cell; judge
// the render, not the fit. See .design-sync/learnings/BATCH_C.md for the
// cardMode override this needs.

export const Default = () => <TopNav />;
