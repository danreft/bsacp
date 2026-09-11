import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentBrowser } from "@/components/document-browser";
import { EngagementStatusBadge } from "@/components/status-badge";
import { Card, DetailItem } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import {
  getDocumentRows,
  getDocumentTypesForProduct,
  getEngagementById,
  getLifecycleSteps,
  getProductById,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { isExpiringSoon, retentionEndsAt } from "@/lib/retention";

export async function generateMetadata({
  params,
}: PageProps<"/engagements/[id]">): Promise<Metadata> {
  const { id } = await params;
  const session = await requireSession();
  const engagement = await getEngagementById(id, session.activeOrgId);
  return { title: engagement?.name ?? "Engagement" };
}

export default async function EngagementDetailPage({
  params,
}: PageProps<"/engagements/[id]">) {
  const { id } = await params;
  const session = await requireSession();
  const engagement = await getEngagementById(id, session.activeOrgId);
  if (!engagement) notFound();

  const [product, steps, documentTypes, allRows] = await Promise.all([
    getProductById(engagement.productId),
    getLifecycleSteps(engagement),
    getDocumentTypesForProduct(engagement.productId),
    getDocumentRows(session.activeOrgId),
  ]);

  const rows = allRows.filter((row) => row.engagement.id === engagement.id);
  const until = retentionEndsAt(engagement);

  return (
    <>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted underline-offset-2 hover:text-brand-700 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        All engagements
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">
              {product?.name ?? "Engagement"}
            </p>
            <h1 className="page-heading mt-1 text-3xl font-semibold text-ink sm:text-4xl">
              {engagement.name}
            </h1>
          </div>
          <EngagementStatusBadge status={engagement.status} />
        </div>

        <details className="mt-4"><summary className="cursor-pointer text-sm font-medium text-brand-700">Engagement details</summary>
        <dl className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Legal owner">{engagement.legalOwner}</DetailItem>
          <DetailItem label="Fields">
            {engagement.fields.join(", ")}
          </DetailItem>
          <DetailItem label="Started">
            {formatDate(engagement.startedAt)}
          </DetailItem>
          <DetailItem label="Last modified">
            {formatDate(engagement.updatedAt)}
          </DetailItem>
        </dl></details>

        {until ? (
          <p
            className={
              isExpiringSoon(engagement)
                ? "mt-6 rounded-md bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900 ring-1 ring-orange-200 ring-inset"
                : "mt-6 text-sm text-muted"
            }
          >
            Documents on this engagement are available until{" "}
            <span className="font-medium">{formatDate(until)}</span> (seven
            years after completion).
          </p>
        ) : null}
      </Card>

      <div className="mt-6 space-y-6">
        {steps.some((step) => step.isAwaitingClient) ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            <h2 className="font-semibold">Needed from you</h2>
            <p className="mt-1">{steps.filter((step) => step.isAwaitingClient).map((step) => step.documentType.name).join(", ")}</p>
            <p className="mt-2">Send these to your engagement lead.</p>
          </div>
        ) : null}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">Documents</h2>
          <DocumentBrowser rows={rows} documentTypes={documentTypes} />
        </div>
      </div>
    </>
  );
}
