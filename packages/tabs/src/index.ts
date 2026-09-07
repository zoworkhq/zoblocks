/**
 * @zoblocks/tabs — the tab system.
 *
 *     import { Tabs } from "@zoblocks/tabs";
 *     import "@zoblocks/tabs/styles.css";
 *
 *     <Tabs
 *       as="tabs"
 *       variant="segmented"
 *       aria-label="Document scope"
 *       defaultValue="personal"
 *       items={[
 *         { value: "personal", label: "Personal", children: <PersonalDocs /> },
 *         { value: "shared",   label: "Shared", count: 6, children: <SharedDocs /> },
 *       ]}
 *     />
 *
 * Two independent axes, and neither defaults to the other:
 *
 *   `as`      — what the control *is*: a view switch, navigation, a form
 *               value, or a wizard. Required. It selects the accessibility
 *               tree, the keyboard model and the event payload.
 *   `variant` — what it looks like. Eleven skins, all free to dress any mode.
 *
 * The engine underneath — `@zoblocks/tabs-core` — has no dependency on
 * React or antd, so a host on a different design system can take the keyboard
 * model and the ARIA contract without the skin.
 */

import { TabsRoot } from "./TabsRoot.js";
import { TabsList } from "./TabsList.js";
import { TabsTrigger } from "./TabsTrigger.js";
import { TabsPanel, TabsPanels } from "./TabsPanel.js";
import { Tabs as TabsBase, TabsAddButton } from "./Tabs.js";

/**
 * The declarative component, with the compound parts hung off it.
 *
 * One namespace rather than five exports so `Tabs.Trigger` reads as belonging
 * to `Tabs` at the call site — and so a host cannot accidentally import a part
 * without the root that gives it meaning.
 */
export const Tabs = Object.assign(TabsBase, {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Panel: TabsPanel,
  Panels: TabsPanels,
  AddButton: TabsAddButton,
});

export type { TabsProps, TabsItemProps } from "./Tabs.js";
export type { TabsRootProps, TabsEditable } from "./TabsRoot.js";
export type { TabsListProps } from "./TabsList.js";
export type { TabsTriggerProps } from "./TabsTrigger.js";
export type { TabsPanelProps } from "./TabsPanel.js";

export { useTabs, type UseTabsOptions, type UseTabsApi, type TriggerProps } from "./use-tabs.js";
export { useIndicator, type UseIndicatorOptions, type IndicatorState } from "./use-indicator.js";
export { useOverflow, type UseOverflowOptions, type OverflowState } from "./use-overflow.js";
export {
  DEFAULT_LOCALE,
  TabsLocaleProvider,
  useTabsLocale,
  type TabsLocale,
  type TabsLocaleProviderProps,
} from "./locale.js";

// Re-exported so a consumer never has to reach past this package for a type,
// a guard, or the URL adapters.
export {
  describeCount,
  describeTrigger,
  fitTabs,
  focusAfterClose,
  hashAdapter,
  keyToIntent,
  matchTypeahead,
  resolveIndicator,
  rolesFor,
  searchParamAdapter,
  textOf,
  validateTabsConfig,
  type Activation,
  type AuditEvent,
  type Availability,
  type ChangeSource,
  type FillMode,
  type IndicatorKind,
  type MountStrategy,
  type Orientation,
  type OverflowStrategy,
  type Problem,
  type SemanticMode,
  type StepState,
  type SyncTarget,
  type TabItem,
  type TabSize,
  type TabVariant,
  type Tone,
  type TransitionKind,
  type UrlAdapter,
} from "@zoblocks/tabs-core";
