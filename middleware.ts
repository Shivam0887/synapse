import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/clerk-webhook",
    "/api/drive-activity/notification",
    "/api/uploadthing",
  ],
  ignoredRoutes: [
    "/api/auth/callback/discord",
    "/api/auth/callback/notion",
    "/api/auth/callback/slack",
    "/api/flow",
    "/api/cron/wait",
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)"],
};
