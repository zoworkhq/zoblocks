/**
 * Slash shortcuts, and the combobox keyboard model behind them.
 *
 * A shortcut is not a text macro. It is a **named, versioned prompt template
 * with a fixed tool set** — the unit a clinical safety officer signs off on,
 * and the reason this is worth building properly. "Prep" meaning one thing in
 * cardiology and another in psychiatry is a governance problem, and it is
 * solved by making the shortcut a reviewable object with an id and a version
 * rather than a string somebody typed into a settings page.
 *
 * The keyboard model is the ARIA combobox pattern, implemented once here so
 * both skins inherit it. Getting this wrong is the single most common
 * accessibility defect in command palettes: arrow keys that move DOM focus into
 * the listbox break the typeahead, so focus must stay in the input and the
 * active option is pointed at with `aria-activedescendant`.
 */

import { useCallback, useMemo, useState } from "react";

export interface ConsultShortcut {
  readonly id: string;
  readonly label: string;
  /** Typed after "/" to match. Defaults to the id. */
  readonly keyword?: string;
  readonly description?: string;
  /** Which mode this shortcut runs in. Absent means the current one. */
  readonly modeId?: string;
  /** The question placed in the field. */
  readonly question: string;
  /**
   * Roles this shortcut is offered to. Empty means everyone. A nurse and an
   * attending should not see the same menu, and this is where that lives.
   */
  readonly roles?: readonly string[];
}

/** Does the typed text look like a shortcut invocation? */
export function isShortcutQuery(draft: string): boolean {
  return draft.startsWith("/");
}

export function shortcutQuery(draft: string): string {
  return isShortcutQuery(draft) ? draft.slice(1).trim().toLowerCase() : "";
}

export function filterShortcuts(
  shortcuts: readonly ConsultShortcut[],
  draft: string,
  role?: string,
): readonly ConsultShortcut[] {
  if (!isShortcutQuery(draft)) return [];
  const query = shortcutQuery(draft);
  return shortcuts
    .filter((s) => !s.roles || s.roles.length === 0 || (role !== undefined && s.roles.includes(role)))
    .filter((s) => {
      if (query === "") return true;
      const keyword = (s.keyword ?? s.id).toLowerCase();
      return keyword.includes(query) || s.label.toLowerCase().includes(query);
    });
}

export interface ShortcutMenu {
  readonly open: boolean;
  readonly items: readonly ConsultShortcut[];
  readonly activeIndex: number;
  readonly activeId: string | undefined;
  /** Spread onto the input. Carries the full combobox contract. */
  readonly inputProps: {
    role: "combobox";
    "aria-expanded": boolean;
    "aria-controls": string;
    "aria-autocomplete": "list";
    "aria-activedescendant": string | undefined;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  readonly listProps: { role: "listbox"; id: string };
  readonly optionProps: (index: number) => {
    role: "option";
    id: string;
    "aria-selected": boolean;
    onMouseEnter: () => void;
    onClick: () => void;
  };
  readonly close: () => void;
}

export interface UseShortcutMenuOptions {
  readonly shortcuts: readonly ConsultShortcut[];
  readonly draft: string;
  readonly role?: string;
  readonly onSelect: (shortcut: ConsultShortcut) => void;
  /** Called on Escape with the menu closed, so the skin can close the panel. */
  readonly onEscape?: () => void;
  readonly idPrefix?: string;
}

export function useShortcutMenu(options: UseShortcutMenuOptions): ShortcutMenu {
  const { shortcuts, draft, role, onSelect, onEscape, idPrefix = "consult-shortcuts" } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const items = useMemo(() => filterShortcuts(shortcuts, draft, role), [shortcuts, draft, role]);
  const open = items.length > 0 && !dismissed;

  // Re-opening on a fresh "/" after a dismissal.
  const reopenKey = isShortcutQuery(draft);
  useMemo(() => {
    if (!reopenKey) setDismissed(false);
  }, [reopenKey]);

  const clamped = Math.min(activeIndex, Math.max(0, items.length - 1));
  const activeId = open ? `${idPrefix}-option-${clamped}` : undefined;

  const close = useCallback(() => setDismissed(true), []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!open) {
        if (event.key === "Escape") onEscape?.();
        return;
      }
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActiveIndex((i) => (i + 1) % items.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setActiveIndex((i) => (i - 1 + items.length) % items.length);
          break;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          event.preventDefault();
          setActiveIndex(items.length - 1);
          break;
        case "Enter": {
          const item = items[clamped];
          if (item) {
            event.preventDefault();
            onSelect(item);
            setActiveIndex(0);
          }
          break;
        }
        case "Escape":
          // Closes the menu and leaves the "/" in the field, so the clinician
          // can keep typing a free-text question that happens to start with a
          // slash rather than losing what they wrote.
          event.preventDefault();
          close();
          break;
        default:
          break;
      }
    },
    [open, items, clamped, onSelect, onEscape, close],
  );

  return {
    open,
    items,
    activeIndex: clamped,
    activeId,
    inputProps: {
      role: "combobox",
      "aria-expanded": open,
      "aria-controls": `${idPrefix}-list`,
      "aria-autocomplete": "list",
      "aria-activedescendant": activeId,
      onKeyDown,
    },
    listProps: { role: "listbox", id: `${idPrefix}-list` },
    optionProps: (index: number) => ({
      role: "option",
      id: `${idPrefix}-option-${index}`,
      "aria-selected": index === clamped,
      onMouseEnter: () => setActiveIndex(index),
      onClick: () => {
        const item = items[index];
        if (item) onSelect(item);
      },
    }),
    close,
  };
}
