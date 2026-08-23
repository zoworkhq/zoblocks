/**
 * The story-derived test layer for this package.
 *
 * The registry's stories are globbed by the root suite, which excludes
 * `packages/**` because every package runs its own Vitest through turbo. A
 * story here would otherwise be a file the coverage gate counts and nothing
 * executes — a worse signal than no story at all, because it reports as
 * covered. `describeStories` is the same four contracts the registry gets.
 */

import meta from "../component.meta.js";
import { describeStories, entriesFrom, type StoryModule } from "../../../test/story-suite.js";
import * as stories from "../src/tabs.stories.js";

describeStories({
  component: meta.name,
  states: meta.states,
  categories: meta.categories,
  entries: entriesFrom(meta.name, stories as unknown as StoryModule),
});
