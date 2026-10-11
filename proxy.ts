import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed middleware to Proxy. Route protection here is a UX layer
// only. The real security boundary is the server-side auth() check in the
// protected layout (`app/(app)/layout.tsx`) and in every protected server
// operation, so no path-matching route matcher is used.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless referenced in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes.
    "/__clerk/(.*)",
  ],
};
