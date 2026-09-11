import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  FileText,
  FolderOpen,
  Sprout,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { DownloadButton } from "@/components/download-button";
import { EmptyState } from "@/components/empty-state";
import { EngagementStatusBadge } from "@/components/status-badge";
import { Card, CardHeader, LinkButton, buttonClass } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import {
  getDashboardSummary,
  getDocumentRows,
  getEngagements,
  getOrgById,
  getProducts,
} from "@/lib/data";
import { rfsNextUrl } from "@/lib/env";
import { formatDate, isDownloadable } from "@/lib/format";
import type { Engagement, Product } from "@/lib/types";

const CLOSED = new Set(["completed", "archived"]);

export default async function DashboardPage() {
  const session = await requireSession();
  const { activeOrgId } = session;

  const [org, summary, engagements, products, documentRows] = await Promise.all(
    [
      getOrgById(activeOrgId),
      getDashboardSummary(activeOrgId),
      getEngagements(activeOrgId),
      getProducts(),
      getDocumentRows(activeOrgId),
    ],
  );

  const startRfsButton = (
    <a
      href={rfsNextUrl(activeOrgId)}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass("primary", "md")}
    >
      <ExternalLink aria-hidden="true" className="h-4 w-4" />
      Start New RFS
    </a>
  );

  if (engagements.length === 0) {
    return (
      <>
        <h1 className="page-heading mb-6 text-3xl font-semibold text-ink sm:text-4xl">
          Welcome, {session.user.firstName}
        </h1>
        <EmptyState
          icon={<Sprout aria-hidden="true" className="h-6 w-6" />}
          title="No engagements yet"
          description={
            activeOrgId
              ? "Once you submit a Request for Service, your engagement and every document we exchange will appear here. Start in RFS Next and come back when it is submitted."
              : "Your account is not part of an organization yet. Your engagement lead will send an invitation."
          }
          action={activeOrgId ? startRfsButton : undefined}
        />
      </>
    );
  }

  const openEngagements = engagements.filter((e) => !CLOSED.has(e.status));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-heading text-3xl font-semibold text-ink sm:text-4xl">
            Welcome back, {session.user.firstName}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {org?.name ?? "Your organization"} &middot; documents and progress
            for every Boa Safra Ag engagement.
          </p>
        </div>
        {startRfsButton}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={<FolderOpen aria-hidden="true" className="h-4 w-4" />}
          label="Active engagements"
          value={summary.activeEngagements.length}
          detail={
            summary.completedEngagementCount + summary.archivedEngagementCount >
            0
              ? `${summary.completedEngagementCount + summary.archivedEngagementCount} closed`
              : "None closed yet"
          }
          href="/engagements"
        />
        <StatTile
          icon={<AlertCircle aria-hidden="true" className="h-4 w-4" />}
          label="Awaiting your action"
          value={summary.awaitingClient.length}
          detail={
            summary.awaitingClient.length === 0
              ? "Nothing needed from you"
              : "Document types still needed"
          }
          emphasis={summary.awaitingClient.length > 0}
        />
        <StatTile
          icon={<FileText aria-hidden="true" className="h-4 w-4" />}
          label="Documents available"
          value={documentRows.length}
          detail="Across all engagements"
          href="/documents"
        />
      </div>

      {summary.awaitingClient.length > 0 ? (
        <section className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-orange-900">
            <AlertCircle aria-hidden="true" className="h-4 w-4" />
            Awaiting your upload
          </h2>
          <ul className="mt-3 space-y-2">
            {summary.awaitingClient.map((item) => (
              <li
                key={`${item.engagement.id}-${item.documentType.id}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-orange-900">
                  <span className="font-medium">{item.documentType.name}</span>{" "}
                  for {item.engagement.name}
                </span>
                <Link
                  href={`/engagements/${item.engagement.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-orange-900 underline underline-offset-2"
                >
                  View engagement
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-orange-800">
            Uploading through the portal is coming soon — for now your
            engagement lead will collect these directly.
          </p>
        </section>
      ) : null}

      {/*
        One section per product. Today there is only Legacy Nutrient Deductions,
        so no product picker is forced on the client; a second product simply
        renders a second section.
      */}
      {products.map((product) => {
        const productEngagements = openEngagements.filter(
          (engagement) => engagement.productId === product.id,
        );
        if (productEngagements.length === 0) return null;
        return (
          <ProductSection
            key={product.id}
            product={product}
            engagements={productEngagements}
          />
        );
      })}

      <Card className="mt-8 overflow-hidden">
        <CardHeader
          title="Recently added documents"
          action={
            <Link
              href="/documents"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
            >
              All documents
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <ul>
          {summary.recentDocuments.map((row) => (
            <li
              key={row.document.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3.5 last:border-b-0"
            >
              <div className="min-w-0">
                <Link
                  href={`/documents/${row.document.id}`}
                  className="text-sm font-medium text-ink underline-offset-2 hover:text-brand-700 hover:underline"
                >
                  {row.document.fileName}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  {row.documentType.name} &middot; {row.engagement.name} &middot;{" "}
                  {formatDate(row.document.uploadedAt)}
                </p>
              </div>
              {isDownloadable(row.document) && row.document.fileUrl ? (
                <DownloadButton
                  documentId={row.document.id}
                  fileUrl={row.document.fileUrl}
                  fileName={row.document.fileName}
                  variant="secondary"
                />
              ) : (
                <span className="text-xs text-muted">
                  {row.document.fileUrl ? "Preview only" : "Awaiting upload"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function StatTile({
  icon,
  label,
  value,
  detail,
  href,
  emphasis = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  href?: string;
  emphasis?: boolean;
}) {
  const body = (
    <Card
      className={
        emphasis
          ? "h-full border-orange-200 bg-orange-50 p-5"
          : "h-full p-5 transition-colors hover:border-brand-200"
      }
    >
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
        <span className={emphasis ? "text-orange-700" : "text-brand-700"}>
          {icon}
        </span>
        {label}
      </div>
      <p className="page-heading mt-3 text-3xl font-semibold text-ink tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </Card>
  );

  return href ? (
    <Link href={href} className="block rounded-lg">
      {body}
    </Link>
  ) : (
    body
  );
}

function ProductSection({
  product,
  engagements,
}: {
  product: Product;
  engagements: Engagement[];
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="page-heading text-xl font-semibold text-ink">
          {product.name}
        </h2>
        <span className="text-xs text-muted">
          {engagements.length}{" "}
          {engagements.length === 1 ? "engagement" : "engagements"}
        </span>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-muted">{product.description}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {engagements.map((engagement) => (
          <Card key={engagement.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="page-heading text-lg font-semibold text-ink">
                <Link
                  href={`/engagements/${engagement.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {engagement.name}
                </Link>
              </h3>
              <EngagementStatusBadge status={engagement.status} />
            </div>
            <dl className="mt-4 grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs tracking-wide text-muted uppercase">
                  Legal owner
                </dt>
                <dd className="mt-0.5 text-ink">{engagement.legalOwner}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-muted uppercase">
                  Last modified
                </dt>
                <dd className="mt-0.5 text-ink">
                  {formatDate(engagement.updatedAt)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs tracking-wide text-muted uppercase">
                  Fields
                </dt>
                <dd className="mt-0.5 text-ink">
                  {engagement.fields.join(", ")}
                </dd>
              </div>
            </dl>
            <LinkButton
              href={`/engagements/${engagement.id}`}
              variant="secondary"
              size="sm"
              className="mt-5 self-start"
            >
              Open engagement
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </LinkButton>
          </Card>
        ))}
      </div>
    </section>
  );
}
