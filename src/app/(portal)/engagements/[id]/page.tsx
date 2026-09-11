import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentBrowser } from "@/components/document-browser";
import { LifecycleStepper } from "@/components/lifecycle-stepper";
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
        href="/engagements"
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

        <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        </dl>

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Card className="h-fit p-4 lg:sticky lg:top-4">
          <LifecycleStepper steps={steps} />
        </Card>

        <div className="min-w-0">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-ink uppercase">
            Documents
          </h2>
          <DocumentBrowser
            rows={rows}
            documentTypes={documentTypes}
            groupByType
            enableBulkSelect
          />
        </div>
      </div>
    </>
  );
}
