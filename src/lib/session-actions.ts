"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clerkEnabled } from "./clerk";
import {
  DEV_IDENTITIES,
  DEV_ORG_COOKIE,
  DEV_USER_COOKIE,
} from "./dev-session";

/**
 * Switches the dev-bypass identity. Only meaningful when Clerk is not
 * configured; it is a no-op otherwise so it can never be used to impersonate
 * someone in a real deployment.
 */
export async function switchDevUser(formData: FormData) {
  if (clerkEnabled) return;

  const email = String(formData.get("email") ?? "").toLowerCase();
  const identity = DEV_IDENTITIES.find(
    (candidate) => candidate.user.email === email,
  );
  if (!identity) return;

  const store = await cookies();
  store.set(DEV_USER_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  // Reset the active org to one this identity actually belongs to.
  store.set(DEV_ORG_COOKIE, identity.memberships[0]?.orgId ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");
  redirect("/");
}

/** Switches the active organization in dev-bypass mode. */
export async function switchDevOrg(formData: FormData) {
  if (clerkEnabled) return;

  const orgId = String(formData.get("orgId") ?? "");
  const email = (await cookies()).get(DEV_USER_COOKIE)?.value?.toLowerCase();
  const identity =
    DEV_IDENTITIES.find((candidate) => candidate.user.email === email) ??
    DEV_IDENTITIES[0];

  // Membership check: you cannot select an organization you do not belong to.
  if (!identity.memberships.some((m) => m.orgId === orgId)) return;

  const store = await cookies();
  store.set(DEV_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");
  redirect("/");
}
