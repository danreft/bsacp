"use client";

import { UserButton } from "@clerk/nextjs";
import { ChevronDown, LogOut, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { clerkEnabled } from "@/lib/clerk";
import { switchDevUser } from "@/lib/session-actions";
import type { OrgMembership, PortalUser } from "@/lib/types";

import { cx } from "./ui";

function initialsOf(user: PortalUser) {
  return (
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() || "?"
  );
}

/**
 * Clerk's `<UserButton />` when Clerk is configured, otherwise a stand-in menu
 * for the dev-bypass identity so the shell looks complete without keys.
 */
export function UserMenu({
  user,
  devUsers,
  memberships,
}: {
  user: PortalUser;
  devUsers: PortalUser[];
  memberships: OrgMembership[];
}) {
  if (clerkEnabled) {
    return (
      <UserButton
        appearance={{ elements: { avatarBox: "h-9 w-9" } }}
        userProfileUrl="/account"
        userProfileMode="navigation"
      />
    );
  }
  return (
    <DevBypassMenu user={user} devUsers={devUsers} memberships={memberships} />
  );
}

function DevBypassMenu({
  user,
  devUsers,
  memberships,
}: {
  user: PortalUser;
  devUsers: PortalUser[];
  memberships: OrgMembership[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  const others = devUsers.filter((candidate) => candidate.email !== user.email);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-hairline bg-white py-1 pr-2 pl-1 transition-colors hover:border-brand-300"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">
          {initialsOf(user)}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cx(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="sr-only">Account menu for {user.fullName}</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-lg border border-hairline bg-white shadow-lg"
        >
          <div className="border-b border-hairline px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1 truncate text-xs text-muted">
              {memberships
                .map((m) => `${m.orgName} (${m.role})`)
                .join(" · ") || "No organization"}
            </p>
            <p className="mt-2 inline-flex rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase ring-1 ring-amber-200 ring-inset">
              Dev bypass
            </p>
          </div>

          {others.length > 0 ? (
            <div className="border-b border-hairline px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                <UsersRound aria-hidden="true" className="h-3.5 w-3.5" />
                Sign in as
              </p>
              <p className="mt-1.5 text-xs text-muted">
                Each person sees only the organizations they belong to.
              </p>
              <ul className="mt-2 space-y-1">
                {others.map((candidate) => (
                  <li key={candidate.email}>
                    <form action={switchDevUser}>
                      <input
                        type="hidden"
                        name="email"
                        value={candidate.email}
                      />
                      <button
                        type="submit"
                        className="w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-canvas"
                      >
                        <span className="block truncate text-sm text-ink">
                          {candidate.fullName}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {candidate.email}
                        </span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link
            role="menuitem"
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-canvas"
          >
            <UserRound aria-hidden="true" className="h-4 w-4 text-muted" />
            Account
          </Link>
          <button
            role="menuitem"
            type="button"
            disabled
            title="Sign-out requires Clerk keys"
            className="flex w-full cursor-not-allowed items-center gap-2 px-4 py-2.5 text-left text-sm text-muted"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
