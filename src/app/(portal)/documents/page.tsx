import { FileText } from "lucide-react";
import type { Metadata } from "next";

import { DocumentBrowser } from "@/components/document-browser";
import { EmptyState } from "@/components/empty-state";
import { LinkButton, PageHeading } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { getDocumentRows, getEngagements, getProducts } from "@/lib/data";
import { documentTypes as allDocumentTypes } from "@/lib/mock-data";
import { RETENTION_YEARS } from "@/lib/retention";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const session = await requireSession();
  const [rows, engagements, products] = await Promise.all([
    getDocumentRows(session.activeOrgId),
    getEngagements(session.activeOrgId),
    getProducts(),
  ]);

  // The type filter offers every type belonging to a product this organization
  // has an engagement in, so a second product widens the list automatically.
  const productIds = new Set(
    engagements.map((engagement) => engagement.productId),
  );
  const documentTypes = allDocumentTypes
    .filter((type) => productIds.has(type.productId))
    .sort((a, b) => {
      const productDelta =
        products.findIndex((p) => p.id === a.productId) -
        products.findIndex((p) => p.id === b.productId);
      return productDelta || a.order - b.order;
    });

  if (rows.length === 0) {
    return (
      <>
        <PageHeading title="Documents" />
        <EmptyState
          icon={<FileText aria-hidden="true" className="h-6 w-6" />}
          title="No documents yet"
          description="Documents exchanged during your engagements will collect here, where you can search, filter, and download them."
          action={<LinkButton href="/">View engagements</LinkButton>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeading
        title="Documents"
        description="Every document across every engagement. Filter, preview, or select several and download them together."
      />
      <DocumentBrowser
        rows={rows}
        documentTypes={documentTypes}
        engagements={engagements}
        enableBulkSelect
        showEngagementColumn
      />

      <p className="mt-4 text-xs text-muted">
        Only final documents can be downloaded; anything still in progress is
        preview-only. Documents stay available for {RETENTION_YEARS} years after
        an engagement completes.
      </p>
    </>
  );
}
