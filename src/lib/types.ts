/**
 * Domain types for the client portal.
 *
 * Everything here is deliberately product-agnostic: a product owns its own
 * ordered list of document types, and engagements point at a product. Adding a
 * second product is a data change, not a schema change.
 */

export type EngagementStatus =
  | "in_progress"
  | "awaiting_client"
  | "under_review"
  | "completed"
  | "archived";

/**
 * Internal workflow state of a document. Clients see the mapped client-facing
 * label from `format.ts`, never these raw values.
 *
 * `pending` means Boa Safra has requested the document from the client and it
 * has not arrived yet, so such a row carries no file.
 */
export type DocumentStatus = "pending" | "received" | "under_review" | "final";

export type UploaderKind = "client" | "boa_safra";

/**
 * `internal` documents are Boa Safra work product that a client must never
 * see. They are filtered out in `data.ts` so nothing above the data layer
 * ever holds one.
 */
export type DocumentVisibility = "client" | "internal";

/**
 * Roles within a client organization. Both see every engagement the
 * organization owns; only an owner manages members and sees download activity.
 * These map onto Clerk's built-in `org:admin` / `org:member`.
 */
export type OrgRole = "owner" | "member";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
}

/** Someone at a client organization who has portal access. */
export interface OrgMember {
  name: string;
  /** Lower-case. The address a Clerk organization invitation is sent to. */
  email: string;
  title: string;
  role: OrgRole;
}

/** One legal entity. A person may belong to several. */
export interface ClientOrg {
  id: string;
  name: string;
  /** Person who signs and is the portal's primary contact. */
  authorizedRepresentative: string;
  members: OrgMember[];
}

export interface Engagement {
  id: string;
  productId: string;
  /** The legal entity that owns this engagement. Access is scoped to it. */
  clientOrgId: string;
  name: string;
  legalOwner: string;
  fields: string[];
  status: EngagementStatus;
  startedAt: string;
  updatedAt: string;
  /** Set once the engagement closes. Starts the retention clock. */
  completedAt?: string;
}

export interface DocumentType {
  id: string;
  productId: string;
  name: string;
  /** Position in the engagement lifecycle, 1-based. */
  order: number;
  description: string;
  /**
   * Who normally supplies documents of this type. Drives the "awaiting"
   * messaging and where the future upload drop zone appears.
   */
  providedBy: UploaderKind;
}

export interface DocumentVersion {
  version: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: UploaderKind;
  sizeBytes: number;
  /** Required: every superseded version must say why it was replaced. */
  note: string;
}

export interface PortalDocument {
  id: string;
  engagementId: string;
  documentTypeId: string;
  fileName: string;
  /**
   * `null` for a requested document that has not been supplied yet — there is
   * nothing to preview or download until it arrives.
   */
  fileUrl: string | null;
  version: number;
  status: DocumentStatus;
  visibility: DocumentVisibility;
  uploadedAt: string;
  uploadedBy: UploaderKind;
  sizeBytes: number | null;
  /**
   * Prior versions of this same document, newest first. Superseded versions
   * stay previewable but are never downloadable.
   */
  previousVersions?: DocumentVersion[];
}

/** One row in the download audit trail. */
export interface DownloadEvent {
  id: string;
  userId: string;
  userName: string;
  orgId: string;
  documentId: string;
  version: number;
  downloadedAt: string;
}

/**
 * The signed-in person, normalized across the two auth paths (Clerk and the
 * keyless dev bypass) so pages never branch on which one is active.
 */
export interface PortalUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  imageUrl: string | null;
  /** True when this identity came from the dev bypass rather than Clerk. */
  isDevBypass: boolean;
}

/** Membership of one organization. */
export interface OrgMembership {
  orgId: string;
  orgName: string;
  role: OrgRole;
}

/**
 * The signed-in person plus the organization they are currently acting in.
 * Every data accessor scopes to `activeOrgId`.
 */
export interface PortalSession {
  user: PortalUser;
  memberships: OrgMembership[];
  activeOrgId: string | null;
  activeRole: OrgRole | null;
}

/** A document type paired with the documents filed against it. */
export interface DocumentGroup {
  documentType: DocumentType;
  documents: PortalDocument[];
}
