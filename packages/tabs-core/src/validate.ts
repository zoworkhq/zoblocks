/**
 * Configuration validation.
 *
 * Every problem here renders perfectly and passes every automated checker.
 * That is the entire reason the function exists: these are not crashes, they
 * are silent losses of meaning, and the only moment anyone will look at them
 * is the moment they are introduced.
 *
 * The component never writes to a customer's console — that capability is
 * forbidden repo-wide. Callers get the list back and decide: the React layer
 * throws in development and does nothing in production, and
 * `@zoblocks/tabs-semantic-mode` catches the two most common cases at lint
 * time, before the code ever runs.
 */

import { isSemanticMode, rolesFor } from "./roles.js";
import type { OverflowStrategy, SemanticMode, TabItem } from "./types.js";

export type ProblemCode =
  | "missing-mode"
  | "href-without-nav"
  | "nav-without-href"
  | "panels-without-owner"
  | "wrap-outside-radiogroup"
  | "duplicate-value"
  | "empty-value"
  | "disabled-without-reason"
  | "non-string-label-without-text"
  | "controlled-and-uncontrolled"
  | "value-not-in-items"
  | "closable-without-handler"
  | "vertical-wrap";

export interface Problem {
  code: ProblemCode;
  message: string;
}

export interface ValidateInput {
  mode: SemanticMode | undefined;
  items: readonly TabItem[];
  overflow?: OverflowStrategy;
  orientation?: "horizontal" | "vertical";
  value?: string | undefined;
  defaultValue?: string | undefined;
  hasPanels?: boolean;
  hasCloseHandler?: boolean;
}

export function validateTabsConfig(input: ValidateInput): Problem[] {
  const problems: Problem[] = [];
  const { items, overflow, orientation = "horizontal", value, defaultValue } = input;

  /*
   * An unrecognised mode is reported, not crashed on.
   *
   * This used to test only for absence. A mode outside the four — "tablist" is
   * the one everybody reaches for, since that is the ARIA role — passed the
   * guard, resolved to no role spec, and threw `Cannot read properties of
   * undefined (reading 'ownsPanels')` from inside the validator a few lines
   * down. The one function whose job is to explain a misconfiguration was the
   * one that failed to, and it did it with a stack trace pointing at library
   * internals rather than at the caller's prop.
   */
  if (!isSemanticMode(input.mode)) {
    problems.push({
      code: "missing-mode",
      message: `${
        input.mode === undefined
          ? "Tabs requires `as`."
          : `Tabs does not have a mode called "${String(input.mode)}".`
      } There is no safe default: a view switch, a link list, a form value and a wizard share this silhouette and need four different accessibility trees. Pick "tabs", "nav", "radiogroup" or "steps".`,
    });
    return problems; // Everything below depends on knowing the mode.
  }

  const spec = rolesFor(input.mode);

  const withHref = items.filter((item) => typeof item.href === "string" && item.href.length > 0);
  if (input.mode !== "nav" && withHref.length > 0) {
    problems.push({
      code: "href-without-nav",
      message: `${withHref.length} item(s) carry an \`href\` under as="${input.mode}". A tablist of links announces "tab, n of m" and then destroys focus when an arrow key navigates the page. Use as="nav", which renders real anchors.`,
    });
  }
  if (input.mode === "nav" && items.length > 0 && withHref.length === 0) {
    problems.push({
      code: "nav-without-href",
      message:
        'as="nav" renders anchors, and an anchor without an `href` is not focusable or clickable. Give every item an `href`, or use as="tabs".',
    });
  }

  if (!spec.ownsPanels && input.hasPanels) {
    problems.push({
      code: "panels-without-owner",
      message: `as="${input.mode}" does not own panels — ${
        input.mode === "nav"
          ? "the router renders the content"
          : "a radiogroup produces a value, not a view"
      }. The panels passed here would be rendered with no tab to label them.`,
    });
  }

  if (overflow === "wrap") {
    if (input.mode !== "radiogroup") {
      problems.push({
        code: "wrap-outside-radiogroup",
        message:
          'overflow="wrap" is only legal for as="radiogroup". Two-dimensional arrow navigation in a one-dimensional widget has no correct answer: once a tablist wraps, "the next tab" stops being a direction. Use overflow="menu" or "collapse".',
      });
    }
    if (orientation === "vertical") {
      problems.push({
        code: "vertical-wrap",
        message:
          'overflow="wrap" makes no sense in a vertical orientation — there is nothing to wrap onto.',
      });
    }
  }

  const seen = new Set<string>();
  for (const item of items) {
    if (!item.value) {
      problems.push({
        code: "empty-value",
        message:
          "Every item needs a non-empty `value`. It is the selection key and it must be stable across reorders — which is why it is not the array index.",
      });
      continue;
    }
    if (seen.has(item.value)) {
      problems.push({
        code: "duplicate-value",
        message: `Duplicate item value "${item.value}". Selection, panel wiring and URL sync all key off it, so a duplicate silently selects two tabs at once.`,
      });
    }
    seen.add(item.value);

    if (item.disabled && !item.disabledReason) {
      problems.push({
        code: "disabled-without-reason",
        message: `Item "${item.value}" is disabled with no \`disabledReason\`. A control that refuses without saying why is indistinguishable from one that is broken, and the reason is what gets announced via aria-describedby.`,
      });
    }

    if (item.label !== undefined && typeof item.label !== "string" && !item.textLabel) {
      problems.push({
        code: "non-string-label-without-text",
        message: `Item "${item.value}" has a non-string \`label\` and no \`textLabel\`. Typeahead, the overflow menu and the collapsed <select> all need text, and silently degrading them is worse than asking for it.`,
      });
    }

    if (item.closable && !input.hasCloseHandler) {
      problems.push({
        code: "closable-without-handler",
        message: `Item "${item.value}" is closable but no \`editable.onClose\` was given, so its close button would do nothing.`,
      });
    }
  }

  if (value !== undefined && defaultValue !== undefined) {
    problems.push({
      code: "controlled-and-uncontrolled",
      message:
        "Both `value` and `defaultValue` were given. Pick one: `value` makes the component controlled, and a controlled component that also holds internal state will fight whatever owns it.",
    });
  }

  const selected = value ?? defaultValue;
  if (selected !== undefined && items.length > 0 && !seen.has(selected)) {
    problems.push({
      code: "value-not-in-items",
      message: `Selected value "${selected}" is not in \`items\`. Nothing will be selected, and the strip will have no tab stop until something else changes.`,
    });
  }

  return problems;
}

/** One readable string for a thrown development error. */
export function formatProblems(problems: readonly Problem[]): string {
  if (problems.length === 0) return "";
  const lines = problems.map((p) => `  • [${p.code}] ${p.message}`);
  return `ZoBlocks Tabs found ${problems.length} configuration problem(s):\n${lines.join("\n")}`;
}
