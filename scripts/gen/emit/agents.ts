/**
 * Emits llms.txt — the catalog in a form a coding agent can read in one fetch.
 *
 * For a source-distributed library this is a real distribution channel rather
 * than a novelty: agents install components on a developer's behalf, and an
 * agent that cannot tell which component handles a restricted record will
 * reach for the wrong one. The catalog is already structured data, so this
 * costs one emitter.
 */

import { HOMEPAGE, paths } from "../config";
import type { LoadedComponent } from "../load";
import type { Emitter } from "../write";

export async function emitAgentManifest(
  components: LoadedComponent[],
  emitter: Emitter,
): Promise<void> {
  const free = components.filter((c) => c.meta.tier === "free");

  const byLayer = new Map<string, LoadedComponent[]>();
  for (const component of free) {
    const list = byLayer.get(component.meta.layer) ?? [];
    list.push(component);
    byLayer.set(component.meta.layer, list);
  }

  const sections = ["primitive", "clinical", "pattern", "block"]
    .filter((layer) => byLayer.has(layer))
    .map((layer) => {
      const items = byLayer
        .get(layer)!
        .map((c) => {
          const fhir = c.meta.fhir.map((r) => r.name).join(", ");
          return [
            `- [${c.meta.title}](${HOMEPAGE}/components/${c.meta.name}): ${c.meta.summary}`,
            `  install: npx @oxygenui-design/cli add ${c.meta.name}`,
            fhir ? `  fhir: ${fhir}` : undefined,
            `  states: ${c.meta.states.join(", ")}`,
            `  status: ${c.meta.status}`,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n");
      return `## ${layer[0]!.toUpperCase()}${layer.slice(1)}\n\n${items}`;
    });

  const content = `# Oxygen UI

> React components for healthcare interfaces, typed to FHIR R4 and delivered as
> source through the Oxygen registry. Components take FHIR resources as props
> directly and render absence, preliminary status, restricted records, and
> critical results as explicit states rather than as blanks.

Oxygen UI is not a compliance boundary, not a medical device, and not clinical
decision support. Access control, audit, data residency, and clinical validation
remain the implementing team's responsibility.

Rules that matter when generating code with these components:

- A missing value renders as explicitly missing. Never substitute an empty
  string or a dash.
- An uninterpreted result reads "Not interpreted", never "Normal".
- Status is never conveyed by colour alone; every severity carries an icon and a
  text label.
- Never build a Tailwind class name from a variable. Tailwind resolves classes
  by scanning source text, so a template literal produces no CSS and the
  severity styling silently disappears.

${sections.join("\n\n")}

## Machine-readable catalog

- Index: ${HOMEPAGE}/r/index.json
- Item: ${HOMEPAGE}/r/{name}.json
- Coverage: ${HOMEPAGE}/r/coverage.json
`;

  await emitter.emit(paths.llmsTxt, content);
}
