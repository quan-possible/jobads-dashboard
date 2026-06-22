// Liveness probe for the web server. Deliberately independent of the FastAPI
// backend and the derived data so a platform health check (render.yaml ->
// healthCheckPath) turns green as soon as Next is up, even if the API is still
// warming. Route Handlers are not cached by default.
export async function GET() {
  return Response.json({ status: "ok", service: "web" });
}
