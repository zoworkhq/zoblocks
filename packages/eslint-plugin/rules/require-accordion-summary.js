/**
 * A severity that reaches the screen with no words beside it.
 *
 * An accordion item with `severity` paints a coloured rail down the leading
 * edge of its header. That rail is discarded by forced-colors mode, discarded
 * by monochrome printing, and unresolvable for roughly one in twelve men. If
 * the header carries no `summary`, those readers get a section that looks
 * exactly like every other section — which is the "colour alone" failure
 * CONTENT.md §3 already forbids, arriving through the one component whose whole
 * job is deciding what a reader does not see.
 *
 * It renders perfectly, passes every other test, and silently deletes a
 * clinical signal for a subset of readers. That is the profile of a defect that
 * belongs in a lint rule rather than in a review checklist.
 *
 * ChartAccordion enforces the same rule in its types, where it can. This covers
 * the primitive, where `summary` and `severity` are independent props.
 */

/**
 * Object properties that count as words beside the rail.
 *
 * `summary` is the primitive's slot and `status` is ChartSection's — the field
 * ChartAccordion composes into a chip. `extra` renders beside the header too.
 * All three put text next to the severity, which is the whole requirement.
 */
const SUMMARY_KEYS = new Set(["summary", "status", "extra"]);

function keyNameOf(property) {
  if (property.type !== "Property") return undefined;
  if (property.key.type === "Identifier" && !property.computed) return property.key.name;
  if (property.key.type === "Literal") return String(property.key.value);
  return undefined;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an accordion item that declares a severity to also carry a summary, so the severity rail is never the only signal.",
    },
    schema: [],
    messages: {
      missing:
        'This accordion item sets severity "{{severity}}" but no summary. The severity rail is the only thing a collapsed section shows, and it disappears in forced-colors mode, in monochrome print, and for readers who cannot separate red from green. Add a summary that states the finding in words — "C-SSRS positive", not a colour.',
    },
  },

  create(context) {
    return {
      ObjectExpression(node) {
        let severityNode;
        let severityValue;
        let hasSummary = false;
        let unanalysable = false;

        for (const property of node.properties) {
          // A spread could supply either half. Guessing produces false
          // positives on correct code, and a rule that cries wolf gets turned
          // off — which protects nothing.
          if (property.type === "SpreadElement") {
            unanalysable = true;
            continue;
          }

          const name = keyNameOf(property);
          if (name === undefined) continue;

          if (name === "severity") {
            severityNode = property;
            severityValue =
              property.value.type === "Literal" ? String(property.value.value) : undefined;
            // A computed severity is still a severity; the summary is still
            // required. Only the message loses its specificity.
          }
          if (SUMMARY_KEYS.has(name)) {
            // `summary: undefined` is an omission written longhand.
            const isExplicitUndefined =
              property.value.type === "Identifier" && property.value.name === "undefined";
            if (!isExplicitUndefined) hasSummary = true;
          }
        }

        if (!severityNode || hasSummary || unanalysable) return;

        // An item shape, not any object that happens to have a severity: a
        // `key` and a `label` are what make this an accordion item rather than,
        // say, a log record or a chart datum.
        const names = new Set(node.properties.map((p) => keyNameOf(p)).filter(Boolean));
        if (!names.has("key") || !names.has("label")) return;

        context.report({
          node: severityNode,
          messageId: "missing",
          data: { severity: severityValue ?? "(computed)" },
        });
      },
    };
  },
};
