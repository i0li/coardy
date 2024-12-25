import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
/*
According to the following sites, we have to change the middleware if we need to protect all routes.
https://clerk.com/docs/references/nextjs/clerk-middleware
https://stackoverflow.com/questions/78357339/authmiddleware-doesnt-exist-after-installing-clerk
*/
const isProtectedRoute = createRouteMatcher(["/(.*)", "/"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
