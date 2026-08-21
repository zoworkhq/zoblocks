/**
 * Three things the panel does, and which one is showing.
 *
 * A tablist rather than three buttons, because the platform's own pattern
 * brings arrow-key movement and the right announcement, and because these are
 * views of one file rather than three separate actions. Roving tabindex, so Tab
 * reaches the strip once and moves past it into the panel rather than through
 * every tab on the way.
 */

export type Pane = "check" | "pull" | "push";

export interface TabsOptions {
  active: Pane;
  /** Pull and push need a console; check does not, and says so when disabled. */
  connected: boolean;
  onSelect(pane: Pane): void;
}

const LABEL: Record<Pane, string> = {
  check: "Check",
  pull: "Pull",
  push: "Propose",
};

const ORDER: Pane[] = ["check", "pull", "push"];

export function renderTabs(root: HTMLElement, options: TabsOptions): void {
  root.textContent = "";
  root.setAttribute("role", "tablist");
  root.setAttribute("aria-label", "What this panel is showing");

  const buttons: HTMLButtonElement[] = [];

  for (const pane of ORDER) {
    const needsConsole = pane !== "check";
    const disabled = needsConsole && !options.connected;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab";
    button.textContent = LABEL[pane];
    button.dataset.pane = pane;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(pane === options.active));
    button.tabIndex = pane === options.active ? 0 : -1;

    if (disabled) {
      button.disabled = true;
      // Said rather than left to be inferred from a grey button.
      button.title = "Connect to the console first.";
    }

    button.addEventListener("click", () => options.onSelect(pane));
    buttons.push(button);
    root.append(button);
  }

  root.addEventListener("keydown", (event) => {
    const index = buttons.findIndex((b) => b.dataset.pane === options.active);
    if (index < 0) return;

    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();

    // Skips what it cannot reach and wraps, so the strip never focuses a
    // disabled tab or dead-ends at one.
    for (let i = 1; i <= buttons.length; i += 1) {
      const next = buttons[(index + step * i + buttons.length * i) % buttons.length];
      if (next && !next.disabled) {
        next.focus();
        options.onSelect(next.dataset.pane as Pane);
        return;
      }
    }
  });
}
