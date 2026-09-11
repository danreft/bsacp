import { AlertTriangle } from "lucide-react";

/**
 * Page-level counterpart to the banner inside the preview modal. Shown on any
 * document that is not final: viewable so the client can follow progress, but
 * not downloadable and not for circulation.
 */
export function PreliminaryNotice() {
  return (
    <p className="flex items-start gap-2.5 rounded-md bg-orange-50 px-4 py-3 text-sm text-orange-900 ring-1 ring-orange-200 ring-inset">
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        <span className="font-semibold">Preliminary — not for distribution.</span>{" "}
        This document is still being prepared. You can review it here, but it
        cannot be downloaded until it is final.
      </span>
    </p>
  );
}
