"use client";

import { AlertTriangle, ExternalLink, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "./ui";

/**
 * Inline PDF preview. The browser's built-in viewer does the rendering, so
 * there is no PDF library in the bundle.
 */
export function PdfViewerModal({
  fileName,
  fileUrl,
  subtitle,
  isPreliminary = false,
  onClose,
}: {
  fileName: string;
  fileUrl: string;
  subtitle?: string;
  /** Anything not yet final: preview only, and say so. */
  isPreliminary?: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview of ${fileName}`}
        className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-hairline bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{fileName}</p>
            {subtitle ? (
              <p className="truncate text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isPreliminary ? null : (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                New tab
              </a>
            )}
            <Button
              ref={closeRef}
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isPreliminary ? <PreliminaryBanner /> : null}
        <iframe
          title={`Preview of ${fileName}`}
          src={fileUrl}
          className="min-h-0 flex-1 bg-canvas"
        />
      </div>
    </div>
  );
}

/**
 * Shown above any preview of a document that is not final. Preliminary work is
 * viewable so clients can follow progress, but it must not be circulated.
 */
export function PreliminaryBanner() {
  return (
    <p className="flex items-start gap-2 border-b border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-medium text-orange-900">
      <AlertTriangle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
      Preliminary — not for distribution. This document is still being prepared
      and cannot be downloaded until it is final.
    </p>
  );
}
