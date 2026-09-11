import { ArrowRight, ExternalLink, Sprout } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EngagementStatusBadge } from "@/components/status-badge";
import { Card, PageHeading, buttonClass } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { getEngagements, getLifecycleSteps, getProducts } from "@/lib/data";
import { rfsNextUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { isExpiringSoon, retentionEndsAt } from "@/lib/retention";

export const metadata: Metadata = { title: "Engagements" };

export default async function EngagementsHome({ searchParams }: PageProps<"/">) {
  const session = await requireSession();
  const showArchived = (await searchParams).archived === "1";
  const [all, products] = await Promise.all([getEngagements(session.activeOrgId), getProducts()]);
  const archivedCount = all.filter((item) => item.status === "archived").length;
  const engagements = all.filter((item) => showArchived || item.status !== "archived");
  const items = await Promise.all(engagements.map(async (engagement) => ({
    engagement,
    needed: (await getLifecycleSteps(engagement)).filter((step) => step.isAwaitingClient).length,
  })));
  const startRequest = session.activeOrgId ? (
    <a href={rfsNextUrl(session.activeOrgId)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
      <ExternalLink aria-hidden="true" className="h-4 w-4" /> New request
    </a>
  ) : undefined;

  return <>
    <PageHeading title="Your engagements" description="Open an engagement to see its progress and documents." action={startRequest} />
    {archivedCount > 0 ? <div className="mb-4 flex justify-end">
      <Link href={showArchived ? "/" : "/?archived=1"} className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline">
        {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
      </Link>
    </div> : null}
    {items.length === 0 ? <EmptyState icon={<Sprout aria-hidden="true" className="h-6 w-6" />}
      title={all.length > 0 ? "No current engagements" : "No engagements yet"}
      description={!session.activeOrgId ? "Choose an organization to see its work. If you have not joined one yet, your engagement lead will send an invitation." : all.length > 0 ? "Show archived engagements to find your earlier work." : "Your engagements and documents will appear here once your request is underway."} /> :
      <div className="space-y-4">{items.map(({ engagement, needed }) => {
        const until = retentionEndsAt(engagement);
        return <Card key={engagement.id} className="overflow-hidden">
          <Link href={`/engagements/${engagement.id}`} className="block p-5 transition-colors hover:bg-brand-50/40 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink">{engagement.name}</h2>
                <p className="mt-1 text-sm text-muted">{products.find((product) => product.id === engagement.productId)?.name}</p>
              </div>
              <EngagementStatusBadge status={engagement.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className={needed > 0 ? "font-medium text-orange-900" : "text-muted"}>
                {needed > 0 ? `${needed} document ${needed === 1 ? "type needed" : "types needed"} from you` : `Updated ${formatDate(engagement.updatedAt)}`}
              </p>
              <span className="inline-flex items-center gap-2 font-medium text-brand-700">View documents <ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
            </div>
            {until ? <p className={`mt-3 text-xs ${isExpiringSoon(engagement) ? "font-medium text-orange-900" : "text-muted"}`}>Documents available until {formatDate(until)}</p> : null}
          </Link>
        </Card>;
      })}</div>}
  </>;
}
