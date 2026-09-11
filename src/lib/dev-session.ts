import "server-only";

import { cookies } from "next/headers";

import { clientOrgs } from "./mock-data";
import type { OrgMembership, PortalUser } from "./types";

/**
 * Dev-bypass identities, derived from the seeded organization members so they
 * can never drift from the data.
 *
 * Switching between them demonstrates the access model: organization scoping
 * (Marcus only sees the trust's work), multi-entity membership (Dan belongs to
 * both and gets an org switcher), and roles (only owners see download
 * activity).
 */
export interface DevIdentity {
  user: PortalUser;
  memberships: OrgMembership[];
}

function userIdFor(email: string) {
  return `user_dev_${email.split("@")[0].replace(/[^a-z0-9]/gi, "_")}`;
}

export const DEV_IDENTITIES: DevIdentity[] = (() => {
  const byEmail = new Map<string, DevIdentity>();

  for (const org of clientOrgs) {
    for (const member of org.members) {
      const email = member.email.toLowerCase();
      if (!byEmail.has(email)) {
        const [firstName, ...rest] = member.name.split(" ");
        byEmail.set(email, {
          user: {
            id: userIdFor(email),
            firstName,
            lastName: rest.join(" "),
            fullName: member.name,
            email,
            imageUrl: null,
            isDevBypass: true,
          },
          memberships: [],
        });
      }
      byEmail.get(email)!.memberships.push({
        orgId: org.id,
        orgName: org.name,
        role: member.role,
      });
    }
  }

  return [...byEmail.values()];
})();

export const DEFAULT_DEV_IDENTITY = DEV_IDENTITIES[0];

export const DEV_USER_COOKIE = "bsa_dev_user";
export const DEV_ORG_COOKIE = "bsa_dev_org";

/** The dev identity and active organization selected by cookie. */
export async function getDevSession(): Promise<{
  identity: DevIdentity;
  activeOrgId: string | null;
}> {
  const store = await cookies();
  const email = store.get(DEV_USER_COOKIE)?.value?.toLowerCase();
  const identity =
    DEV_IDENTITIES.find((candidate) => candidate.user.email === email) ??
    DEFAULT_DEV_IDENTITY;

  const requestedOrgId = store.get(DEV_ORG_COOKIE)?.value;
  // Fall back to the first membership: a cookie naming an org this identity
  // does not belong to must never select it.
  const activeOrgId =
    identity.memberships.find((m) => m.orgId === requestedOrgId)?.orgId ??
    identity.memberships[0]?.orgId ??
    null;

  return { identity, activeOrgId };
}
