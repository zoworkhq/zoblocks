/**
 * Emits tsconfig.generated.json — the path mappings that let registry source
 * typecheck in this repository without being edited.
 *
 * Registry components import each other the way they will be laid out in a
 * consumer's project ("@/components/oxygen/absent-value"), because that is what
 * the shadcn CLI writes. Those specifiers have to resolve here too.
 *
 * This file used to be maintained by hand in the root tsconfig, with a comment
 * asking authors to add a mapping per component. Four were missing when the
 * generator was written — clinical-value, patient-snapshot (twice), and
 * vitals-panel all imported siblings that did not resolve — and nothing
 * reported it, because no workspace task typechecked that config. Generating
 * the mappings makes that class of failure impossible.
 *
 * Phase 1 reverses the import direction (see ADR 0002): source will use real
 * package specifiers and the registry generator will rewrite them on the way
 * out, at which point this file shrinks to the workspace aliases.
 */

import { banner, paths } from "../config";
import type { LoadedComponent } from "../load";
import type { Emitter } from "../write";

const WORKSPACE_ALIASES: Record<string, string[]> = {
  "@oxygenui/fhir": ["./packages/fhir/src/index.ts"],
  "@oxygenui/fixtures": ["./packages/fixtures/src/index.ts"],
  "@oxygenui/component-meta": ["./packages/component-meta/src/index.ts"],
  "@/lib/utils": ["./registry/oxygen/lib/utils.ts"],
};

export async function emitTsconfigPaths(
  components: LoadedComponent[],
  emitter: Emitter,
): Promise<void> {
  const mappings: Record<string, string[]> = { ...WORKSPACE_ALIASES };

  for (const component of components) {
    mappings[component.consumerSpecifier] = [`./${component.sourcePath.split("\\").join("/")}`];
  }

  const ordered = Object.fromEntries(Object.entries(mappings).sort(([a], [b]) => a.localeCompare(b)));

  await emitter.emit(
    paths.tsconfigPaths,
    `${JSON.stringify(
      {
        $schema: "https://json.schemastore.org/tsconfig",
        display: "Oxygen generated path mappings",
        _generated: banner("//").split("\n").map((l) => l.replace(/^\/\/ ?/, "")),
        compilerOptions: {
          baseUrl: ".",
          paths: ordered,
        },
      },
      null,
      2,
    )}`,
  );
}
