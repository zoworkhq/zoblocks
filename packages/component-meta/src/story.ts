/**
 * Component Story Format types, without the Storybook dependency.
 *
 * ADR 0007 says a story is written once and consumed four ways: as
 * documentation, as the visual-regression fixture, as the accessibility
 * fixture, and — through play functions — as the interaction test. Three of
 * those four consumers are our own test harness, not Storybook.
 *
 * Declaring the types here rather than importing `@storybook/react` means the
 * stories are the *format* (CSF3, which Storybook reads unmodified) without
 * ~1,000 packages of dependency surface on a library whose own supply-chain
 * rule is that every dependency is a review item. Storybook can be added later
 * as a renderer; these files will not change when it is.
 *
 * The one addition to CSF is `parameters.state`, which ties a story to a state
 * declared in the component's `*.meta.ts`. That is what lets the build assert
 * the declared states are honest rather than aspirational.
 */

import type { ComponentType, ReactElement } from "react";

/** The subset of the CSF3 play-function context our harness supplies. */
export interface PlayContext {
  canvasElement: HTMLElement;
}

export interface StoryParameters {
  /**
   * The state from `meta.states` this story demonstrates.
   *
   * Checked by the build: every declared state needs a story, and every story
   * state must be declared. A component that lists "Slow wait" and never shows
   * one is documentation that cannot be trusted.
   */
  state?: string;
  /** Skip visual-regression capture — for stories that are deliberately timing-dependent. */
  skipVrt?: boolean;
  /** Skip the axe run, with a reason. Requires `a11yReason`. */
  skipA11y?: boolean;
  a11yReason?: string;
  [key: string]: unknown;
}

export interface Meta<TComponent = unknown> {
  /** `Category/Component Name` — the docs and Storybook navigation path. */
  title: string;
  component: TComponent;
  /** Args every story in the file inherits. */
  args?: Record<string, unknown>;
  parameters?: StoryParameters;
  tags?: string[];
}

export interface StoryObj<TComponent = unknown> {
  name?: string;
  args?: Record<string, unknown>;
  parameters?: StoryParameters;
  /** Overrides the default render for compositions and multi-element stories. */
  render?: (args: Record<string, unknown>) => ReactElement;
  /** Interaction test. Runs in the harness and, later, in Storybook. */
  play?: (context: PlayContext) => Promise<void> | void;
  tags?: string[];
  /** Present so `StoryObj<typeof X>` reads naturally; unused at runtime. */
  component?: TComponent extends ComponentType ? TComponent : never;
}
