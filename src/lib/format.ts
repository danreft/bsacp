import type {
  DocumentStatus,
  EngagementStatus,
  UploaderKind,
} from "./types";

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Fixed UTC formatting. Dates are rendered identically on the server and the
 * client, which keeps hydration stable regardless of the viewer's locale.
 */
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDate(iso: string | Date): string {
  return dateFormatter.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatDateTime(iso: string | Date): string {
  return `${dateTimeFormatter.format(
    typeof iso === "string" ? new Date(iso) : iso,
  )} UTC`;
}

export function formatUploader(uploadedBy: UploaderKind): string {
  return uploadedBy === "client" ? "You" : "Boa Safra Ag";
}

export function formatUploaderLong(uploadedBy: UploaderKind): string {
  return uploadedBy === "client" ? "Client" : "Boa Safra Ag";
}

interface BadgeTone {
  label: string;
  /** Tailwind classes for the badge pill. */
  className: string;
}

/**
 * Client-facing labels for the internal workflow statuses. The stored values
 * stay as they are; only the presentation is translated.
 */
export const DOCUMENT_STATUS_META: Record<DocumentStatus, BadgeTone> = {
  pending: {
    // The only document status that asks the client to act, so it carries the
    // same orange as the engagement-level "Action Needed".
    label: "Requested",
    className: "bg-orange-100 text-orange-900 ring-orange-300",
  },
  received: {
    label: "Received",
    className: "bg-gray-100 text-gray-700 ring-gray-300",
  },
  under_review: {
    label: "In Progress",
    className: "bg-gray-100 text-gray-700 ring-gray-300",
  },
  final: {
    label: "Final",
    className: "bg-brand-50 text-brand-800 ring-brand-200",
  },
};

export const ENGAGEMENT_STATUS_META: Record<EngagementStatus, BadgeTone> = {
  in_progress: {
    label: "In Progress",
    className: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  awaiting_client: {
    label: "Action Needed",
    className: "bg-orange-100 text-orange-900 ring-orange-300",
  },
  under_review: {
    label: "Under Review",
    className: "bg-violet-50 text-violet-800 ring-violet-200",
  },
  completed: {
    label: "Completed",
    className: "bg-brand-50 text-brand-800 ring-brand-200",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-100 text-gray-600 ring-gray-300",
  },
};

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  "pending",
  "received",
  "under_review",
  "final",
];

export const UPLOADER_KINDS: UploaderKind[] = ["boa_safra", "client"];

/** Only a final document may be downloaded. */
export function isDownloadable(document: {
  status: DocumentStatus;
  fileUrl: string | null;
}): boolean {
  return document.status === "final" && Boolean(document.fileUrl);
}
