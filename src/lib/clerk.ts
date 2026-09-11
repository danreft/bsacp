/**
 * Shared auth-mode flag. Safe to import from both server and client components
 * because it only reads a `NEXT_PUBLIC_` variable, which Next inlines at build
 * time.
 *
 * The portal runs in one of two modes:
 *   - Clerk mode, when a publishable key is present.
 *   - Dev bypass, when it is not, so the mockup still runs with no keys.
 *
 * The dev-bypass identities live in `dev-user.ts`, which is server-only.
 */
export const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
