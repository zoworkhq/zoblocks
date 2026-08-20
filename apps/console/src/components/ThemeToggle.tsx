"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light, dark, or whatever the operating system says.
 *
 * Three states rather than two, and "system" is the default. A console that
 * only toggles ignores a reader who has already told their machine they want
 * dark after six — and a customer authoring a *dark* theme needs to see this
 * console's own chrome in dark, or they are judging their palette against the
 * wrong ground.
 *
 * The key is read by the inline script in `app/layout.tsx`, which applies the
 * class before first paint. Both must agree, so the name is defined here and
 * that script is the only other place it appears.
 */
const STORAGE_KEY = "oxygen-console-theme";

type Choice = "light" | "system" | "dark";

const CHOICES: readonly { value: Choice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

function apply(choice: Choice): void {
  const dark =
    choice === "dark" ||
    (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  /*
   * Starts at "system" on both server and client and is corrected in an effect,
   * rather than reading localStorage during render. Reading storage in render
   * makes the server's HTML and the client's first pass disagree, which is the
   * hydration error this component would otherwise cause on every load.
   */
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") setChoice(stored);
  }, []);

  // Kept live while "system" is selected, so the console follows the machine
  // at sunset instead of only at the next reload.
  useEffect(() => {
    if (choice !== "system") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [choice]);

  const select = (value: Choice) => {
    setChoice(value);
    localStorage.setItem(STORAGE_KEY, value);
    apply(value);
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
