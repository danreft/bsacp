import { Bell, Building2, KeyRound, Mail } from "lucide-react";
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
          <NotificationPreferences />
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

const NOTIFICATION_OPTIONS = [
  {
    id: "new-document",
    label: "New document posted",
    description: "Email me when a final document is added to an engagement.",
  },
  {
    id: "action-needed",
    label: "Action needed",
    description: "Email me when Boa Safra Ag requests something from me.",
  },
  {
    id: "daily-digest",
    label: "Daily digest",
    description: "Roll the day's activity into a single email instead.",
  },
];

/** Placeholder for the notification work on the roadmap. */
function NotificationPreferences() {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Bell aria-hidden="true" className="h-4 w-4 text-muted" />
            Notification preferences
          </span>
        }
        action={
          <Badge className="bg-gray-100 text-gray-700 ring-gray-300">
            Coming soon
          </Badge>
        }
      />
      <ul className="divide-y divide-hairline">
        {NOTIFICATION_OPTIONS.map((option) => (
          <li
            key={option.id}
            className="flex items-start justify-between gap-4 px-5 py-4"
          >
            <label htmlFor={option.id} className="min-w-0 cursor-not-allowed">
              <span className="block text-sm font-medium text-muted">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {option.description}
              </span>
            </label>
            <input
              id={option.id}
              type="checkbox"
              disabled
              title="Coming soon"
              className="mt-1 h-4 w-4 shrink-0 cursor-not-allowed rounded border-hairline accent-brand-700 opacity-50"
            />
          </li>
        ))}
      </ul>
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
        description="Clerk's account management renders here once keys are configured."
      />
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-start gap-3 rounded-md bg-amber-50 px-4 py-3 ring-1 ring-amber-200 ring-inset">
          <KeyRound
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
          />
          <p className="text-sm text-amber-900">
            Running on the dev bypass identity. Add{" "}
            <code className="rounded bg-white/70 px-1 py-0.5 text-xs">
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-white/70 px-1 py-0.5 text-xs">
              CLERK_SECRET_KEY
            </code>{" "}
            to{" "}
            <code className="rounded bg-white/70 px-1 py-0.5 text-xs">
              .env.local
            </code>{" "}
            to replace this panel with Clerk&rsquo;s{" "}
            <code className="rounded bg-white/70 px-1 py-0.5 text-xs">
              &lt;UserProfile /&gt;
            </code>
            .
          </p>
        </div>
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
