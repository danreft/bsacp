"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { clerkEnabled } from "@/lib/clerk";
import { switchDevOrg } from "@/lib/session-actions";
import type { OrgMembership } from "@/lib/types";

import { cx } from "./ui";

/**
 * Active-organization control. Clerk owns organization membership when it is
 * configured; the dev bypass gets a matching control backed by a cookie.
 */
export function OrgSwitcher({
  memberships,
  activeOrgId,
}: {
  memberships: OrgMembership[];
  activeOrgId: string | null;
}) {
  if (clerkEnabled) {
    return (
      <OrganizationSwitcher
        hidePersonal
        afterSelectOrganizationUrl="/"
        appearance={{
          elements: { rootBox: "flex items-center", avatarBox: "h-6 w-6" },
        }}
      />
    );
  }
  return <DevOrgSwitcher memberships={memberships} activeOrgId={activeOrgId} />;
}

function DevOrgSwitcher({
  memberships,
  activeOrgId,
}: {
  memberships: OrgMembership[];
  activeOrgId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = memberships.find((m) => m.orgId === activeOrgId);
  if (!active) return null;

  // Nothing to switch between: show the organization, but not as a control.
  if (memberships.length === 1) {
    return (
      <span className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm text-ink">
        <Building2 aria-hidden="true" className="h-4 w-4 text-muted" />
        <span className="max-w-[12rem] truncate">{active.orgName}</span>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-md border border-hairline bg-white px-2.5 py-1.5 text-sm text-ink transition-colors hover:border-brand-300"
      >
        <Building2 aria-hidden="true" className="h-4 w-4 text-muted" />
        <span className="max-w-[12rem] truncate">{active.orgName}</span>
        <ChevronDown
          aria-hidden="true"
          className={cx(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="sr-only">Switch organization</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Organizations"
          className="absolute left-0 z-40 mt-2 w-64 overflow-hidden rounded-lg border border-hairline bg-white shadow-lg"
        >
          <p className="border-b border-hairline px-4 py-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
            Your organizations
          </p>
          <ul className="py-1">
            {memberships.map((membership) => (
              <li key={membership.orgId}>
                <form action={switchDevOrg}>
                  <input
                    type="hidden"
                    name="orgId"
                    value={membership.orgId}
                  />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-canvas"
                  >
                    <Check
                      aria-hidden="true"
                      className={cx(
                        "h-3.5 w-3.5 shrink-0",
                        membership.orgId === activeOrgId
                          ? "text-brand-700"
                          : "invisible",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {membership.orgName}
                      </span>
                      <span className="block text-xs text-muted capitalize">
                        {membership.role}
                      </span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
