"use client";

/**
 * Theme toggle.
 *
 * Three states rather than two: light, dark, and system. "System" is the
 * default and is a real setting, not the absence of one — a reader who has
 * their OS in dark mode should not have to re-pick it here, and a reader who
 * deliberately chose light should keep it when the OS flips at sunset.
 *
 * The applied class is written by an inline script in the document head before
 * first paint (see layout.tsx). This component only handles changes.
 */

import * as React from "react";
import { Contrast, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "high-contrast" | "system";

const OPTIONS: Array<{
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "high-contrast", label: "High contrast", icon: Contrast },
  { value: "system", label: "System", icon: Monitor },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // High contrast is a third theme, not a modifier on the other two: the token
  // build emits it as its own value set held to 7:1, and layering it over dark
  // would give a reader two half-applied palettes.
  if (theme === "high-contrast") {
    root.classList.remove("dark");
    root.setAttribute("data-ox-theme", "high-contrast");
    return;
  }

  root.removeAttribute("data-ox-theme");
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("system");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("oxygen-theme") as Theme | null;
    if (
      stored === "light" ||
      stored === "dark" ||
      stored === "high-contrast" ||
      stored === "system"
    ) {
      setTheme(stored);
    }
  }, []);

  // Follow the OS while the preference is "system".
  React.useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    setTheme(next);
    localStorage.setItem("oxygen-theme", next);
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
