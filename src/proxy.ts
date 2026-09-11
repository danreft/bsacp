/**
 * Next.js 16 renamed `middleware` to `proxy`; the convention is otherwise the
 * same. This file runs Clerk's middleware only when Clerk is configured — in
 * dev-bypass mode every request passes straight through so the mockup runs
 * without keys.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { clerkEnabled } from "./lib/clerk";

// Clients join by invitation only; there is no sign-up route.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/docs(.*)"]);

const withClerk = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const proxy = clerkEnabled
  ? withClerk
  : function passthrough() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    // Everything except Next internals and static assets, unless the request
    // carries search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|pdf|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
