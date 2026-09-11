"use client";

import { Download } from "lucide-react";

import { logDownload } from "@/lib/download-actions";
import { triggerDownload } from "@/lib/download";

import { useToast } from "./toast";
import { Button } from "./ui";
import type { ButtonSize, ButtonVariant } from "./ui";

/**
 * Download action with the confirmation toast and the audit-trail write wired
 * in. Only ever rendered for documents that pass `isDownloadable()`.
 */
export function DownloadButton({
  documentId,
  fileUrl,
  fileName,
  label = "Download",
  variant = "primary",
  size = "sm",
  className,
}: {
  documentId: string;
  fileUrl: string;
  fileName: string;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const { showToast } = useToast();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        triggerDownload(fileUrl, fileName);
        showToast(`Downloading “${fileName}”`);
        // Audit write is fire-and-forget: it must never block the download.
        void logDownload(documentId);
      }}
    >
      <Download aria-hidden="true" className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span className="sr-only"> {fileName}</span>
    </Button>
  );
}
