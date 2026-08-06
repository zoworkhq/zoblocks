/**
 * Emits the docs catalog.
 *
 * Replaces a 1,469-line hand-written file that restated every component's props
 * in prose. Guidance, limitations, and clinical rationale still come from a
 * human — they are the parts carrying the product's value — but they now live
 * beside the component instead of in the docs app, and props come from the
 * types rather than from a second description of them.
 */

import type { ComponentDoc, PropDoc } from "@oxygenui-design/component-meta";
import { HOMEPAGE, banner, paths } from "../config";
import type { LoadedComponent } from "../load";
import type { ExtractedExport } from "../props";
import type { Emitter } from "../write";

function applyPropOverrides(
  props: PropDoc[],
  overrides: LoadedComponent["meta"]["props"],
): PropDoc[] {
  if (!overrides.length) return props;

  const byName = new Map(overrides.map((o) => [o.name, o]));
  return props
    .filter((p) => !byName.get(p.name)?.hidden)
    .sort((a, b) => {
      const orderA = byName.get(a.name)?.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = byName.get(b.name)?.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
}

export function buildCatalog(
  components: LoadedComponent[],
  propsByComponent: Map<string, ExtractedExport[]>,
): ComponentDoc[] {
  return components.map((component) => {
    const { meta } = component;
    // The first exported component is the one the docs page leads with; the
    // rest (skeletons, row-level exports, providers) are documented under it
    // rather than merged into its table.
    const allExports = propsByComponent.get(meta.name) ?? [];
    const primary = allExports[0];
    const props = applyPropOverrides(primary?.props ?? [], meta.props);

    const doc: ComponentDoc = {
      name: meta.name,
      title: meta.title,
      tier: meta.tier,
      status: meta.status,
      since: meta.since,
      layer: meta.layer,
      ...(meta.deprecation ? { deprecation: meta.deprecation } : {}),

      summary: meta.summary,
      description: meta.description,
      rationale: meta.rationale,
      categories: meta.categories,

      fhir: meta.fhir,
      ...(meta.fhir[0] ? { resource: meta.fhir[0].name, resourceUrl: meta.fhir[0].url } : {}),

      states: meta.states,
      props,
      ...(primary?.extendsType ? { extendsType: primary.extendsType } : {}),
      exports: allExports.map((e) => ({
        name: e.exportName,
        props: e.exportName === primary?.exportName ? props : e.props,
        ...(e.extendsType ? { extendsType: e.extendsType } : {}),
      })),
      usage: meta.usage,
      guidance: meta.guidance,
      accessibility: meta.a11y,
      limitations: meta.limitations,
      related: meta.related,

      dependencies: meta.dependencies,
      install: `pnpm dlx shadcn@latest add ${HOMEPAGE}/r/${meta.name}.json`,
    };

    return doc;
  });
}

export async function emitCatalog(catalog: ComponentDoc[], emitter: Emitter): Promise<void> {
  const source = `${banner()}

import type { ComponentDoc } from "@oxygenui-design/component-meta";

export const CATALOG: ComponentDoc[] = ${JSON.stringify(catalog, null, 2)};

export const BY_NAME: ReadonlyMap<string, ComponentDoc> = new Map(
  CATALOG.map((component) => [component.name, component]),
);

export const ALL_CATEGORIES: readonly string[] = [
  ...new Set(CATALOG.flatMap((component) => component.categories)),
].sort();
`;

  await emitter.emit(paths.docsCatalog, source);
}
