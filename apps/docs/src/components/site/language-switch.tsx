"use client";

/**
 * The design-language switch, at the top of a component page.
 *
 * It sits in the header beside the install command because that is where a
 * reader is deciding whether this library fits their stack, and "does it look
 * like the rest of our app" is most of that question.
 *
 * A radiogroup rather than three buttons: the three are mutually exclusive
 * states of one setting, so a keyboard user should arrow between them inside a
 * single tab stop rather than tab past two they do not want. Same pattern as
 * `ThemeToggle`, which is the control this one sits next to.
 *
 * The colour-mode toggle stays where it is. Design language and light/dark are
 * independent axes — three by two is six states — and one control would make
 * four of them unreachable.
 */

import * as React from "react";
import { HOST_IDS, HOST_LABEL } from "@oxygenui-design/host-react";
import { cn } from "@/lib/utils";
import { setDesignLanguage, useDesignLanguage, type DesignLanguage } from "@/lib/design-language";
import { LANGUAGE_MARK } from "./framework-marks";

export function LanguageSwitch({ className }: { className?: string }) {
  const language = useDesignLanguage();
  const refs = React.useRef(new Map<DesignLanguage, HTMLButtonElement | null>());

  /** Arrows move within the group, as APG's radiogroup pattern requires. */
  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const delta =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (!delta) return;
      event.preventDefault();

      const index = HOST_IDS.indexOf(language);
      // Wraps, which a radiogroup does and a tablist with Home/End does not.
      const next = HOST_IDS[(index + delta + HOST_IDS.length) % HOST_IDS.length]!;
      setDesignLanguage(next);
      refs.current.get(next)?.focus();
    },
    [language],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Design language"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-rule p-0.5",
        className,
      )}
    >
      {HOST_IDS.map((id) => {
        const Mark = LANGUAGE_MARK[id];
        const selected = id === language;
        return (
          <button
            key={id}
            ref={(node) => {
              refs.current.set(id, node);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            // Roving tabindex: the group is one tab stop, not three.
            tabIndex={selected ? 0 : -1}
            onClick={() => setDesignLanguage(id)}
            className={cn(
              // min-h-8 clears WCAG 2.5.8; the label makes these wider than
              // the theme toggle's icon-only buttons, not shorter.
              "inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 py-1 text-[0.8125rem] transition-colors duration-200",
              selected ? "bg-paper-sunk font-medium text-ink" : "text-graphite hover:text-ink",
            )}
          >
            <Mark className="size-3.5 shrink-0" />
            {HOST_LABEL[id]}
          </button>
        );
      })}
    </div>
  );
}
