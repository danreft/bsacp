import { ArrowLeft, ExternalLink, History, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DownloadButton } from "@/components/download-button";
import { PreliminaryNotice } from "@/components/preliminary-notice";
import { DocumentStatusBadge } from "@/components/status-badge";
import { Badge, Card, CardHeader, DetailItem } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { getDocumentRowById, getDownloadEvents } from "@/lib/data";
import {
  formatBytes,
  formatDate,
  formatDateTime,
  formatUploaderLong,
  isDownloadable,
} from "@/lib/format";
import { RETENTION_YEARS, retentionEndsAt } from "@/lib/retention";

export async function generateMetadata({
  params,
}: PageProps<"/documents/[id]">): Promise<Metadata> {
  const { id } = await params;
  const session = await requireSession();
  const row = await getDocumentRowById(id, session.activeOrgId);
  return { title: row?.document.fileName ?? "Document" };
}

export default async function DocumentDetailPage({
  params,
}: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const session = await requireSession();
  const row = await getDocumentRowById(id, session.activeOrgId);
  if (!row) notFound();

  const { document, documentType, engagement, product } = row;
  const downloadable = isDownloadable(document);
  const until = retentionEndsAt(engagement);

  // The audit trail is owner-only.
  const isOwner = session.activeRole === "owner";
  const events = isOwner
    ? await getDownloadEvents(document.id, session.activeOrgId)
    : [];

  return (
    <>
      <Link
        href="/documents"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted underline-offset-2 hover:text-brand-700 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        All documents
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">
            {documentType.name}
          </p>
          <h1 className="page-heading mt-1 text-2xl font-semibold break-words text-ink sm:text-3xl">
            {document.fileName}
          </h1>
        </div>
        {downloadable && document.fileUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-hairline bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Open in new tab
            </a>
            <DownloadButton
              documentId={document.id}
              fileUrl={document.fileUrl}
              fileName={document.fileName}
              size="md"
            />
          </div>
        ) : null}
      </div>

      {!downloadable && document.fileUrl ? (
        <div className="mb-6">
          <PreliminaryNotice />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="order-2 space-y-6 lg:order-1">
          <Card className="overflow-hidden">
            <CardHeader title="Preview" />
            {document.fileUrl ? (
              <iframe
                title={`Preview of ${document.fileName}`}
                src={document.fileUrl}
                className="h-[42rem] w-full bg-canvas"
              />
            ) : (
              <p className="px-5 py-16 text-center text-sm text-muted">
                This document has been requested but not provided yet, so there
                is nothing to preview.
              </p>
            )}
          </Card>

          {isOwner ? (
            <Card className="overflow-hidden">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <ShieldCheck
                      aria-hidden="true"
                      className="h-4 w-4 text-muted"
                    />
                    Download activity
                  </span>
                }
                description="Visible to organization owners only."
              />
              {events.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">
                  No downloads recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                    <caption className="sr-only">
                      Download history for {document.fileName}
                    </caption>
                    <thead>
                      <tr className="border-b border-hairline bg-canvas text-xs tracking-wide text-muted uppercase">
                        <th scope="col" className="px-5 py-2.5 font-semibold">
                          Who
                        </th>
                        <th scope="col" className="px-5 py-2.5 font-semibold">
                          Version
                        </th>
                        <th scope="col" className="px-5 py-2.5 font-semibold">
                          When
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr
                          key={event.id}
                          className="border-b border-hairline last:border-b-0"
                        >
                          <th
                            scope="row"
                            className="px-5 py-3 align-middle font-normal text-ink"
                          >
                            {event.userName}
                          </th>
                          <td className="px-5 py-3 align-middle text-muted tabular-nums">
                            v{event.version}
                          </td>
                          <td className="px-5 py-3 align-middle whitespace-nowrap text-muted">
                            {formatDateTime(event.downloadedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ) : null}
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-ink uppercase">
              Details
            </h2>
            <dl className="space-y-4">
              <DetailItem label="Status">
                <DocumentStatusBadge status={document.status} />
              </DetailItem>
              <DetailItem label="Version">{document.version}</DetailItem>
              <DetailItem label="Document type">
                {documentType.name}
              </DetailItem>
              <DetailItem label="Engagement">
                <Link
                  href={`/engagements/${engagement.id}`}
                  className="text-brand-700 underline underline-offset-2"
                >
                  {engagement.name}
                </Link>
              </DetailItem>
              <DetailItem label="Product">{product.name}</DetailItem>
              <DetailItem label="Uploaded by">
                {formatUploaderLong(document.uploadedBy)}
              </DetailItem>
              <DetailItem label="Uploaded">
                {formatDateTime(document.uploadedAt)}
              </DetailItem>
              <DetailItem label="Size">
                {formatBytes(document.sizeBytes)}
              </DetailItem>
              <DetailItem label="Available until">
                {until ? (
                  <>
                    {formatDate(until)}
                    <span className="mt-1 block text-xs text-muted">
                      {RETENTION_YEARS} years after the engagement completed.
                    </span>
                  </>
                ) : (
                  <span className="text-muted">
                    While the engagement is open
                  </span>
                )}
              </DetailItem>
            </dl>
          </Card>

          {document.previousVersions?.length ? (
            <Card className="overflow-hidden">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <History aria-hidden="true" className="h-4 w-4 text-muted" />
                    Version history
                  </span>
                }
                description="Superseded versions stay viewable but cannot be downloaded."
              />
              <ol className="divide-y divide-hairline">
                <li className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        Version {document.version}
                        <Badge className="ml-2 bg-brand-50 text-brand-800 ring-brand-200">
                          Current
                        </Badge>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatUploaderLong(document.uploadedBy)} &middot;{" "}
                        {formatDateTime(document.uploadedAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {formatBytes(document.sizeBytes)}
                    </span>
                  </div>
                  {downloadable && document.fileUrl ? (
                    <DownloadButton
                      documentId={document.id}
                      fileUrl={document.fileUrl}
                      fileName={document.fileName}
                      variant="secondary"
                      className="mt-3"
                    />
                  ) : null}
                </li>

                {document.previousVersions.map((version) => (
                  <li key={version.version} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          Version {version.version}
                          <Badge className="ml-2 bg-gray-100 text-gray-700 ring-gray-300">
                            Superseded
                          </Badge>
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {formatUploaderLong(version.uploadedBy)} &middot;{" "}
                          {formatDateTime(version.uploadedAt)}
                        </p>
                        <p className="mt-1.5 text-xs text-muted italic">
                          {version.note}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        {formatBytes(version.sizeBytes)}
                      </span>
                    </div>
                    <a
                      href={version.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-md border border-hairline bg-white px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-300 hover:bg-brand-50"
                    >
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      View v{version.version}
                    </a>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
