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
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)"],
};
