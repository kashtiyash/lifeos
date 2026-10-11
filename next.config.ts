import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
  // User-specific data must never be cached in shared framework/CDN caches.
  // Any future private cache must key by authenticated account (see architecture.md).
  experimental: {},
};

export default nextConfig;
