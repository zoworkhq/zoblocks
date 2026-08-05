"use client";

import { usePathname } from "next/navigation";
import { ClipboardList, Rows3, LogOut, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/oxygen/app-shell";
import { signOut } from "@/lib/actions";

/**
 * Nav is declared client-side because AppShell takes icon *components*, and a
 * function cannot cross the server/client boundary.
 *
 * `requires` is the mechanism a customer would use: the shell composes
 * navigation from the scopes the server resolved, so a member has no admin
 * route at all rather than a disabled one. The server still enforces every
 * permission — hiding a link is usability, never access control.
 */
const NAV: NavItem[] = [
  { id: "tasks", label: "My work", href: "/tasks", icon: ClipboardList, requires: "tasks:read" },
  { id: "board", label: "Team board", href: "/board", icon: Rows3, requires: "tasks:read" },
  { id: "people", label: "People", href: "/admin/people", icon: Users, requires: "admin" },
];

export function Shell({
  scopes,
  userName,
  children,
}: {
  scopes: string[];
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current = NAV.find((item) => pathname.startsWith(item.href))?.id;

  return (
    <AppShell
      className="hq-shell min-h-dvh"
      scopes={scopes}
      items={NAV}
      currentId={current}
      brand={
        <span className="flex items-baseline gap-2">
          <span className="text-[0.9375rem] font-semibold tracking-tight text-[var(--ox-text)]">
            hq
          </span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--ox-text-muted)]">
            Zowork
          </span>
        </span>
      }
      actions={
        <form action={signOut} className="flex items-center gap-4">
          <span className="hidden text-[0.75rem] text-[var(--ox-text-muted)] sm:inline">
            {userName}
          </span>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[0.75rem] text-[var(--ox-text-muted)] transition-colors hover:text-[var(--ox-text)]"
          >
            <LogOut aria-hidden="true" className="size-3.5" />
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </AppShell>
  );
}
