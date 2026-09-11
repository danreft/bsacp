"use client";

import { FileText, FolderOpen, LayoutDashboard, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { PortalSession, PortalUser } from "@/lib/types";

import { BoaSafraLogo } from "./brand";
import { OrgSwitcher } from "./org-switcher";
import { cx } from "./ui";
import { UserMenu } from "./user-menu";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/engagements", label: "Engagements", icon: FolderOpen },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Portal sections" className="flex-1 px-3 py-4">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "text-muted hover:bg-canvas hover:text-ink",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cx(
                    "h-4 w-4",
                    active ? "text-brand-700" : "text-muted",
                  )}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-hairline px-5 py-4">
      <p className="text-[11px] leading-relaxed text-muted">
        Questions about an engagement? Email{" "}
        <a
          href="mailto:clients@boasafraag.example"
          className="font-medium text-brand-700 underline underline-offset-2"
        >
          clients@boasafraag.example
        </a>
      </p>
    </div>
  );
}

export function AppShell({
  session,
  devUsers,
  children,
}: {
  session: PortalSession;
  devUsers: PortalUser[];
  children: ReactNode;
}) {
  const { user, memberships, activeOrgId } = session;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-0 flex-1">
      <a
        href="#main-content"
        className="sr-only-focusable absolute top-2 left-2 z-50 rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-white lg:flex">
        <div className="border-b border-hairline px-5 py-4">
          <Link href="/" className="block">
            <BoaSafraLogo />
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Portal navigation"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-2 border-b border-hairline px-5 py-4">
              <BoaSafraLogo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="-m-1 rounded p-1 text-muted hover:bg-canvas hover:text-ink"
              >
                <X aria-hidden="true" className="h-5 w-5" />
                <span className="sr-only">Close navigation</span>
              </button>
            </div>
            <div className="border-b border-hairline px-4 py-3">
              <OrgSwitcher
                memberships={memberships}
                activeOrgId={activeOrgId}
              />
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            <SidebarFooter />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-hairline bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              className="-ml-1 rounded-md p-2 text-muted transition-colors hover:bg-canvas hover:text-ink lg:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </button>
            <span className="lg:hidden">
              <BoaSafraLogo />
            </span>
            <span className="hidden lg:block">
              <OrgSwitcher
                memberships={memberships}
                activeOrgId={activeOrgId}
              />
            </span>
          </div>
          <UserMenu
            user={user}
            devUsers={devUsers}
            memberships={memberships}
          />
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
        >
          {children}
        </main>

        <footer className="border-t border-hairline bg-white px-4 py-4 text-center text-xs text-muted sm:px-6">
          Boa Safra Ag Client Portal &middot; Mockup for stakeholder review
        </footer>
      </div>
    </div>
  );
}
