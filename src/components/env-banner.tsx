import { BUILD_LABEL, ENV_LABEL } from "@/lib/env";

/**
 * The blue environment strip carried over from RFS Next. Content comes from
 * `NEXT_PUBLIC_ENV_LABEL` / `NEXT_PUBLIC_BUILD_ID`.
 */
export function EnvBanner() {
  return (
    <div className="bg-[#1d4ed8] px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-white uppercase">
      {ENV_LABEL} <span className="mx-1.5 opacity-60">|</span> BUILD{" "}
      {BUILD_LABEL}
    </div>
  );
}
