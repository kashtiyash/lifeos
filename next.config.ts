import type { NextConfig } from "next";

import {
  assertE2ETestAuthConfig,
  isE2ETestAuthEnabled,
} from "./lib/auth/e2e/config";
import { securityHeaders } from "./lib/security/headers";

// Fail loudly if the secret-free test-auth adapter is requested for a
// production build/start. It must never be able to trust a test cookie in
// production (lib/auth/e2e/config.ts).
assertE2ETestAuthConfig();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The secret-free E2E server gets its own build directory so `npm run
  // test:e2e` can run beside a developer's `next dev`. Next 16 keeps one
  // dev-server lock per distDir
  // (node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.js), so
  // sharing `.next` would make the two servers refuse to coexist. The predicate
  // is false for production, so builds and `next start` still use `.next`.
  distDir: isE2ETestAuthEnabled() ? ".next-e2e" : ".next",
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
