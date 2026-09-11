import { KeyRound } from "lucide-react";


import { Card, LinkButton } from "./ui";

/**
 * Shown on /sign-in and /sign-up when no Clerk keys are configured. Makes it
 * unmistakable that the portal is running on a mock identity.
 */
export function DevBypassNotice({
  action,
  user,
}: {
  action: "sign in";
  user: { fullName: string; email: string };
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200 ring-inset">
          <KeyRound aria-hidden="true" className="h-4 w-4 text-amber-700" />
        </span>
        <div className="min-w-0">
          <h1 className="page-heading text-xl font-semibold text-ink">
            Dev bypass is active
          </h1>
          <p className="mt-2 text-sm text-muted">
            No Clerk keys are configured, so there is nothing to {action} to.
            The portal is running as{" "}
            <span className="font-medium text-ink">{user.fullName}</span> (
            {user.email}).
          </p>
          <p className="mt-3 text-sm text-muted">
            Add <code className="rounded bg-canvas px-1 py-0.5 text-xs">
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-canvas px-1 py-0.5 text-xs">
              CLERK_SECRET_KEY
            </code>{" "}
            to <code className="rounded bg-canvas px-1 py-0.5 text-xs">
              .env.local
            </code>{" "}
            to switch on real authentication.
          </p>
          <LinkButton href="/" className="mt-5">
            Continue to the portal
          </LinkButton>
        </div>
      </div>
    </Card>
  );
}
