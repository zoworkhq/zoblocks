"use client";

/**
 * AppShell — the outermost frame, composed from what the signed-in user may do.
 *
 * A prescriber, a front-desk scheduler, and a billing analyst need genuinely
 * different products out of the same codebase, so navigation is DERIVED from
 * permissions rather than rendered-then-disabled. An unavailable feature is
 * absent, not present and rejected: a greyed-out "Prescribe" teaches a nurse
 * that the system is broken, and teaches an auditor nothing at all.
 *
 * Three properties that make it a clinical shell rather than a layout:
 *
 *   1. Patient context is a landmark, not a breadcrumb. Which chart is open is
 *      a safety fact, so it survives every route change and compresses but
 *      never disappears.
 *   2. Context changes are guarded. Switching patient with an unsaved note is
 *      the same class of error as navigating away from one, and both route
 *      through the same confirmation.
 *   3. Session expiry warns before it acts, because expiring a session under
 *      a half-written note is how documentation is lost to a policy timer.
 *
 * The server remains the authority on permissions. Hiding a route here is a
 * usability decision, never an access control.
 */

import * as React from "react";
import { Menu, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Scope required. Absent from `scopes` and the item is not rendered at all. */
  requires?: string;
  badgeCount?: number;
  /** Marks a destination where urgent work accumulates. */
  urgent?: boolean;
}

export interface AppShellProps {
  /** Scopes the signed-in user actually holds, as resolved by the server. */
  scopes: string[];
  items: NavItem[];
  currentId?: string;
  /** Persistent patient context. Rendered as a landmark, never dropped. */
  patientContext?: React.ReactNode;
  /** Called before a destination change so unsaved work can veto it. */
  onNavigate?: (item: NavItem) => Promise<boolean> | boolean;
  /** Seconds remaining in the session. Under the warning threshold it shows. */
  sessionSecondsRemaining?: number;
  onExtendSession?: () => void;
  /** Emergency access is in force. Marked persistently, not once at entry. */
  breakGlassActive?: boolean;
  breakGlassLabel?: string;
  brand?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SESSION_WARN_AT = 120;

export function AppShell({
  scopes,
  items,
  currentId,
  patientContext,
  onNavigate,
  sessionSecondsRemaining,
  onExtendSession,
  breakGlassActive = false,
  breakGlassLabel = "Emergency access",
  brand,
  actions,
  children,
  className,
}: AppShellProps) {
  const [navOpen, setNavOpen] = React.useState(false);

  // Composed, not filtered-and-disabled. A route the user cannot reach does
  // not exist in their product.
  const permitted = items.filter((item) => !item.requires || scopes.includes(item.requires));

  const expiring =
    typeof sessionSecondsRemaining === "number" && sessionSecondsRemaining <= SESSION_WARN_AT;

  async function go(item: NavItem, event: React.MouseEvent) {
    if (!onNavigate) return;
    event.preventDefault();
    const allowed = await onNavigate(item);
    if (allowed) setNavOpen(false);
  }

  return (
    <div className={cn("flex min-h-full flex-col bg-[var(--ox-bg)]", className)}>
      {/* Break-glass is a standing condition, so it sits above everything and
          is announced on entry to the shell rather than only when granted. */}
      {breakGlassActive && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 bg-[var(--ox-flag-restricted)] px-3 py-1.5 text-[length:var(--ox-text-xs)] font-semibold text-white"
        >
          <ShieldAlert aria-hidden="true" className="size-3.5" />
          {breakGlassLabel} — this session is recorded and reviewed
        </div>
      )}

      {expiring && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-center gap-3 bg-[var(--ox-status-high-bg)] px-3 py-1.5 text-[length:var(--ox-text-xs)] text-[var(--ox-status-high)]"
        >
          <span className="font-semibold">
            Session ends in {Math.max(0, Math.floor((sessionSecondsRemaining ?? 0) / 60))}:
            {String(Math.max(0, (sessionSecondsRemaining ?? 0) % 60)).padStart(2, "0")}
          </span>
          {onExtendSession && (
            <button
              type="button"
              onClick={onExtendSession}
              className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-status-high)] px-2 py-0.5 font-semibold hover:bg-[var(--ox-surface)]"
            >
              Stay signed in
            </button>
          )}
        </div>
      )}

      <header className="flex items-center gap-3 border-b border-[var(--ox-border)] bg-[var(--ox-surface)] px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]">
        <button
          type="button"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          aria-controls="ox-shell-nav"
          aria-label={navOpen ? "Close navigation" : "Open navigation"}
          className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border)] p-1.5 md:hidden"
        >
          {navOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>

        {brand}
        <div className="flex-1" />
        {actions}
      </header>

      {/*
        Patient context is its own landmark. A clinician who is unsure which
        chart is open must be able to reach the answer from anywhere, and a
        skip link into a <div> does not do that.
      */}
      {patientContext && (
        <section
          aria-label="Patient context"
          className="border-b border-[var(--ox-border)] bg-[var(--ox-surface)]"
        >
          {patientContext}
        </section>
      )}

      <div className="flex min-h-0 flex-1">
        <nav
          id="ox-shell-nav"
          aria-label="Primary"
          className={cn(
            "shrink-0 border-r border-[var(--ox-border)] bg-[var(--ox-bg-subtle)] p-2",
            "md:block md:w-56",
            navOpen ? "block w-full" : "hidden",
          )}
        >
          <ul className="flex flex-col gap-0.5">
            {permitted.map((item) => {
              const Icon = item.icon;
              const active = item.id === currentId;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(event) => go(item, event)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-[var(--ox-radius-sm)] px-2 py-1.5 text-[length:var(--ox-density-font)] no-underline",
                      active
                        ? "bg-[var(--ox-accent-subtle)] font-semibold text-[var(--ox-accent)]"
                        : "text-[var(--ox-text-muted)] hover:bg-[var(--ox-bg-muted)] hover:text-[var(--ox-text)]",
                    )}
                  >
                    {Icon && <Icon aria-hidden="true" className="size-4 shrink-0" />}
                    <span className="flex-1 truncate">{item.label}</span>
                    {/* The count is part of the link's name — a badge that is
                        only visual is a badge screen-reader users never see. */}
                    {item.badgeCount ? (
                      <span
                        className={cn(
                          "rounded-[var(--ox-radius-full)] px-1.5 py-0.5 font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-2xs)] font-bold tabular-nums",
                          item.urgent
                            ? "bg-[var(--ox-status-critical)] text-white"
                            : "bg-[var(--ox-bg-muted)] text-[var(--ox-text-muted)]",
                        )}
                      >
                        {item.badgeCount > 99 ? "99+" : item.badgeCount}
                        <span className="sr-only">
                          {item.urgent ? " urgent items" : " unread items"}
                        </span>
                      </span>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* A role with nothing permitted is a provisioning failure, and it
              should look like one rather than like an empty product. */}
          {permitted.length === 0 && (
            <p className="px-2 py-3 text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]">
              No features are enabled for your role. Contact your administrator — this is a
              provisioning problem, not an empty screen.
            </p>
          )}
        </nav>

        <main className="min-w-0 flex-1 p-[var(--ox-density-pad-x)]">{children}</main>
      </div>
    </div>
  );
}
