import type { Engagement } from "./types";

/**
 * Document retention.
 *
 * Policy: everything on an engagement stays available for seven years after
 * the engagement's completion date. An engagement that has not completed has
 * no retention end yet — the clock has not started.
 *
 * The clock is per engagement, not per document, so a report and the boundary
 * map that supports it always expire together.
 */
export const RETENTION_YEARS = 7;

/** Engagements inside this window are flagged as expiring soon in the UI. */
export const EXPIRY_WARNING_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

/** `null` while the engagement is still open. */
export function retentionEndsAt(engagement: Engagement): Date | null {
  if (!engagement.completedAt) return null;
  const until = new Date(engagement.completedAt);
  until.setUTCFullYear(until.getUTCFullYear() + RETENTION_YEARS);
  return until;
}

export function isRetained(
  engagement: Engagement,
  now: Date = new Date(),
): boolean {
  const until = retentionEndsAt(engagement);
  return until === null || until.getTime() > now.getTime();
}

export function daysUntilExpiry(
  engagement: Engagement,
  now: Date = new Date(),
): number | null {
  const until = retentionEndsAt(engagement);
  if (until === null) return null;
  return Math.ceil((until.getTime() - now.getTime()) / DAY_MS);
}

export function isExpiringSoon(
  engagement: Engagement,
  now: Date = new Date(),
): boolean {
  const days = daysUntilExpiry(engagement, now);
  return days !== null && days > 0 && days <= EXPIRY_WARNING_DAYS;
}
