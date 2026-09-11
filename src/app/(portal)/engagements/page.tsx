import { ExternalLink, Sprout } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { EngagementStatusBadge } from "@/components/status-badge";
import { Card, LinkButton, PageHeading, buttonClass } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { getEngagements, getProducts } from "@/lib/data";
import { rfsNextUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { retentionEndsAt } from "@/lib/retention";

export const metadata: Metadata = { title: "Engagements" };

export default async function EngagementsPage({
  searchParams,
}: PageProps<"/engagements">) {
  const session = await requireSession();
  const { archived } = await searchParams;
  const showArchived = archived === "1";

  const [all, products] = await Promise.all([
    getEngagements(session.activeOrgId),
    getProducts(),
  ]);

  const archivedCount = all.filter(
    (engagement) => engagement.status === "archived",
  ).length;
  const engagements = showArchived
    ? all
    : all.filter((engagement) => engagement.status !== "archived");

  const productName = (productId: string) =>
    products.find((product) => product.id === productId)?.name ?? "—";

  const startRfsButton = (
    <a
      href={rfsNextUrl(session.activeOrgId)}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass("primary", "md")}
    >
      <ExternalLink aria-hidden="true" className="h-4 w-4" />
      Start New RFS
    </a>
  );

  if (all.length === 0) {
    return (
      <>
        <PageHeading title="Engagements" />
        <EmptyState
          icon={<Sprout aria-hidden="true" className="h-6 w-6" />}
          title="No engagements yet"
          description="Submit a Request for Service and your engagement will show up here, along with every document we exchange."
          action={startRfsButton}
        />
      </>
    );
  }

  return (
    <>
      <PageHeading
        title="Engagements"
        description="Every engagement this organization has with Boa Safra Ag."
        action={startRfsButton}
      />

      {archivedCount > 0 ? (
        <div className="mb-3 flex justify-end">
          {/*
            A link rather than a control with state: the toggle survives a
            reload and can be shared, and it needs no client JavaScript.
          */}
          <Link
            href={showArchived ? "/engagements" : "/engagements?archived=1"}
            className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            {showArchived
              ? "Hide archived"
              : `Show archived (${archivedCount})`}
          </Link>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Your Boa Safra Ag engagements
            </caption>
            <thead>
              <tr className="border-b border-hairline bg-canvas text-xs tracking-wide text-muted uppercase">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Engagement
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Legal Owner
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Fields
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Last Modified
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {engagements.map((engagement) => {
                const until = retentionEndsAt(engagement);
                return (
                  <tr
                    key={engagement.id}
                    className="border-b border-hairline last:border-b-0 hover:bg-canvas/70"
                  >
                    <th
                      scope="row"
                      className="px-4 py-3.5 align-middle font-normal"
                    >
                      <Link
                        href={`/engagements/${engagement.id}`}
                        className="font-medium text-ink underline-offset-2 hover:text-brand-700 hover:underline"
                      >
                        {engagement.name}
                      </Link>
                      <span className="mt-0.5 block text-xs text-muted">
                        {productName(engagement.productId)}
                      </span>
                    </th>
                    <td className="px-4 py-3.5 align-middle text-muted">
                      {engagement.legalOwner}
                    </td>
                    <td className="max-w-xs px-4 py-3.5 align-middle text-muted">
                      {engagement.fields.join(", ")}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <EngagementStatusBadge status={engagement.status} />
                      {until ? (
                        <span className="mt-1 block text-xs whitespace-nowrap text-muted">
                          Available until {formatDate(until)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap text-muted">
                      {formatDate(engagement.updatedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right align-middle">
                      <LinkButton
                        href={`/engagements/${engagement.id}`}
                        size="sm"
                      >
                        Open
                        <span className="sr-only"> {engagement.name}</span>
                      </LinkButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
