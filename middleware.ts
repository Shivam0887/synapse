import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/connections(.*)",
  "/dashboard(.*)",
  "/workflows(.*)",
  "/settings(.*)",
  "/billing(.*)",
  "/api/payment",
  "/api/drive",
  "/api/drive/settings",
  "/api/drive/watch",
  "/api/discord",
  "/api/slack",
  "/api/ai/google",
  // "/api/automate",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
