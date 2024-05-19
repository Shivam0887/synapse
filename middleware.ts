import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/connections(.*)",
  "/dashboard(.*)",
  "/workflows(.*)",
  "/settings(.*)",
  "/billing(.*)",
  "/api/payment",
  "/api/drive/settings",
  "/api/discord",
  "/api/slack",
  "/api/ai/google",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
