import "server-only";

import { redirect } from "next/navigation";

import { clerkEnabled } from "./clerk";
import { getDevSession } from "./dev-session";
import { clientOrgs } from "./mock-data";
import type { OrgRole, PortalSession } from "./types";

/**
 * Clerk's built-in organization roles map onto the portal's two roles.
 * Anything unrecognized is treated as the lesser role.
 */
function toOrgRole(clerkRole: string | undefined | null): OrgRole {
  return clerkRole === "org:admin" ? "owner" : "member";
}

/**
 * Resolves the signed-in person *and the organization they are acting in* to a
 * single shape, regardless of auth mode, so pages never branch on whether
 * Clerk is configured.
 *
 * Every data accessor scopes to `activeOrgId`. A session with no active
 * organization sees nothing, which is the correct state for someone who has
 * been invited but not yet placed in an org.
 *
 * Returns `null` when Clerk is enabled but nobody is signed in — callers
 * redirect to `/sign-in`. In dev-bypass mode there is always a session.
 */
export async function getSession(): Promise<PortalSession | null> {
  if (!clerkEnabled) {
    const { identity, activeOrgId } = await getDevSession();
    return {
      user: identity.user,
      memberships: identity.memberships,
      activeOrgId,
      activeRole:
        identity.memberships.find((m) => m.orgId === activeOrgId)?.role ?? null,
    };
  }

  // Imported lazily so the Clerk server bundle is only pulled in when it is
  // actually configured.
  const { auth, currentUser } = await import("@clerk/nextjs/server");
  const [{ orgId, orgRole }, user] = await Promise.all([auth(), currentUser()]);
  if (!user) return null;

  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";

  // Clerk owns organization membership; the seed provides display names for
  // the orgs this mockup knows about.
  const memberships = orgId
    ? [
        {
          orgId,
          orgName:
            clientOrgs.find((org) => org.id === orgId)?.name ?? "Organization",
          role: toOrgRole(orgRole),
        },
      ]
    : [];

  return {
    user: {
      id: user.id,
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(" ") || "Client user",
      email: (user.primaryEmailAddress?.emailAddress ?? "").toLowerCase(),
      imageUrl: user.imageUrl ?? null,
      isDevBypass: false,
    },
    memberships,
    activeOrgId: orgId ?? null,
    activeRole: orgId ? toOrgRole(orgRole) : null,
  };
}

/**
 * `getSession()` for pages that cannot render without one. Redirects to the
 * sign-in page instead of returning null.
 */
export async function requireSession(): Promise<PortalSession> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}
