"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyTheme, readStoredTheme, resolveTheme, writeTheme, type Theme } from "@/lib/theme";

/**
 * Light or dark.
 *
 * It had three. "System" was removed as a *button* but not as behaviour: with
 * nothing stored the boot script still follows `prefers-color-scheme`, so a
 * machine already in dark still opens the app in dark. What has gone is pinning
 * "follow the OS" as an explicit third state.
 *
 * The choice is shared with the marketing site through a cookie rather than
 * `localStorage`, because the two run on different origins and a reader who
 * picks dark there should not be handed a white login screen here. The old
 * `oxygen-app-theme` and `oxygen-console-theme` keys are still read once so
 * nobody's saved preference is silently reset. See `lib/theme.ts`.
 *
 * The class is applied before first paint by the inline script in
 * `app/layout.tsx`; this component only handles changes.
 */

const CHOICES: readonly { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeToggle() {
  /*
   * Starts light on both server and client and is corrected in an effect,
   * rather than reading storage during render. Reading it in render makes the
   * server's HTML and the client's first pass disagree, which is the hydration
   * error this component would otherwise cause on every load.
   */
  const [choice, setChoice] = useState<Theme>("light");

  useEffect(() => {
    const resolved = resolveTheme(readStoredTheme());
    if (resolved === "light" || resolved === "dark") setChoice(resolved);
  }, []);

  const select = (value: Theme) => {
    setChoice(value);
    writeTheme(value);
    applyTheme(value);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex items-center gap-0.5 rounded-lg border border-rule bg-paper-sunk p-0.5"
    >
      {CHOICES.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={choice === value}
          aria-label={label}
          onClick={() => select(value)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-200",
            choice === value
              ? "bg-paper text-ink shadow-sm"
              : "text-graphite-soft hover:text-graphite",
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
