/**
 * Emits the Tailwind source list.
 *
 * Tailwind resolves utilities by scanning source text, and its automatic
 * detection never sees files outside the app tree. A missing entry here does
 * not error — the component mounts and renders completely unstyled, which on a
 * clinical severity chip means the severity signal silently disappears.
 *
 * The list is generated from the component roots so that a new package cannot
 * be forgotten. It is one entry per root rather than per component, because
 * `@source` on a directory scans it recursively.
 */

import path from "node:path";
import { ROOT, banner, paths } from "../config";
import type { LoadedComponent } from "../load";
import type { Emitter } from "../write";

export async function emitTailwindSources(
  components: LoadedComponent[],
  emitter: Emitter,
): Promise<void> {
  // Distinct parent directories of every component. One today; one per
  // component package once Phase 1 splits them out.
  const roots = [
    ...new Set(components.map((c) => path.dirname(path.dirname(c.sourceFile)))),
  ].sort();

  const from = path.dirname(paths.tailwindSources);
  const directives = roots.map((root) => {
    const relative = path.relative(from, root).split(path.sep).join("/");
    return `@source "${relative}";`;
  });

  const content = `${banner("/*")}

/* Component roots scanned for Tailwind utilities.
   ${roots.map((r) => path.relative(ROOT, r)).join("\n   ")} */

${directives.join("\n")}
`;

  await emitter.emit(paths.tailwindSources, content);
}
