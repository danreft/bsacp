import { DOCUMENT_STATUS_META, ENGAGEMENT_STATUS_META } from "@/lib/format";
import type { DocumentStatus, EngagementStatus } from "@/lib/types";

import { Badge } from "./ui";

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const meta = DOCUMENT_STATUS_META[status];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function EngagementStatusBadge({
  status,
}: {
  status: EngagementStatus;
}) {
  const meta = ENGAGEMENT_STATUS_META[status];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}
