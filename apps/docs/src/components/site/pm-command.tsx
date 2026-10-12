"use client";

/**
 * A terminal command, shown for the reader's package manager.
 *
 * Every block carries its own npm · pnpm · yarn · bun switch, and choosing one
 * switches every block on the page — a reader picks once, near whichever
 * command they happen to reach first, rather than hunting for a page-level
 * control above it.
 *
 * The choice lives in a module-level store, not React context, for the same
 * reason as the design-language switch: the blocks sit in different server
 * components and threading a provider around them would make the whole page
 * a client component. It is remembered in `localStorage` as a per-reader
 * convenience; the server and the first client render always say npm, so
 * hydration never disagrees with the HTML.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  PACKAGE_MANAGERS,
  toCommand,
  type Command,
  type PackageManager,
} from "@zoblocks/component-meta";
import { CopyButton } from "./code-block";

const STORAGE_KEY = "zoblocks-package-manager";

let current: PackageManager = "npm";
let hydrated = false;
const listeners = new Set<() => void>();

function isPackageManager(value: unknown): value is PackageManager {
  return typeof value === "string" && (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isPackageManager(stored)) current = stored;
    } catch {
      /* Storage refused. npm is a fine default. */
    }
    // Nothing is subscribed yet on this tick, so tell React on the next one.
    queueMicrotask(() => listeners.forEach((l) => l()));
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setPackageManager(pm: PackageManager) {
  current = pm;
  try {
    localStorage.setItem(STORAGE_KEY, pm);
  } catch {
    /* Remembering is a convenience, not a requirement. */
  }
  listeners.forEach((l) => l());
}

export function usePackageManager(): PackageManager {
  return React.useSyncExternalStore(
    subscribe,
    () => current,
    () => "npm",
  );
}

export function PmCommand({
  commands,
  className,
}: {
  commands: readonly Command[];
  className?: string;
}) {
  const pm = usePackageManager();
  const lines = commands.map((command) => toCommand(pm, command));
  const text = lines.join("\n");

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-panel-rule bg-panel",
        className,
      )}
    >
      <div className="flex items-center gap-1 border-b border-panel-rule px-2 py-1.5 sm:px-3">
        <div role="group" aria-label="Package manager" className="flex gap-0.5">
          {PACKAGE_MANAGERS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === pm}
              onClick={() => setPackageManager(option)}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[0.6875rem] transition-colors duration-200",
                option === pm
                  ? "bg-panel-fg/10 text-panel-fg"
                  : "text-panel-muted hover:text-panel-fg",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <CopyButton
          text={text}
          what={lines.length === 1 ? "command" : "commands"}
          ariaLabel={lines.length === 1 ? `Copy command: ${lines[0]}` : undefined}
        />
      </div>
      <ol className="space-y-1 px-4 py-3 sm:px-5" aria-label="Terminal commands">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-3 font-mono text-[0.8125rem] leading-relaxed">
            <span aria-hidden="true" className="select-none text-trace">
              $
            </span>
            <code className="min-w-0 break-words text-panel-fg/95">{line}</code>
          </li>
        ))}
      </ol>
    </div>
  );
}
