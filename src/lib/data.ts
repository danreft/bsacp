/**
 * Read-only accessors over the mock data.
 *
 * Three access rules are enforced here, and only here, so there is one place
 * to audit and one place to change:
 *
 *   1. **Organization scoping.** Every accessor takes the caller's active
 *      organization id and returns only that organization's work. Both roles
 *      (`owner` and `member`) see everything the organization owns; the role
 *      only governs member management and the download audit trail. An id from
 *      another organization returns nothing, so it 404s.
 *
 *   2. **Internal documents.** Anything marked `visibility: "internal"` is
 *      Boa Safra work product and is filtered out here, so nothing above the
 *      data layer ever holds one.
 *
 *   3. **Retention.** An engagement's documents stay available for seven years
 *      after it completes. Past that the engagement and its documents stop
 *      being returned.
 *
 * Non-final documents ARE returned: clients can see and preview them. What
 * they cannot do is download them, which is enforced at the UI boundary via
 * `isDownloadable()` in `format.ts`.
 *
 * Every function is async even though the data is in memory: call sites
 * already `await`, so swapping this module for a real database or API client
 * later is a change to this file alone. `MOCK_LATENCY_MS` adds artificial
 * delay so the loading skeletons can be demonstrated.
 */
import {
  clientOrgs,
  documentTypes,
  documents,
  downloadEvents,
  engagements,
  products,
} from "./mock-data";
import { isRetained } from "./retention";
import type {
  ClientOrg,
  DocumentGroup,
  DocumentStatus,
  DocumentType,
  DownloadEvent,
  Engagement,
  PortalDocument,
  Product,
} from "./types";

const LATENCY_MS = Number(process.env.MOCK_LATENCY_MS ?? 0);

async function settle<T>(value: T): Promise<T> {
  if (LATENCY_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  }
  return value;
}

/** Rules 1 and 3, together: the engagements an organization may still see. */
function visibleEngagements(activeOrgId: string | null): Engagement[] {
  if (!activeOrgId) return [];
  return engagements.filter(
    (engagement) =>
      engagement.clientOrgId === activeOrgId && isRetained(engagement),
  );
}

/** Rule 2. */
export function isClientVisible(document: PortalDocument): boolean {
  return document.visibility === "client";
}

/** A document joined to the engagement, type, and product it belongs to. */
export interface DocumentRow {
  document: PortalDocument;
  documentType: DocumentType;
  engagement: Engagement;
  product: Product;
}

/** A lifecycle step: one document type plus its documents on an engagement. */
export interface LifecycleStep extends DocumentGroup {
  /** No documents of this type at all yet. */
  isAwaiting: boolean;
  /** This step is the client's to supply and nothing has arrived. */
  isAwaitingClient: boolean;
  /** At least one document, and every one of them is final. */
  isComplete: boolean;
  /** Somebody has to send something before this step can move. */
  hasRequested: boolean;
}

function byUploadedAtDesc(a: PortalDocument, b: PortalDocument) {
  return b.uploadedAt.localeCompare(a.uploadedAt);
}

function typeOrder(documentTypeId: string) {
  return (
    documentTypes.find((type) => type.id === documentTypeId)?.order ??
    Number.MAX_SAFE_INTEGER
  );
}

export async function getProducts(): Promise<Product[]> {
  return settle(products);
}

export async function getProductById(id: string): Promise<Product | null> {
  return settle(products.find((product) => product.id === id) ?? null);
}

export async function getOrgById(id: string | null): Promise<ClientOrg | null> {
  if (!id) return null;
  return settle(clientOrgs.find((org) => org.id === id) ?? null);
}

/**
 * Every engagement the active organization owns, newest activity first.
 * Archived engagements are included; callers decide whether to show them.
 */
export async function getEngagements(
  activeOrgId: string | null,
): Promise<Engagement[]> {
  const rows = visibleEngagements(activeOrgId).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return settle(rows);
}

export async function getEngagementById(
  id: string,
  activeOrgId: string | null,
): Promise<Engagement | null> {
  const engagement = visibleEngagements(activeOrgId).find(
    (row) => row.id === id,
  );
  return settle(engagement ?? null);
}

export async function getDocumentTypesForProduct(
  productId: string,
): Promise<DocumentType[]> {
  const rows = documentTypes
    .filter((type) => type.productId === productId)
    .sort((a, b) => a.order - b.order);
  return settle(rows);
}

/** Client-visible documents on one engagement. */
export async function getDocumentsForEngagement(
  engagementId: string,
): Promise<PortalDocument[]> {
  const rows = documents
    .filter(
      (document) =>
        document.engagementId === engagementId && isClientVisible(document),
    )
    .sort(
      (a, b) =>
        typeOrder(a.documentTypeId) - typeOrder(b.documentTypeId) ||
        byUploadedAtDesc(a, b),
    );
  return settle(rows);
}

/**
 * The engagement lifecycle: every document type for the product, in order,
 * with whatever has been filed against it.
 */
export async function getLifecycleSteps(
  engagement: Engagement,
): Promise<LifecycleStep[]> {
  const types = await getDocumentTypesForProduct(engagement.productId);
  const visible = await getDocumentsForEngagement(engagement.id);

  const steps = types.map((documentType) => {
    const stepDocuments = visible
      .filter((document) => document.documentTypeId === documentType.id)
      .sort(byUploadedAtDesc);

    const withFiles = stepDocuments.filter((document) => document.fileUrl);
    const hasRequested = stepDocuments.some(
      (document) => document.status === "pending",
    );

    return {
      documentType,
      documents: stepDocuments,
      isAwaiting: withFiles.length === 0,
      isAwaitingClient:
        withFiles.length === 0 && documentType.providedBy === "client",
      isComplete:
        stepDocuments.length > 0 &&
        stepDocuments.every((document) => document.status === "final"),
      hasRequested,
    } satisfies LifecycleStep;
  });

  return settle(steps);
}

/** Every client-visible document in the active organization, newest first. */
export async function getDocumentRows(
  activeOrgId: string | null,
): Promise<DocumentRow[]> {
  const orgEngagements = visibleEngagements(activeOrgId);
  const engagementIds = new Set(orgEngagements.map((e) => e.id));

  const rows = documents
    .filter(
      (document) =>
        engagementIds.has(document.engagementId) && isClientVisible(document),
    )
    .map((document) => {
      const engagement = orgEngagements.find(
        (e) => e.id === document.engagementId,
      )!;
      const documentType = documentTypes.find(
        (type) => type.id === document.documentTypeId,
      )!;
      const product = products.find((p) => p.id === engagement.productId)!;
      return { document, documentType, engagement, product };
    })
    .sort((a, b) => byUploadedAtDesc(a.document, b.document));

  return settle(rows);
}

export async function getDocumentRowById(
  documentId: string,
  activeOrgId: string | null,
): Promise<DocumentRow | null> {
  const rows = await getDocumentRows(activeOrgId);
  return rows.find((row) => row.document.id === documentId) ?? null;
}

/** The statuses actually present in a set of rows, for adaptive filters. */
export function distinctStatuses(rows: DocumentRow[]): DocumentStatus[] {
  return [...new Set(rows.map((row) => row.document.status))];
}

// ---------------------------------------------------------------------------
// Download audit trail
// ---------------------------------------------------------------------------

/**
 * Appends to the in-memory audit trail. It lives for the life of the server
 * process — enough to demonstrate the feature, and the one place to swap for a
 * real insert.
 */
export async function recordDownloadEvent(event: {
  userId: string;
  userName: string;
  orgId: string;
  documentId: string;
  version: number;
}): Promise<void> {
  downloadEvents.push({
    id: `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    downloadedAt: new Date().toISOString(),
    ...event,
  });
}

/** Audit rows for one document, newest first. Owner-only at the call site. */
export async function getDownloadEvents(
  documentId: string,
  activeOrgId: string | null,
): Promise<DownloadEvent[]> {
  if (!activeOrgId) return [];
  const rows = downloadEvents
    .filter(
      (event) => event.documentId === documentId && event.orgId === activeOrgId,
    )
    .sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
  return settle(rows);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  activeEngagements: Engagement[];
  completedEngagementCount: number;
  archivedEngagementCount: number;
  /** Lifecycle steps across active engagements that need something from the client. */
  awaitingClient: { engagement: Engagement; documentType: DocumentType }[];
  recentDocuments: DocumentRow[];
}

const CLOSED_STATUSES = new Set(["completed", "archived"]);

export async function getDashboardSummary(
  activeOrgId: string | null,
): Promise<DashboardSummary> {
  const all = await getEngagements(activeOrgId);
  const activeEngagements = all.filter(
    (engagement) => !CLOSED_STATUSES.has(engagement.status),
  );

  const awaitingClient: DashboardSummary["awaitingClient"] = [];
  for (const engagement of activeEngagements) {
    const steps = await getLifecycleSteps(engagement);
    for (const step of steps) {
      if (step.isAwaitingClient) {
        awaitingClient.push({ engagement, documentType: step.documentType });
      }
    }
  }

  const rows = await getDocumentRows(activeOrgId);

  return settle({
    activeEngagements,
    completedEngagementCount: all.filter((e) => e.status === "completed")
      .length,
    archivedEngagementCount: all.filter((e) => e.status === "archived").length,
    awaitingClient,
    recentDocuments: rows.slice(0, 5),
  });
}
