"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { PortalSession, PortalUser } from "@/lib/types";
import { BoaSafraLogo } from "./brand";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";
import { cx } from "./ui";

export function AppShell({ session, devUsers, children }: {
  session: PortalSession;
  devUsers: PortalUser[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user, memberships, activeOrgId } = session;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <a href="#main-content" className="sr-only-focusable absolute top-2 left-2 z-50 rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white">
        Skip to main content
      </a>
      <header className="shrink-0 border-b border-hairline bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Boa Safra Ag engagements"><BoaSafraLogo /></Link>
          <UserMenu user={user} devUsers={devUsers} memberships={memberships} />
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <nav aria-label="Portal sections" className="flex gap-1">
              {[{ href: "/", label: "Engagements" }, { href: "/documents", label: "All documents" }].map((item) => {
                const active = item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/engagements")
                  : pathname.startsWith("/documents");
                return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                  className={cx("rounded-md px-3 py-2 text-sm font-medium", active ? "bg-brand-50 text-brand-800" : "text-muted hover:bg-canvas hover:text-ink")}>
                  {item.label}
                </Link>;
              })}
            </nav>
            <OrgSwitcher memberships={memberships} activeOrgId={activeOrgId} />
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="shrink-0 border-t border-hairline px-4 py-4 text-center text-xs text-muted">
        Boa Safra Ag Client Portal &middot; Mockup for stakeholder review
      </footer>
    </div>
  );
}
