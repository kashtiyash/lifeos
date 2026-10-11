import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework to clients.
  poweredByHeader: false,
  // Tailwind v4 is wired through the Turbopack loader that create-next-app
  // selected, so there is no postcss.config.* file to keep in sync.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Security headers (including CSP, report-only by default) are applied
  // centrally here so every route — pages and handlers — inherits them.
  // Flip to enforcement with CSP_MODE=enforce (see docs/operations.md).
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders() }];
  },
  // User-specific data must never be cached in shared framework/CDN caches.
  // Any future private cache must key by authenticated account (see architecture.md).
  experimental: {},
};

export default nextConfig;
