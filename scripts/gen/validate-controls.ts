/**
 * Checks the metadata that *names* parts of the API against the API.
 *
 * A playground control, a variant's args, and a props override all refer to
 * something in the component's type — a prop name, a value in a union. Nothing
 * else in the build can see a mistake in one of them: the metadata is a plain
 * object, so `variant: "line"` on a component whose variants are `underline |
 * segmented | …` typechecks, generates, renders a control, and produces a
 * playground whose every setting is a no-op.
 *
 * Run after extraction, because the props are the source of truth here.
 */

import type { LoadedComponent } from "./load";
import type { ExtractedExport } from "./props";

/** How close two names have to be before suggesting one for the other. */
function nearest(candidate: string, options: readonly string[]): string | undefined {
  const lower = candidate.toLowerCase();
  return options.find((o) => o.toLowerCase() === lower) ?? options.find((o) => o.includes(lower));
}

function suffix(candidate: string, options: readonly string[]): string {
  const guess = nearest(candidate, options);
  const list = options.join(", ");
  return guess ? `did you mean "${guess}"? (${list})` : `expected one of: ${list}`;
}

export function validateControls(
  components: LoadedComponent[],
  propsByComponent: Map<string, ExtractedExport[]>,
): string[] {
  const problems: string[] = [];

  for (const { meta } of components) {
    const primary = (propsByComponent.get(meta.name) ?? [])[0];
    // No extracted props means the extractor found no component export — a
    // different failure, already reported by the props diagnostics.
    if (!primary || !primary.props.length) continue;

    const propNames = new Set(primary.props.map((p) => p.name));
    const known = [...propNames].sort();
    const enums = primary.enums;

    const checkValue = (where: string, prop: string, value: unknown) => {
      if (!propNames.has(prop)) {
        problems.push(
          `${meta.name}: ${where} names prop "${prop}", which does not exist — ${suffix(prop, known)}`,
        );
        return;
      }
      const allowed = enums[prop];
      if (!allowed || typeof value !== "string") return;
      if (!allowed.includes(value)) {
        problems.push(
          `${meta.name}: ${where} sets ${prop}="${value}", which the type does not admit — ${suffix(value, allowed)}`,
        );
      }
    };

    for (const control of meta.controls) {
      if (!propNames.has(control.prop)) {
        problems.push(
          `${meta.name}: control for "${control.prop}" names a prop that does not exist — ${suffix(control.prop, known)}`,
        );
        continue;
      }
      const allowed = enums[control.prop];
      if (!allowed) continue;

      for (const option of control.options ?? []) {
        if (!allowed.includes(option)) {
          problems.push(
            `${meta.name}: control "${control.prop}" offers "${option}", which the type does not admit — ${suffix(option, allowed)}`,
          );
        }
      }
      if (typeof control.defaultValue === "string" && !allowed.includes(control.defaultValue)) {
        problems.push(
          `${meta.name}: control "${control.prop}" defaults to "${control.defaultValue}", which the type does not admit — ${suffix(control.defaultValue, allowed)}`,
        );
      }
      /*
       * A control that lists options must list all of them, or the playground
       * quietly hides part of the API. Only enforced for small unions: a
       * variant axis with eleven members is a legitimate `select`, but a
       * three-value union showing two is a control with a missing state.
       */
      if (control.options && allowed.length <= 4) {
        const missing = allowed.filter((v) => !control.options?.includes(v));
        if (missing.length) {
          problems.push(
            `${meta.name}: control "${control.prop}" omits ${missing.map((m) => `"${m}"`).join(", ")} — a ${allowed.length}-value union has no reason to hide one`,
          );
        }
      }
    }

    for (const variant of meta.variants) {
      for (const [prop, value] of Object.entries(variant.args ?? {})) {
        checkValue(`variant "${variant.id}"`, prop, value);
      }
    }

    for (const override of meta.props) {
      if (!propNames.has(override.name)) {
        problems.push(
          `${meta.name}: props override for "${override.name}" names a prop that does not exist — ${suffix(override.name, known)}`,
        );
      }
    }
  }

  return problems;
}
