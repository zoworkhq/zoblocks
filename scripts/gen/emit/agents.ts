/**
 * Emits llms.txt — the catalog in a form a coding agent can read in one fetch.
 *
 * For a source-distributed library this is a real distribution channel rather
 * than a novelty: agents install components on a developer's behalf, and an
 * agent that cannot tell which component handles a restricted record will
 * reach for the wrong one. The catalog is already structured data, so this
 * costs one emitter.
 */

import { distributionState, installCommandFor } from "@zoblocks/component-meta";
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
          const state = distributionState(c.meta.name);

          /*
           * Only a documented component gets a link.
           *
           * This emitted a canonical URL for every component in the catalogue,
           * and sixteen of the thirty returned 404 — on the one file written
           * specifically to be read by an answer engine. A model that follows
           * a dead link either drops the entity or cites the 404, and both are
           * worse than an entry with no link.
           *
           * The entry stays either way. Knowing a component is announced is
           * useful to an agent choosing between building something and waiting
           * for it; a URL that does not resolve is not.
           */
          const heading =
            state === "ready"
              ? `- [${c.meta.title}](${HOMEPAGE}/components/${c.meta.name}): ${c.meta.summary}`
              : `- ${c.meta.title}: ${c.meta.summary}`;

          return [
            heading,
            state === "announced"
              ? "  availability: announced — nothing to install yet"
              : `  install: ${installCommandFor(c.meta)}`,
            state === "installable"
              ? "  docs: no page yet — this component installs from the registry today"
              : undefined,
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

  const content = `# ZoBlocks

> React components for healthcare interfaces, typed to FHIR R4 and delivered as
> source through the ZoBlocks registry. Components take FHIR resources as props
> directly and render absence, preliminary status, restricted records, and
> critical results as explicit states rather than as blanks.

ZoBlocks is not a compliance boundary, not a medical device, and not clinical
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
