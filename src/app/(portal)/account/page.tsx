import { Building2, Mail } from "lucide-react";
import type { Metadata } from "next";

import { Badge, Card, CardHeader, DetailItem, PageHeading } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { clerkEnabled } from "@/lib/clerk";
import { getEngagements, getOrgById } from "@/lib/data";
import type { ClientOrg, PortalSession } from "@/lib/types";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await requireSession();
  const [org, engagements] = await Promise.all([
    getOrgById(session.activeOrgId),
    getEngagements(session.activeOrgId),
  ]);

  return (
    <>
      <PageHeading
        title="Account"
        description="Your sign-in details and the organization you are currently working in."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="order-2 min-w-0 space-y-6 lg:order-1">
          {clerkEnabled ? <ClerkProfile /> : <DevBypassProfile session={session} />}
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          {org ? (
            <OrgCard
              org={org}
              session={session}
              engagementCount={engagements.length}
            />
          ) : (
            <Card className="p-5">
              <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">
                Organization
              </h2>
              <p className="mt-2 text-sm text-muted">
                Your account is not part of an organization yet. Your engagement
                lead will send an invitation to{" "}
                <span className="font-medium text-ink">
                  {session.user.email}
                </span>
                .
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function OrgCard({
  org,
  session,
  engagementCount,
}: {
  org: ClientOrg;
  session: PortalSession;
  engagementCount: number;
}) {
  const isOwner = session.activeRole === "owner";

  return (
    <Card className="h-fit overflow-hidden">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Building2 aria-hidden="true" className="h-4 w-4 text-muted" />
            Organization
          </span>
        }
        description="Read only — contact your engagement lead to change these."
      />
      <dl className="space-y-4 px-5 py-4">
        <DetailItem label="Legal entity">{org.name}</DetailItem>
        <DetailItem label="Authorized representative">
          {org.authorizedRepresentative}
        </DetailItem>
        <DetailItem label="Your role">
          <span className="capitalize">{session.activeRole ?? "—"}</span>
          <span className="mt-1 block text-xs text-muted">
            {isOwner
              ? "Owners see everything and manage members."
              : "Members see everything but cannot manage members."}
          </span>
        </DetailItem>
        <DetailItem label="Engagements">
          {engagementCount}{" "}
          {engagementCount === 1 ? "engagement" : "engagements"}
        </DetailItem>
      </dl>

      <div className="border-t border-hairline px-5 py-4">
        <h3 className="text-xs font-medium tracking-wide text-muted uppercase">
          Members
        </h3>
        <ul className="mt-3 space-y-3">
          {org.members.map((member) => {
            const isYou = member.email.toLowerCase() === session.user.email;
            return (
              <li key={member.email} className="flex items-start gap-2.5">
                <Mail
                  aria-hidden="true"
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted"
                />
                <div className="min-w-0">
                  <p className="text-sm text-ink">
                    {member.name}
                    {isYou ? (
                      <Badge className="ml-2 bg-brand-50 text-brand-800 ring-brand-200">
                        You
                      </Badge>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {member.title} &middot;{" "}
                    <span className="capitalize">{member.role}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted">
          {isOwner
            ? "Members join by invitation. Invitations are issued by Boa Safra Ag."
            : "Only organization owners can manage members."}
        </p>
      </div>
    </Card>
  );
}

async function ClerkProfile() {
  const { UserProfile } = await import("@clerk/nextjs");
  return (
    <UserProfile
      routing="hash"
      appearance={{ elements: { rootBox: "w-full", cardBox: "w-full" } }}
    />
  );
}

function DevBypassProfile({ session }: { session: PortalSession }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Profile"
      />
      <div className="space-y-5 px-5 py-5">
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailItem label="Name">{session.user.fullName}</DetailItem>
          <DetailItem label="Email">{session.user.email}</DetailItem>
          <DetailItem label="Organizations">
            {session.memberships.length === 0
              ? "None"
              : session.memberships
                  .map((m) => `${m.orgName} (${m.role})`)
                  .join(", ")}
          </DetailItem>
          <DetailItem label="Password">Managed by Clerk</DetailItem>
        </dl>
      </div>
    </Card>
  );
}
