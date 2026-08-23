"use client";

/**
 * Theme toggle.
 *
 * Two states: light and dark.
 *
 * It had four. "System" and "High contrast" were removed from the picker — the
 * first because pinning "follow the OS" as a third state is a preference almost
 * nobody revisits, and the behaviour survives anyway: with nothing stored the
 * boot script still follows `prefers-color-scheme`, so a machine in dark still
 * lands on dark. The second is a harder trade and is written up in
 * `lib/theme.ts`: the 7:1 token set and its audit are untouched and the value
 * still applies, it is simply no longer offered here.
 *
 * The choice is written to a cookie, not just `localStorage`, so it survives
 * the hop to the app on another origin. See `lib/theme.ts`.
 *
 * The applied class is written by an inline script in the document head before
 * first paint (see `layout.tsx`). This component only handles changes.
 */

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyTheme, readStoredTheme, resolveTheme, writeTheme, type Theme } from "@/lib/theme";

const OPTIONS: Array<{
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export { applyTheme };

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // `high-contrast` may still be stored by the a11y audit or by a reader who
    // set it before it left the picker. Neither button is then selected, which
    // is honest — the applied theme is not one of the two on offer.
    const resolved = resolveTheme(readStoredTheme());
    if (resolved === "light" || resolved === "dark") setTheme(resolved);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    writeTheme(next);
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="inline-flex items-center gap-0.5 rounded-lg border border-rule p-0.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        // Before mount we cannot know the stored value, so nothing is marked
        // selected — that avoids a hydration mismatch and a visible flicker.
        const selected = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => choose(option.value)}
            className={cn(
              "rounded-md p-1.5 transition-colors duration-200",
              selected ? "bg-paper-sunk text-ink" : "text-graphite hover:text-ink",
            )}
          >
            <Icon aria-hidden="true" className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
