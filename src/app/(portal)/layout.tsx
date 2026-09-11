import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";
import { clerkEnabled } from "@/lib/clerk";
import { DEV_IDENTITIES } from "@/lib/dev-session";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  // Only offered in dev-bypass mode; empty (and unused) under real auth.
  const devUsers = clerkEnabled
    ? []
    : DEV_IDENTITIES.map((identity) => identity.user);
  return (
    <AppShell session={session} devUsers={devUsers}>
      {children}
    </AppShell>
  );
}
