"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";
import { signOutAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

/**
 * The account pill, top right.
 *
 * Sign out used to sit in the bottom-left corner of the rail, beside the theme
 * toggle. That put a destructive, session-ending control one stray click from
 * a preference control, in the corner of a navigation list it has nothing to do
 * with — and it left the person's own account with no home at all, so changing
 * your own password was something only an administrator could arrange for you.
 *
 * A menu gives all three the same place: who you are, what you can change about
 * yourself, and the way out. Top right is where every reader already looks for
 * it, which is not a fashion — it is the only part of an application's chrome
 * that is genuinely conventional.
 *
 * A real `<button>` with `aria-expanded` and `aria-controls`, not a hover card.
 * Hover menus cannot be opened from a keyboard and cannot be reached at all by
 * touch, and this one contains the only route to signing out.
 */
export function AccountMenu({
  name,
  email,
  role,
  organisation,
}: {
  name: string;
  email: string;
  role: string;
  organisation: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Navigating closes it, so the menu is never left hanging over the screen
  // somebody just asked for.
  useEffect(() => setOpen(false), [pathname]);

  /*
   * What an open menu owes a keyboard: a way out, and focus that goes in and
   * comes back. Pointer users get the third route — clicking anywhere else.
   */
  useEffect(() => {
    if (!open) return;

    const returnTo = trigger.current;
    menu.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      // Only pull focus back if it is still inside the menu. Clicking a link in
      // here starts a navigation, and yanking focus to a button that is about
      // to be re-rendered would undo it.
      if (wrapper.current?.contains(document.activeElement)) returnTo?.focus();
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="menu"
        className={cn(
          "group flex max-w-[15rem] items-center gap-2 rounded-full border py-1 pl-1 pr-2.5",
          "transition-colors duration-200",
          open ? "border-rule-strong bg-paper-sunk" : "border-rule bg-paper hover:bg-paper-sunk",
        )}
      >
        <Initials name={name} />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-[0.75rem] font-medium leading-tight">{name}</span>
          <span className="block truncate text-[0.625rem] leading-tight text-graphite-soft">
            {organisation}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className={cn(
            "size-3.5 shrink-0 text-graphite-soft transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label="Account"
          className="rise-in surface absolute right-0 z-50 mt-2 w-[15rem] overflow-hidden p-0 shadow-[0_18px_44px_-18px_rgb(2_20_17/0.28)]"
        >
          {/*
            The identity, stated in full. The pill truncates and this does not:
            on a multi-tenant console "which account am I about to act as" is a
            question worth answering without making somebody hover for a title.
          */}
          <div className="border-b border-rule bg-paper-sunk px-3.5 py-3">
            <p className="truncate text-[0.8125rem] font-semibold">{name}</p>
            <p className="truncate text-[0.6875rem] text-graphite">{email}</p>
            <p className="eyebrow mt-1.5 text-[0.5625rem] text-oxygen-deep">{role}</p>
          </div>

          <div className="p-1.5">
            <MenuLink href="/account" Icon={UserRound}>
              Account settings
            </MenuLink>
            <MenuLink href="/account#password" Icon={KeyRound}>
              Change password
            </MenuLink>
          </div>

          <div className="border-t border-rule p-1.5">
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] text-fail transition-colors duration-150 hover:bg-fail-wash"
              >
                <LogOut aria-hidden="true" strokeWidth={2} className="size-3.5 shrink-0" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MenuLink({
  href,
  Icon,
  children,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] text-graphite transition-colors duration-150 hover:bg-paper-sunk hover:text-ink"
    >
      <Icon aria-hidden="true" strokeWidth={2} className="size-3.5 shrink-0" />
      {children}
    </Link>
  );
}

/**
 * Initials, not a photograph.
 *
 * There is nowhere to upload one and inventing a generated avatar would be
 * decoration standing in for identity. Two letters from the name the
 * organisation already knows is honest and legible at 28px.
 */
function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden="true"
      className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-solid font-mono text-[0.625rem] font-medium text-accent-on"
    >
      {letters || "?"}
    </span>
  );
}
