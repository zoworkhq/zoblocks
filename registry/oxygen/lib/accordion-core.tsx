"use client";

/**
 * accordion-core — the behaviour behind every Oxygen disclosure surface.
 *
 * Nothing here renders. It is the part a customer must not rewrite when they
 * replace our visual language, because it is where the accessibility contract
 * and the disclosure rules live.
 *
 * Three ideas carry the whole file.
 *
 *   1. **State is a set and a policy, not a mode.** Single, multiple, exclusive
 *      and at-least-one are one reducer with four policy functions. There is no
 *      `if (accordion)` anywhere, which is what makes the emitted markup
 *      identical in every configuration. `rc-collapse` branches on that boolean
 *      and swaps the ARIA pattern from a disclosure widget to a tablist as a
 *      side effect; a prop that changes the state policy must never change the
 *      accessibility contract.
 *
 *   2. **Expanding a section and disclosing its content are different events.**
 *      A substance-use record under 42 CFR Part 2, or a note held under a Cures
 *      Act exception, is an access — it may need a consent on file, a reason
 *      code, or an entry in an audit log. So the panel opens to explain itself,
 *      and the content stays behind `isDisclosed`. A component whose only output
 *      is `onChange(keys)` cannot express that, which is why every product
 *      rebuilds it badly.
 *
 *   3. **Withheld is a value, not an omission.** Content this reader cannot
 *      obtain still gets a row, because deleting it claims the record is
 *      complete. CONTENT.md §1 calls this the *masked* case, and the item type
 *      makes it structural: `children` is `never` alongside `kind: "withheld"`,
 *      so the content cannot sit in the bundle waiting for a CSS mistake.
 *
 * Styling lives in `styles/oxygen-accordion.css`, installed alongside this file.
 */

import * as React from "react";

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

/**
 * Which combinations of open sections are legal.
 *
 * `single` is what Ant Design calls `accordion`. The name is kept on the
 * component for familiarity and translated to a policy here, because "accordion
 * mode" describes a state rule and should not be able to reach the markup.
 */
/**
 * A style object that may also carry CSS custom properties.
 *
 * React's CSSProperties has no room for `--ox-accordion-font`, and the usual
 * workaround is an `as React.CSSProperties` cast at the call site — which also
 * silences real typos in the properties beside it. A template-literal key
 * widens the type exactly as far as it needs to go and no further.
 */
export type AccordionVars = React.CSSProperties & Record<`--${string}`, string | number>;

export type AccordionPolicyName = "single" | "multiple" | "exclusive" | "atLeastOne";

/**
 * Clinical severity, supplied by the application.
 *
 * The component renders it and never derives it. Deciding on its own which
 * sections were urgent would make this clinical decision support, which
 * ARCHITECTURE.md §9 rules out.
 */
export type AccordionSeverity = "critical" | "high" | "low" | "normal" | "unknown";

export type AccordionHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Which part of the header activates the section. Ant Design's vocabulary. */
export type AccordionCollapsible = "header" | "icon" | "disabled";

export type AccordionPanelRole = "region" | "none" | "auto";

/** The semantic DOM surface, matching Ant Design v6's `classNames` / `styles`. */
export type AccordionSlot =
  "root" | "item" | "header" | "trigger" | "icon" | "label" | "summary" | "panel" | "body";

export interface AccessReason {
  /** Written to the audit record. Stable across locales. */
  code: string;
  /** Shown to the reader. */
  label: string;
}

export interface OpenAccess {
  kind: "open";
}

/**
 * Content that may be distressing to this reader.
 *
 * Costs nothing but a choice and records nothing. Progressive disclosure at the
 * reader's own pace is the core trauma-informed move, and the point is that the
 * reader decides — not that the content is concealed.
 */
export interface AdvisoryAccess {
  kind: "advisory";
  notice: string;
}

/** Permitted, but the access is recorded. Break-the-glass. */
export interface ReasonAccess {
  kind: "reason";
  reasons: readonly AccessReason[];
  notice?: string;
}

/** Requires a consent that is on file. The 42 CFR Part 2 case. */
export interface ConsentAccess {
  kind: "consent";
  /** The governing policy, named as the reader would recognise it. */
  policy: string;
  state: "granted" | "missing" | "expired";
  /** ISO 8601. Rendered so a lapse is visible before it happens, not after. */
  expiresAt?: string;
  notice?: string;
}

/** This reader cannot obtain it. The section still exists and says so. */
export interface WithheldAccess {
  kind: "withheld";
  reason: string;
}

export type AccessDescriptor =
  OpenAccess | AdvisoryAccess | ReasonAccess | ConsentAccess | WithheldAccess;

/** The three that stand between the reader and the content but can be passed. */
export type GatedAccess = AdvisoryAccess | ReasonAccess | ConsentAccess;

interface AccordionItemBase {
  key: React.Key;
  label: React.ReactNode;
  /**
   * What the header says while closed.
   *
   * The rule this slot exists for: if collapsing the section could change what
   * the reader does next, the header carries the fact that would change it. A
   * row reading only "Assessments" costs an interaction to learn anything, and
   * fourteen of those is a chart nobody reads.
   */
  summary?: React.ReactNode;
  /** Trailing content outside the trigger — a control, not a label. */
  extra?: React.ReactNode;
  severity?: AccordionSeverity;
  /**
   * Renders open and cannot be closed.
   *
   * The crisis step of a safety plan. A person opening that at 2am should reach
   * a phone number without making a single correct decision about a chevron.
   */
  pinned?: boolean;
  showArrow?: boolean;
  /** Mount the content before first open. Off by default; a long chart pays for it. */
  forceRender?: boolean;
  collapsible?: AccordionCollapsible;
  /** ISO 8601 with offset. Precision is preserved, never widened. */
  updatedAt?: string;
  classNames?: Partial<Record<AccordionSlot, string>>;
  styles?: Partial<Record<AccordionSlot, React.CSSProperties>>;
}

/**
 * An item, with the withheld case made structural.
 *
 * `children?: never` on the withheld arm is the whole point: content the reader
 * may not have cannot be passed at all, so it never reaches the bundle. A
 * runtime guard would still ship the string.
 */
export type AccordionItem =
  | (AccordionItemBase & { access?: OpenAccess | GatedAccess; children?: React.ReactNode })
  | (AccordionItemBase & { access: WithheldAccess; children?: never });

/** What the application receives when a reader asks to see gated content. */
export interface DisclosureEvent {
  key: React.Key;
  access: GatedAccess;
  /** Present for `kind: "reason"`. The code, never the label. */
  reasonCode?: string;
  /** ISO 8601 with offset. A bare local time is ambiguous by up to a day. */
  at: string;
}

/* ------------------------------------------------------------------ */
/* Policies                                                            */
/* ------------------------------------------------------------------ */

export type AccordionPolicy = (open: ReadonlySet<React.Key>, key: React.Key) => Set<React.Key>;

function toggled(open: ReadonlySet<React.Key>, key: React.Key): Set<React.Key> {
  const next = new Set(open);
  if (!next.delete(key)) next.add(key);
  return next;
}

/**
 * Every mode the component supports, and nothing else.
 *
 * Pure functions over a set: no React, no DOM, no items. That is what makes
 * them exhaustively testable without rendering anything.
 */
export const ACCORDION_POLICIES: Readonly<Record<AccordionPolicyName, AccordionPolicy>> = {
  multiple: (open, key) => toggled(open, key),
  single: (open, key) => (open.has(key) ? new Set() : new Set([key])),
  /** Opens, and never closes by activation. One section is always showing. */
  exclusive: (_open, key) => new Set([key]),
  /** Closing the last open section is refused rather than ignored silently. */
  atLeastOne: (open, key) =>
    open.has(key) && open.size === 1 ? new Set(open) : toggled(open, key),
};

export function pinnedKeys(items: readonly AccordionItem[]): Set<React.Key> {
  return new Set(items.filter((item) => item.pinned).map((item) => item.key));
}

/**
 * The one place open-ness is decided.
 *
 * Pinning is a filter applied after the policy rather than a branch inside it,
 * so a pinned item is simply one the policy is not permitted to remove. Four
 * policies plus one rule, with no combinatorial cases between them.
 */
export function resolveOpenKeys(
  base: ReadonlySet<React.Key>,
  items: readonly AccordionItem[],
): Set<React.Key> {
  const next = new Set(base);
  for (const key of pinnedKeys(items)) next.add(key);
  return next;
}

/** Ant Design accepts a key, an array, or nothing. All three arrive here. */
export function normalizeKeys(value: React.Key | readonly React.Key[] | undefined): React.Key[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? [...value] : [value as React.Key];
}

export function accessOf(item: AccordionItem): AccessDescriptor {
  return item.access ?? { kind: "open" };
}

export function isWithheld(item: AccordionItem): boolean {
  return accessOf(item).kind === "withheld";
}

/** True when the reader must do something before the content is revealed. */
export function isGated(item: AccordionItem): boolean {
  const kind = accessOf(item).kind;
  return kind === "advisory" || kind === "reason" || kind === "consent";
}

/**
 * Whether activating this header may change anything.
 *
 * Withheld and pinned both land here, for opposite reasons: one has nothing to
 * show, the other must never stop showing it. Both still render a focusable
 * trigger that reports itself disabled, because a control that silently ignores
 * a press is worse than one that explains itself.
 */
export function isInert(item: AccordionItem): boolean {
  return isWithheld(item) || item.pinned === true || item.collapsible === "disabled";
}

/* ------------------------------------------------------------------ */
/* Locale                                                              */
/* ------------------------------------------------------------------ */

/**
 * Every user-visible string the behaviour layer needs.
 *
 * Patient-facing and clinician-facing wording are different catalogs rather
 * than different tones of one string (CONTENT.md §7), so these are defaults a
 * product replaces — not a formality setting. English is the fallback because a
 * missing translation must degrade to words, never to a key.
 */
export interface AccordionLocale {
  /** Announced on the trigger of a section that cannot be closed. */
  pinnedHint: string;
  withheldLabel: string;
  advisoryConfirm: string;
  advisoryDismiss: string;
  /** Heading on a reason gate that supplied no notice of its own. */
  reasonTitle: string;
  reasonLegend: string;
  reasonConfirm: string;
  consentOpen: string;
  consentRequest: string;
  consentGranted: string;
  consentMissing: string;
  consentExpired: string;
  consentExpires: (date: string) => string;
  recorded: string;
  working: string;
  refused: string;
  expandAll: string;
  collapseAll: string;
}

export const DEFAULT_ACCORDION_LOCALE: AccordionLocale = {
  pinnedHint: "Always open",
  withheldLabel: "Restricted — not shown",
  advisoryConfirm: "Show it",
  advisoryDismiss: "Not now",
  reasonTitle: "Opening this needs a reason",
  reasonLegend: "Reason for access",
  reasonConfirm: "Open and record",
  consentOpen: "Open",
  consentRequest: "Request consent",
  consentGranted: "Consent on file",
  consentMissing: "No consent on file covers this",
  consentExpired: "The consent covering this has expired",
  consentExpires: (date) => `Consent expires ${date}`,
  recorded: "Opening this is recorded against your account.",
  working: "Checking…",
  // Names what failed and whether what is on screen is complete — CONTENT.md §5.
  refused: "This section was not opened. Nothing else on this page is affected.",
  expandAll: "Expand all",
  collapseAll: "Collapse all",
};

/* ------------------------------------------------------------------ */
/* Controlled / uncontrolled                                           */
/* ------------------------------------------------------------------ */

/**
 * One implementation for both. The controlled value wins when supplied, and
 * the internal state keeps updating underneath so a component that stops being
 * controlled does not jump back to its initial value.
 */
function useControllableSet(
  controlled: React.Key[] | undefined,
  initial: React.Key[],
): [ReadonlySet<React.Key>, (next: Set<React.Key>) => Set<React.Key>] {
  const [internal, setInternal] = React.useState<Set<React.Key>>(() => new Set(initial));

  // A fresh Set each render would be a new identity every time; the join is
  // stable, so the memo actually holds.
  const controlledKey = controlled ? controlled.join(" ") : undefined;
  const resolved = React.useMemo(
    () => (controlled ? new Set(controlled) : internal),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- controlledKey is the stable identity of `controlled`
    [controlledKey, controlled ? undefined : internal],
  );

  const commit = React.useCallback((next: Set<React.Key>) => {
    setInternal(next);
    return next;
  }, []);

  return [resolved, commit];
}

/* ------------------------------------------------------------------ */
/* useAccordion                                                        */
/* ------------------------------------------------------------------ */

export interface UseAccordionOptions {
  items: readonly AccordionItem[];
  policy?: AccordionPolicyName;
  activeKey?: React.Key | readonly React.Key[];
  defaultActiveKey?: React.Key | readonly React.Key[];
  onChange?: (keys: React.Key[]) => void;
  headingLevel?: AccordionHeadingLevel;
  panelRole?: AccordionPanelRole;
  /**
   * Make collapsed content reachable by find-in-page and fragment navigation.
   *
   * On by default. A clinician pressing Ctrl+F for "clozapine" and getting no
   * match concludes the chart does not mention it, which is a wrong answer to a
   * medication question rather than a usability complaint.
   */
  findable?: boolean;
  onDisclose?: (event: DisclosureEvent) => boolean | Promise<boolean>;
  /**
   * Injectable clock.
   *
   * A disclosure event carries the time it happened, and a component that reads
   * the wall clock directly cannot be tested for it. Defaults to now, in ISO
   * 8601 with offset.
   */
  now?: () => string;
  /** Prefix for generated ids. Defaults to a React-generated unique value. */
  idPrefix?: string;
}

export interface AccordionApi {
  openKeys: React.Key[];
  isOpen: (key: React.Key) => boolean;
  /** Whether the content itself is showing, as opposed to a gate explaining it. */
  isDisclosed: (key: React.Key) => boolean;
  /** A disclosure request is in flight for this key. */
  isPending: (key: React.Key) => boolean;
  /** The last request for this key resolved false. */
  isRefused: (key: React.Key) => boolean;
  toggle: (key: React.Key) => void;
  open: (key: React.Key) => void;
  close: (key: React.Key) => void;
  /** Never opens a withheld section — there is nothing behind it. */
  openAll: () => void;
  closeAll: () => void;
  requestDisclosure: (key: React.Key, reasonCode?: string) => Promise<boolean>;
  headingLevel: AccordionHeadingLevel;
  getHeadingProps: (item: AccordionItem) => React.HTMLAttributes<HTMLElement> & { key?: undefined };
  getTriggerProps: (item: AccordionItem) => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    ref: (node: HTMLButtonElement | null) => void;
  };
  getPanelProps: (item: AccordionItem) => React.HTMLAttributes<HTMLDivElement> & {
    ref: (node: HTMLDivElement | null) => void;
  };
}

const KEY_NAV = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);

export function useAccordion(options: UseAccordionOptions): AccordionApi {
  const {
    items,
    policy = "multiple",
    activeKey,
    defaultActiveKey,
    onChange,
    headingLevel = 3,
    panelRole = "auto",
    findable = true,
    onDisclose,
    now,
    idPrefix,
  } = options;

  const reactId = React.useId();
  const base = idPrefix ?? `ox-acc-${reactId.replace(/:/g, "")}`;

  const controlled = activeKey === undefined ? undefined : normalizeKeys(activeKey);
  const [rawOpen, commit] = useControllableSet(controlled, normalizeKeys(defaultActiveKey));

  const openSet = React.useMemo(() => resolveOpenKeys(rawOpen, items), [rawOpen, items]);

  const [granted, setGranted] = React.useState<Set<React.Key>>(() => new Set());
  const [pending, setPending] = React.useState<Set<React.Key>>(() => new Set());
  const [refused, setRefused] = React.useState<Set<React.Key>>(() => new Set());

  const triggerRefs = React.useRef(new Map<React.Key, HTMLButtonElement>());
  const panelRefs = React.useRef(new Map<React.Key, HTMLDivElement>());

  const itemsRef = React.useRef(items);
  itemsRef.current = items;

  const byKey = React.useMemo(() => {
    const map = new Map<React.Key, AccordionItem>();
    for (const item of items) map.set(item.key, item);
    return map;
  }, [items]);

  /**
   * `role="region"` on every panel, but only up to six.
   *
   * APG asks for the landmark and then says to avoid it when more than roughly
   * six panels can be expanded at once, because past that a screen reader's
   * landmark list stops being navigation and becomes noise. A fourteen-section
   * chart in multi-open mode is exactly that case. Almost nobody implements the
   * second half of the rule.
   */
  const useRegion = React.useMemo(() => {
    if (panelRole === "region") return true;
    if (panelRole === "none") return false;
    const simultaneous = policy === "single" || policy === "exclusive" ? 1 : items.length;
    return simultaneous <= 6;
  }, [panelRole, policy, items.length]);

  const apply = React.useCallback(
    (nextRaw: Set<React.Key>) => {
      const next = resolveOpenKeys(nextRaw, itemsRef.current);
      commit(nextRaw);
      onChange?.([...next]);
    },
    [commit, onChange],
  );

  const setOpenState = React.useCallback(
    (key: React.Key, want: "open" | "close" | "toggle") => {
      const item = byKey.get(key);
      if (!item || isWithheld(item) || item.pinned) return;
      if (item.collapsible === "disabled") return;

      const isCurrentlyOpen = openSet.has(key);
      if (want === "open" && isCurrentlyOpen) return;
      if (want === "close" && !isCurrentlyOpen) return;

      apply(ACCORDION_POLICIES[policy](rawOpen, key));
    },
    [apply, byKey, openSet, policy, rawOpen],
  );

  const toggle = React.useCallback((key: React.Key) => setOpenState(key, "toggle"), [setOpenState]);
  const open = React.useCallback((key: React.Key) => setOpenState(key, "open"), [setOpenState]);
  const close = React.useCallback((key: React.Key) => setOpenState(key, "close"), [setOpenState]);

  const openAll = React.useCallback(() => {
    // A withheld section has nothing behind it, so "expand all" must not
    // pretend otherwise — and must not fire a disclosure for a gated one.
    apply(new Set(items.filter((item) => !isWithheld(item)).map((item) => item.key)));
  }, [apply, items]);

  const closeAll = React.useCallback(() => apply(new Set()), [apply]);

  const requestDisclosure = React.useCallback(
    async (key: React.Key, reasonCode?: string): Promise<boolean> => {
      const item = byKey.get(key);
      if (!item) return false;
      const access = accessOf(item);
      if (access.kind === "open") return true;
      if (access.kind === "withheld") return false;

      const event: DisclosureEvent = {
        key,
        access,
        ...(reasonCode === undefined ? {} : { reasonCode }),
        // eslint-disable-next-line no-restricted-syntax -- The audit clock, not a render input. This runs in an event handler, so it costs no render determinism, and a disclosure timestamped with anything other than the real time is a falsified access record. `now` exists so tests and VRT can pin it.
        at: now ? now() : new Date().toISOString(),
      };

      setRefused((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setPending((prev) => new Set(prev).add(key));

      let allowed: boolean;
      try {
        // No handler means the product has not wired a policy yet. Refusing is
        // the safe default: a gate that opens itself is not a gate. A handler
        // that throws is a refusal too — an error in a consent lookup must not
        // fall through to disclosure.
        allowed = onDisclose ? await onDisclose(event) : false;
      } catch {
        allowed = false;
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }

      if (allowed) setGranted((prev) => new Set(prev).add(key));
      else setRefused((prev) => new Set(prev).add(key));

      return allowed;
    },
    [byKey, now, onDisclose],
  );

  /**
   * Find-in-page and fragment navigation reveal the section.
   *
   * React has no synthetic `beforematch`, so this is wired by hand. A gated
   * item still opens to its gate — the browser has found a word inside content
   * that is not rendered yet, which cannot happen, so in practice this only
   * fires for sections whose content is already disclosed.
   */
  React.useEffect(() => {
    const nodes = panelRefs.current;
    const listeners: Array<[HTMLDivElement, () => void]> = [];

    for (const [key, node] of nodes) {
      const handler = () => open(key);
      node.addEventListener("beforematch", handler);
      listeners.push([node, handler]);
    }

    return () => {
      for (const [node, handler] of listeners) node.removeEventListener("beforematch", handler);
    };
  }, [open, items]);

  /**
   * React cannot express `hidden="until-found"`.
   *
   * `hidden` is a boolean attribute in React's DOM layer, so React 19 serialises
   * `hidden="until-found"` as `hidden=""` — verified against react-dom 19.2,
   * both in `renderToString` and on the client. The attribute is therefore
   * upgraded after commit.
   *
   * Rendering `hidden` as a boolean first is deliberate rather than a
   * workaround: it is what makes the server-rendered markup correct. A panel
   * that only became hidden after hydration would flash a whole expanded chart
   * on first paint. Between commit and this effect the panel carries `hidden=""`
   * — still hidden, still out of the accessibility tree, just not yet findable.
   *
   * React does not re-touch an attribute whose prop did not change, so the
   * upgraded value survives every re-render in which the panel stays closed.
   */
  React.useEffect(() => {
    if (!findable) return;
    for (const [, node] of panelRefs.current) {
      if (node.hasAttribute("hidden") && node.getAttribute("hidden") !== "until-found") {
        node.setAttribute("hidden", "until-found");
      }
    }
  });

  const navigableKeys = React.useMemo(() => items.map((item) => item.key), [items]);

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, key: React.Key) => {
      if (!KEY_NAV.has(event.key)) return;
      const index = navigableKeys.indexOf(key);
      if (index < 0) return;

      const last = navigableKeys.length - 1;
      const target =
        event.key === "ArrowDown"
          ? navigableKeys[index === last ? 0 : index + 1]
          : event.key === "ArrowUp"
            ? navigableKeys[index === 0 ? last : index - 1]
            : event.key === "Home"
              ? navigableKeys[0]
              : navigableKeys[last];

      const node = target === undefined ? undefined : triggerRefs.current.get(target);
      if (!node) return;
      // Moving focus is navigation, not activation: arrow keys never toggle.
      event.preventDefault();
      node.focus();
    },
    [navigableKeys],
  );

  const idsFor = React.useCallback(
    (item: AccordionItem) => {
      const index = items.indexOf(item);
      // Position rather than key: a key may be any string, and ids that end up
      // in aria-controls have to be usable in an attribute value.
      const suffix = index >= 0 ? index : 0;
      return { trigger: `${base}-t${suffix}`, panel: `${base}-p${suffix}` };
    },
    [base, items],
  );

  const isOpen = React.useCallback((key: React.Key) => openSet.has(key), [openSet]);

  const isDisclosed = React.useCallback(
    (key: React.Key) => {
      const item = byKey.get(key);
      if (!item) return false;
      if (isWithheld(item)) return false;
      if (!isGated(item)) return true;
      return granted.has(key);
    },
    [byKey, granted],
  );

  const getHeadingProps = React.useCallback(
    (item: AccordionItem) => ({
      // A real heading element carries role and level implicitly. Stated here
      // as data for the renderer, which picks h1–h6 from `headingLevel`.
      "data-ox-accordion-heading": String(headingLevel),
      className: item.classNames?.header,
      style: item.styles?.header,
    }),
    [headingLevel],
  );

  const getTriggerProps = React.useCallback(
    (item: AccordionItem) => {
      const ids = idsFor(item);
      const expanded = openSet.has(item.key);
      const inert = isInert(item);

      return {
        id: ids.trigger,
        type: "button" as const,
        "aria-expanded": expanded,
        "aria-controls": ids.panel,
        // APG sets this only when the panel is visible and cannot be collapsed.
        // A withheld trigger is disabled for the opposite reason — there is
        // nothing to show — and both still take focus, so a keyboard user hears
        // the label rather than tabbing past a dead row.
        ...(inert ? { "aria-disabled": true as const } : {}),
        className: item.classNames?.trigger,
        style: item.styles?.trigger,
        onClick: () => {
          if (inert) return;
          toggle(item.key);
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) =>
          onTriggerKeyDown(event, item.key),
        ref: (node: HTMLButtonElement | null) => {
          if (node) triggerRefs.current.set(item.key, node);
          else triggerRefs.current.delete(item.key);
        },
      };
    },
    [idsFor, onTriggerKeyDown, openSet, toggle],
  );

  const getPanelProps = React.useCallback(
    (item: AccordionItem) => {
      const ids = idsFor(item);
      const expanded = openSet.has(item.key);

      return {
        id: ids.panel,
        // A withheld panel is never labelled as a region: there is no content
        // for a landmark to point at, and an empty landmark is a dead end in
        // the rotor.
        ...(useRegion && !isWithheld(item)
          ? { role: "region" as const, "aria-labelledby": ids.trigger }
          : {}),
        // Boolean now, upgraded to "until-found" after commit. See the effect.
        ...(expanded ? {} : { hidden: true as const }),
        className: item.classNames?.panel,
        style: item.styles?.panel,
        ref: (node: HTMLDivElement | null) => {
          if (node) panelRefs.current.set(item.key, node);
          else panelRefs.current.delete(item.key);
        },
      };
    },
    [idsFor, openSet, useRegion],
  );

  return {
    openKeys: React.useMemo(() => [...openSet], [openSet]),
    isOpen,
    isDisclosed,
    isPending: React.useCallback((key: React.Key) => pending.has(key), [pending]),
    isRefused: React.useCallback((key: React.Key) => refused.has(key), [refused]),
    toggle,
    open,
    close,
    openAll,
    closeAll,
    requestDisclosure,
    headingLevel,
    getHeadingProps,
    getTriggerProps,
    getPanelProps,
  };
}

/* ------------------------------------------------------------------ */
/* useDisclosure                                                       */
/* ------------------------------------------------------------------ */

export interface UseDisclosureOptions extends Omit<
  UseAccordionOptions,
  "items" | "policy" | "activeKey" | "defaultActiveKey"
> {
  item: AccordionItem;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * One section, standing alone.
 *
 * Separate from `useAccordion` because the single and the many are genuinely
 * different components — a lone disclosure has no sibling navigation, no policy,
 * and no landmark-count question. It is the same state machine with a set of
 * one, which is why it is a wrapper rather than a second implementation.
 */
export function useDisclosure(options: UseDisclosureOptions) {
  const { item, open: controlled, defaultOpen, onOpenChange, ...rest } = options;

  const items = React.useMemo(() => [item], [item]);

  const api = useAccordion({
    ...rest,
    items,
    policy: "multiple",
    ...(controlled === undefined ? {} : { activeKey: controlled ? [item.key] : [] }),
    ...(defaultOpen ? { defaultActiveKey: [item.key] } : {}),
    onChange: (keys) => onOpenChange?.(keys.includes(item.key)),
  });

  return {
    ...api,
    open: api.isOpen(item.key),
    toggle: () => api.toggle(item.key),
    show: () => api.open(item.key),
    hide: () => api.close(item.key),
    disclosed: api.isDisclosed(item.key),
    pending: api.isPending(item.key),
    refused: api.isRefused(item.key),
    headingProps: api.getHeadingProps(item),
    triggerProps: api.getTriggerProps(item),
    panelProps: api.getPanelProps(item),
    request: (reasonCode?: string) => api.requestDisclosure(item.key, reasonCode),
  };
}
