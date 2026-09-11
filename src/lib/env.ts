/**
 * Environment banner content. Both values are `NEXT_PUBLIC_` so the banner can
 * render in a client component without a round trip.
 */
export const ENV_LABEL = process.env.NEXT_PUBLIC_ENV_LABEL ?? "DEV ENVIRONMENT";
export const BUILD_LABEL =
  process.env.NEXT_PUBLIC_BUILD_ID ??
  new Date().toISOString().slice(0, 10).replace(/-/g, ".");

/** Where the "Start New RFS" buttons point. */
export const RFS_NEXT_URL =
  process.env.NEXT_PUBLIC_RFS_NEXT_URL ?? "https://rfs.boasafraag.example/rfs";

/**
 * The RFS Next link carries the active organization so the new request can be
 * prefilled with the right legal entity.
 */
export function rfsNextUrl(activeOrgId: string | null): string {
  if (!activeOrgId) return RFS_NEXT_URL;
  const url = new URL(RFS_NEXT_URL);
  url.searchParams.set("clientOrgId", activeOrgId);
  return url.toString();
}
