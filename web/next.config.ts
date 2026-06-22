import type { NextConfig } from "next";

// Backend FastAPI origin. Browser-side calls to /api/* are proxied here so the
// auth session cookie is first-party (works over http in dev). Server-side
// fetches use NEXT_PUBLIC_API_BASE directly (see lib/api.ts).
const API_ORIGIN = process.env.JOBADS_API_ORIGIN ?? "http://127.0.0.1:8530";

const nextConfig: NextConfig = {
  // Emit a self-contained .next/standalone server (server.js + minimal
  // node_modules) so the production Docker image runs without a full install.
  // See Dockerfile: public/ and .next/static are copied in alongside it.
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
