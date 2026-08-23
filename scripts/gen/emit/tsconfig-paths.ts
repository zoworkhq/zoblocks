/**
 * Emits tsconfig.generated.json — the path mappings that let registry source
 * typecheck in this repository without being edited.
 *
 * Registry components import each other the way they will be laid out in a
 * consumer's project ("@/components/oxygen/absent-value"), because that is what
 * the Oxygen CLI writes. Those specifiers have to resolve here too.
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

/**
 * Aliases that are not derived from the component list.
 *
 * Exported because `../props.ts` typechecks component source with its own
 * in-memory compiler options and needs the same map. It used to hold a second
 * copy, and the copies drifted the moment a support module was added — the
 * generator reported "cannot find module" for a path it had just written.
 */
export const WORKSPACE_ALIASES: Record<string, string[]> = {
  "@oxygenui-design/fhir": ["./packages/fhir/src/index.ts"],
  "@oxygenui-design/fixtures": ["./packages/fixtures/src/index.ts"],
  "@oxygenui-design/component-meta": ["./packages/component-meta/src/index.ts"],
  "@/lib/utils": ["./registry/oxygen/lib/utils.ts"],
  // Support modules under registry/oxygen/lib are installed into a consumer's
  // project by the Oxygen CLI under lib/, and imported by that path. They
  // resolve here the same way component specifiers do.
  "@/lib/oxygen-loader": ["./registry/oxygen/lib/loader.tsx"],
  "@/lib/oxygen-accordion": ["./registry/oxygen/lib/accordion-core.tsx"],
  "@/lib/oxygen-switch": ["./registry/oxygen/lib/switch.tsx"],
  "@/lib/oxygen-clinical-note": ["./registry/oxygen/lib/clinical-note.tsx"],
  "@/lib/oxygen-clinical-status": ["./registry/oxygen/lib/clinical-status.ts"],
  "@/lib/timeline-core": ["./registry/oxygen/lib/timeline-core.ts"],
  "@/lib/timeline-fhir": ["./registry/oxygen/lib/timeline-fhir.ts"],
};

export async function emitTsconfigPaths(
  components: LoadedComponent[],
  emitter: Emitter,
): Promise<void> {
  const mappings: Record<string, string[]> = { ...WORKSPACE_ALIASES };

  for (const component of components) {
    mappings[component.consumerSpecifier] = [`./${component.sourcePath.split("\\").join("/")}`];
  }

  const ordered = Object.fromEntries(
    Object.entries(mappings).sort(([a], [b]) => a.localeCompare(b)),
  );

  const document = (rebase: (target: string) => string) =>
    `${JSON.stringify(
      {
        $schema: "https://json.schemastore.org/tsconfig",
        display: "Oxygen generated path mappings",
        _generated: banner("//")
          .split("\n")
          .map((l) => l.replace(/^\/\/ ?/, "")),
        compilerOptions: {
          baseUrl: ".",
          paths: Object.fromEntries(
            Object.entries(ordered).map(([specifier, targets]) => [specifier, targets.map(rebase)]),
          ),
        },
      },
      null,
      2,
    )}`;

  await emitter.emit(
    paths.tsconfigPaths,
    document((target) => target),
  );

  // The docs app sits two levels down, so every root-relative target is the
  // same path with the hops prepended. Emitted rather than hand-kept: the
  // previews import registry source directly, and a specifier the app cannot
  // resolve is a preview nobody can write.
  await emitter.emit(
    paths.docsTsconfigPaths,
    document((target) => target.replace(/^\.\//, "../../")),
  );
}
