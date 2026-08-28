"use client";

/**
 * `Tabs.Root` — selection, the gate, and the trigger registry.
 *
 * It renders one element and no behaviour of its own. Everything visible
 * belongs to `Tabs.List`, `Tabs.Trigger` and `Tabs.Panel`, which is what makes
 * a host able to put a toolbar between the strip and the panels without
 * reaching into the component.
 */

import * as React from "react";
import {
  canEnterStep,
  createChangeGate,
  formatProblems,
  indexOfValue,
  initialValue,
  resolveAdapter,
  resolveIndicator,
  rolesFor,
  validateTabsConfig,
  type Activation,
  type AuditEvent,
  type BeforeChange,
  type ChangeSource,
  type FillMode,
  type IndicatorKind,
  type MountStrategy,
  type Orientation,
  type OverflowStrategy,
  type SemanticMode,
  type SyncTarget,
  type TabItem,
  type TabSize,
  type TabVariant,
  type TabsLocale,
  type TransitionKind,
} from "@oxygenui-design/tabs-core";
import {
  TabsContext,
  ValidatedByParent,
  type RegisteredTrigger,
  type TabsContextValue,
} from "./context.js";
import { useTabsLocale } from "./locale.js";
import {
  REGISTRY_UNRELIABLE,
  runWithTransition,
  useBaseId,
  useControllableValue,
  useTabsHotkeys,
  useValidateConfig,
} from "./internal.js";

const VALID_MODES = new Set<SemanticMode>(["tabs", "nav", "radiogroup", "steps"]);

/** Stable empty list, so the skip path does not churn the effect deps. */
const EMPTY_ITEMS: readonly TabItem[] = [];

export interface TabsEditable {
  onClose?: (value: string) => void;
  onAdd?: () => void;
  onReorder?: (from: number, to: number) => void;
}

export interface TabsRootProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * What this control *is*. Required, with no default — see
   * `validateTabsConfig`. A view switch, a link list, a form value and a
   * wizard share one silhouette and need four different accessibility trees.
   */
  as: SemanticMode;
  /**
   * Visual skin. Eleven of them share one keyboard model and one accessibility tree, so this
   * changes appearance and nothing else.
   */
  variant?: TabVariant;
  /** The selected tab, controlled. Pair with `onChange`. */
  value?: string;
  /** The initially selected tab, uncontrolled. Defaults to the first enabled item. */
  defaultValue?: string;
  /**
   * Fired after a change commits. `meta.via` says what caused it — pointer, keyboard, hotkey,
   * URL sync — which is what an audit trail needs and what a naive handler throws away.
   */
  onChange?: (value: string, meta: { via: ChangeSource }) => void;
  /** Return false — or a promise of false — to veto. Strip goes inert while
   *  a promise is pending. */
  onBeforeChange?: BeforeChange;
  /** Horizontal or vertical. Changes which arrow keys move selection, not merely the layout. */
  orientation?: Orientation;
  /** Trigger height and type scale. The hit area never drops below the 24px floor at any size. */
  size?: TabSize;
  /** How triggers divide the available width — natural, equal, or stretched to fill. */
  fill?: FillMode;
  /**
   * What happens when the triggers do not fit: scroll, wrap, or collapse into a menu. Never
   * truncate — a tab you cannot reach is a tab that does not exist.
   */
  overflow?: OverflowStrategy;
  /**
   * Whether arrowing to a tab selects it (`automatic`) or merely focuses it (`manual`). Use
   * `manual` when selecting is expensive or destructive.
   */
  activation?: Activation;
  /**
   * When panels enter the DOM: all at once, on first selection, or only while selected.
   * `eager` costs bytes; `unmount` costs panel state.
   */
  mount?: MountStrategy;
  /**
   * Restore each panel's scroll position when it is selected again. Off by default, because on
   * a clinical surface returning to where somebody was is sometimes wrong.
   */
  keepScroll?: boolean;
  /**
   * The mark showing which tab is selected — an underline, a pill, or none. Never the only
   * cue: selection is also in the accessibility tree.
   */
  indicator?: IndicatorKind;
  /** How panels change. Respects `prefers-reduced-motion` regardless of what is set here. */
  transition?: TransitionKind;
  /**
   * Allows tabs to be added and closed, and supplies the handlers for it. Omit for a fixed
   * strip.
   */
  editable?: TabsEditable;
  /**
   * Mirror the selection into the URL — a query parameter or the hash — so a tab can be linked
   * to and survives a reload.
   */
  syncTo?: SyncTarget;
  /** The parameter name used by `syncTo`. Required when two tab strips sync on one page. */
  syncKey?: string;
  /**
   * Whether a change replaces the history entry or pushes a new one. `push` makes Back step
   * through tabs, which is usually not what a reader means by Back.
   */
  syncHistory?: "replace" | "push";
  /**
   * Ctrl/Cmd + 1…9 to jump to a tab. Off by default: on Windows and Linux
   * those belong to the browser, and claiming them takes a shortcut the user
   * already had for something else.
   */
  hotkeys?: boolean;
  /**
   * Above ~40 triggers, observe the list rather than every trigger.
   *
   * Never removes a trigger from the DOM — a tablist whose children come and
   * go reports "n of m" from whatever happens to be rendered.
   */
  virtualise?: boolean;
  /**
   * Overrides for every generated string — the overflow menu, the close affordance, the count
   * announcements. Supply it for any language that is not English.
   */
  locale?: Partial<TabsLocale>;
  /**
   * Selection changes as structured events, for hosts that must record which view a clinician
   * was looking at. Pair with `now`.
   */
  onAuditEvent?: (event: AuditEvent) => void;
  /**
   * Supplies the ISO timestamp on audit events. Omit it and events carry no
   * `at` — the component does not read the clock.
   */
  now?: () => string;
  /** Supplied to make ids deterministic in snapshot tests. */
  id?: string;
  children?: React.ReactNode;
}

export const TabsRoot = React.forwardRef<HTMLDivElement, TabsRootProps>(function TabsRoot(
  {
    as: mode,
    variant = "underline",
    value: controlledValue,
    defaultValue,
    onChange,
    onBeforeChange,
    orientation = "horizontal",
    size,
    fill = "none",
    overflow = "scroll",
    activation = "automatic",
    mount = "lazy-once",
    keepScroll = true,
    indicator = "auto",
    transition = "slide",
    editable,
    syncTo = false,
    syncKey = "tab",
    syncHistory = "replace",
    hotkeys = false,
    virtualise = false,
    locale: localeOverrides,
    onAuditEvent,
    now,
    id,
    className,
    children,
    ...rest
  },
  forwardedRef,
) {
  const baseId = useBaseId(id);

  /*
   * Checked during render, not in an effect.
   *
   * Everything downstream reads the role table, so a missing or unknown mode
   * would otherwise surface as "Cannot read properties of undefined" from
   * somewhere unrelated — throwing away the one message in this package most
   * worth reading. Thrown in production too: it is only reachable by
   * bypassing TypeScript, and a clear failure beats a confusing one.
   */
  if (!mode || !VALID_MODES.has(mode)) {
    throw new Error(formatProblems(validateTabsConfig({ mode: undefined, items: [] })));
  }

  const roles = rolesFor(mode);
  const locale = useTabsLocale(localeOverrides);

  const triggers = React.useRef<RegisteredTrigger[]>([]);
  const [registryVersion, setRegistryVersion] = React.useState(0);
  const panelScroll = React.useRef(new Map<string, number>());
  const [visited, setVisited] = React.useState<ReadonlySet<string>>(() => new Set<string>());
  const [panels, setPanels] = React.useState<ReadonlySet<string>>(() => new Set<string>());
  const [pending, setPending] = React.useState(false);
  const [, forceMeasure] = React.useReducer((n: number) => n + 1, 0);

  const items = React.useMemo(() => {
    // `registryVersion` really is the dependency. The registry is a ref, so
    // its contents change without React observing anything; the version is how
    // a change announces itself. Referencing it here keeps that honest rather
    // than silencing the exhaustive-deps rule.
    void registryVersion;
    return triggers.current.map((entry) => entry.item);
  }, [registryVersion]);

  // When the declarative `Tabs` is driving, it has already checked these at
  // render time — earlier, more completely, and on the server too.
  const alreadyValidated = React.useContext(ValidatedByParent);
  useValidateConfig(
    {
      mode,
      items: alreadyValidated ? EMPTY_ITEMS : items,
      overflow: alreadyValidated ? undefined : overflow,
      orientation,
      value: alreadyValidated ? undefined : controlledValue,
      defaultValue: alreadyValidated ? undefined : defaultValue,
      hasCloseHandler: Boolean(editable?.onClose),
    },
    { ignore: REGISTRY_UNRELIABLE },
  );

  const [value, setValue] = useControllableValue<string>({
    value: controlledValue,
    defaultValue: defaultValue ?? undefined,
    onChange: onChange ? (next, via) => onChange(next, { via }) : undefined,
  });

  // Read through a ref so the gate is not rebuilt when the prop changes.
  const transitionRef = React.useRef(transition);
  transitionRef.current = transition;

  const auditRef = React.useRef(onAuditEvent);
  auditRef.current = onAuditEvent;
  const nowRef = React.useRef(now);
  nowRef.current = now;
  const audit = React.useCallback((event: Omit<AuditEvent, "at">) => {
    // The clock is the host's. Reading it here would make every audit
    // assertion time-dependent and every visual-regression run
    // non-deterministic — the same reason `Signature` takes `now` as a prop.
    const at = nowRef.current?.();
    auditRef.current?.(at ? { ...event, at } : event);
  }, []);

  const gate = React.useMemo(
    () =>
      createChangeGate({
        onBeforeChange,
        onCommit: (next, source) => {
          runWithTransition(transitionRef.current === "view", () => setValue(next, source));
          setVisited((current) => {
            if (current.has(next)) return current;
            const copy = new Set(current);
            copy.add(next);
            return copy;
          });
          audit({ type: "tabs.change", value: next });
        },
        onPendingChange: setPending,
      }),
    // `onBeforeChange` is read through the closure at request time by design:
    // recreating the gate on every render would drop an in-flight veto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setValue, audit],
  );

  // Arm on mount, disarm on unmount — and arm *again* if StrictMode remounts
  // us, which is the whole reason `activate` exists.
  React.useEffect(() => {
    gate.activate();
    return () => gate.dispose();
  }, [gate]);

  // Uncontrolled instances need a starting value once triggers have
  // registered — before that, `items` is empty and there is nothing to pick.
  React.useEffect(() => {
    if (controlledValue !== undefined) return;
    if (value !== undefined) return;
    if (items.length === 0) return;
    const first = initialValue(items, defaultValue);
    if (first !== undefined) setValue(first, "programmatic");
  }, [controlledValue, value, items, defaultValue, setValue]);

  React.useEffect(() => {
    gate.sync(value);
    if (value !== undefined) {
      setVisited((current) => {
        if (current.has(value)) return current;
        const copy = new Set(current);
        copy.add(value);
        return copy;
      });
    }
  }, [gate, value]);

  /* ---------------- URL sync ---------------------------------------- */
  const adapter = React.useMemo(
    () => resolveAdapter(syncTo, syncKey, typeof window === "undefined" ? undefined : window),
    [syncTo, syncKey],
  );

  const selectRef = React.useRef<(v: string, s: ChangeSource, i?: TabItem) => void>(() => {});

  React.useEffect(() => {
    if (syncTo === false) return;
    const initial = adapter.read();
    if (initial !== undefined && initial !== value) {
      selectRef.current(initial, "url");
    }
    return adapter.subscribe((next) => {
      if (next !== undefined) selectRef.current(next, "url");
    });
    // Runs once per adapter: re-running on every value change would fight the
    // user's own navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter, syncTo]);

  React.useEffect(() => {
    if (syncTo === false || value === undefined) return;
    if (adapter.read() === value) return;
    adapter.write(value, { replace: syncHistory === "replace" });
  }, [adapter, syncTo, syncHistory, value]);

  /* ---------------- selection --------------------------------------- */
  const select = React.useCallback(
    (next: string, source: ChangeSource, item?: TabItem) => {
      const list = triggers.current.map((entry) => entry.item);
      const resolved = item ?? list.find((candidate) => candidate.value === next);

      if (resolved?.disabled) {
        audit({
          type:
            resolved.availability === "unavailable"
              ? "tabs.restricted-attempt"
              : "tabs.disabled-attempt",
          value: next,
          detail: resolved.disabledReason,
        });
        return;
      }

      // Steps: backwards is free, forwards is earned. Locking completed steps
      // is the classic wizard mistake — it forces a restart to fix a typo.
      if (mode === "steps") {
        const from = indexOfValue(list, value);
        const to = indexOfValue(list, next);
        if (from >= 0 && to >= 0 && !canEnterStep(list, from, to)) {
          audit({ type: "tabs.change-vetoed", value: next, from: value, detail: "step-locked" });
          return;
        }
      }

      void gate.request(next, source, resolved).then((outcome) => {
        if (outcome.status === "vetoed") {
          audit({ type: "tabs.change-vetoed", value: next, from: value });
        }
      });
    },
    [gate, mode, value, audit],
  );
  selectRef.current = select;

  const registerPanel = React.useCallback((panelValue: string) => {
    setPanels((current) => {
      if (current.has(panelValue)) return current;
      const next = new Set(current);
      next.add(panelValue);
      return next;
    });
    return () => {
      setPanels((current) => {
        if (!current.has(panelValue)) return current;
        const next = new Set(current);
        next.delete(panelValue);
        return next;
      });
    };
  }, []);

  useTabsHotkeys({
    enabled: hotkeys,
    getItems: () => triggers.current.map((entry) => entry.item),
    select: (next, source, item) => selectRef.current(next, source, item),
  });

  const register = React.useCallback((entry: RegisteredTrigger) => {
    triggers.current.push(entry);
    setRegistryVersion((n) => n + 1);
    return () => {
      const index = triggers.current.indexOf(entry);
      if (index >= 0) triggers.current.splice(index, 1);
      setRegistryVersion((n) => n + 1);
    };
  }, []);

  const onCloseTab = React.useCallback(
    (target: string) => {
      audit({ type: "tabs.close", value: target });
      editable?.onClose?.(target);
    },
    [editable, audit],
  );

  const onAddTab = React.useMemo(() => {
    if (!editable?.onAdd) return undefined;
    return () => {
      audit({ type: "tabs.add" });
      editable.onAdd?.();
    };
  }, [editable, audit]);

  const context = React.useMemo<TabsContextValue>(
    () => ({
      baseId,
      mode,
      roles,
      variant,
      orientation,
      activation,
      overflow,
      indicator,
      size,
      fill,
      mount,
      keepScroll,
      virtualise,
      locale,
      value,
      pending,
      select,
      triggers,
      register,
      registryVersion,
      visited,
      panels,
      registerPanel,
      closable: Boolean(editable?.onClose),
      onCloseTab: editable?.onClose ? onCloseTab : undefined,
      onAddTab,
      onReorderTab: editable?.onReorder,
      panelScroll,
      requestMeasure: forceMeasure,
    }),
    [
      baseId,
      mode,
      roles,
      variant,
      orientation,
      activation,
      overflow,
      indicator,
      size,
      fill,
      mount,
      keepScroll,
      virtualise,
      locale,
      value,
      pending,
      select,
      register,
      registryVersion,
      visited,
      panels,
      registerPanel,
      editable,
      onCloseTab,
      onAddTab,
    ],
  );

  return (
    <TabsContext.Provider value={context}>
      <div
        {...rest}
        ref={forwardedRef}
        className={["ox-tabs", className].filter(Boolean).join(" ")}
        data-ox-variant={variant}
        data-ox-mode={mode}
        data-ox-orientation={orientation}
        data-ox-size={size}
        data-ox-fill={fill}
        data-ox-overflow={overflow}
        data-ox-transition={transition}
        data-ox-virtualised={virtualise || undefined}
        data-ox-indicator={resolveIndicator(indicator, variant)}
        data-ox-pending={pending || undefined}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});
