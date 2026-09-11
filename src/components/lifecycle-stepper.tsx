import { AlertCircle, Check, Circle, Clock } from "lucide-react";

import type { LifecycleStep } from "@/lib/data";

import { cx } from "./ui";

type StepState =
  | "complete"
  | "in_progress"
  | "awaiting_client"
  | "awaiting_us";

function stateOf(step: LifecycleStep): StepState {
  if (step.isComplete) return "complete";
  // A requested document is an explicit ask of the client, so it outranks the
  // generic "nothing here yet" state.
  if (step.hasRequested) return "awaiting_client";
  if (!step.isAwaiting) return "in_progress";
  return step.isAwaitingClient ? "awaiting_client" : "awaiting_us";
}

const STATE_META: Record<
  StepState,
  { icon: typeof Check; marker: string; label: string; labelClass: string }
> = {
  complete: {
    icon: Check,
    marker: "border-brand-700 bg-brand-700 text-white",
    label: "Complete",
    labelClass: "text-brand-800",
  },
  in_progress: {
    icon: Clock,
    marker: "border-brand-400 bg-white text-brand-600",
    label: "In progress",
    labelClass: "text-muted",
  },
  awaiting_client: {
    icon: AlertCircle,
    marker: "border-orange-400 bg-orange-100 text-orange-700",
    label: "Awaiting your upload",
    labelClass: "font-medium text-orange-800",
  },
  awaiting_us: {
    icon: Circle,
    marker: "border-hairline bg-white text-muted",
    label: "Not started",
    labelClass: "text-muted",
  },
};

/**
 * Vertical checklist of the engagement lifecycle. Steps come straight from the
 * product's document types, so a product with a different set of steps renders
 * correctly with no changes here.
 */
export function LifecycleStepper({ steps }: { steps: LifecycleStep[] }) {
  const completeCount = steps.filter((step) => step.isComplete).length;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">
          Engagement progress
        </h2>
        <span className="text-xs text-muted tabular-nums">
          {completeCount} of {steps.length} complete
        </span>
      </div>

      <ol className="relative">
        {steps.map((step, index) => {
          const state = stateOf(step);
          const meta = STATE_META[state];
          const Icon = meta.icon;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.documentType.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute top-7 left-[13px] h-[calc(100%-1.25rem)] w-px",
                    step.isComplete ? "bg-brand-300" : "bg-hairline",
                  )}
                />
              ) : null}

              <span
                className={cx(
                  "relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                  meta.marker,
                )}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {step.documentType.name}
                </p>
                <p className={cx("mt-0.5 text-xs", meta.labelClass)}>
                  {meta.label}
                  {step.documents.length > 0 ? (
                    <span className="text-muted">
                      {" "}
                      &middot; {step.documents.length}{" "}
                      {step.documents.length === 1 ? "document" : "documents"}
                    </span>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
