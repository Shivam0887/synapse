import {
  clerkMiddleware,
  createRouteMatcher,
  ClerkMiddlewareAuth,
} from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/connections(.*)",
  "/dashboard(.*)",
  "/workflows(.*)",
  "/settings(.*)",
  "/billing(.*)",
  "/api/payment",
  "/api/drive-activity",
  "/api/drive",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)"],
};
