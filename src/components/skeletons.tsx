import { Card, cx } from "./ui";

function Shimmer({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("block animate-pulse rounded bg-hairline", className)}
    />
  );
}

/** Generic page skeleton used by the route-level `loading.tsx` files. */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Shimmer className="h-9 w-64" />
      <Shimmer className="mt-3 h-4 w-96 max-w-full" />
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-hairline bg-canvas px-4 py-3">
          <Shimmer className="h-3 w-40" />
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-hairline px-4 py-4 last:border-b-0"
          >
            <Shimmer className="h-4 flex-1" />
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-7 w-28" />
          </div>
        ))}
      </Card>
    </div>
  );
}

export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Shimmer className="h-9 w-72" />
      <Shimmer className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index} className="p-5">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="mt-4 h-8 w-16" />
            <Shimmer className="mt-4 h-3 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
