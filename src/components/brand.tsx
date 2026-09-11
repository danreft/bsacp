import { cx } from "./ui";

/** The sprout mark used alongside the wordmark. */
export function BoaSafraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cx("shrink-0", className)}
    >
      <circle cx="16" cy="16" r="16" className="fill-brand-700" />
      <path
        d="M16 24v-7.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 17c-4.2 0-6.6-2.2-6.9-6.1 3.9-.5 6.6 1.6 6.9 6.1Z"
        fill="white"
        opacity="0.92"
      />
      <path
        d="M16 15.2c.3-4.1 2.8-6 6.4-5.5-.3 3.6-2.6 5.6-6.4 5.5Z"
        fill="white"
      />
    </svg>
  );
}

export function BoaSafraLogo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cx("flex items-center gap-2.5", className)}>
      <BoaSafraMark className="h-8 w-8" />
      <span className="min-w-0 leading-tight">
        <span
          className={cx(
            "page-heading block text-base font-semibold",
            tone === "dark" ? "text-ink" : "text-white",
          )}
        >
          Boa Safra Ag
        </span>
        <span
          className={cx(
            "block text-[11px]",
            tone === "dark" ? "text-muted" : "text-white/80",
          )}
        >
          Harvest Hidden Tax Deductions
        </span>
      </span>
    </span>
  );
}
