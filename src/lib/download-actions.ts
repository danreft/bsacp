"use server";

import { requireSession } from "./auth";
import { getDocumentRowById, recordDownloadEvent } from "./data";
import { isDownloadable } from "./format";

/**
 * Records a download in the audit trail.
 *
 * The server resolves who is downloading and re-checks that the document is
 * actually theirs and actually downloadable, so a forged call from the client
 * cannot log a bogus row — or imply a download that policy would not allow.
 */
export async function logDownload(documentId: string): Promise<void> {
  const session = await requireSession();
  if (!session.activeOrgId) return;

  const row = await getDocumentRowById(documentId, session.activeOrgId);
  if (!row || !isDownloadable(row.document)) return;

  await recordDownloadEvent({
    userId: session.user.id,
    userName: session.user.fullName,
    orgId: session.activeOrgId,
    documentId: row.document.id,
    version: row.document.version,
  });
}
