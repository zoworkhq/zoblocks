/**
 * Components reference semantic tokens, never raw palette values.
 *
 *   --ox-status-critical   ✓  means something
 *   --ox-red-600           ✗  is a colour
 *
 * This is the rule that makes multi-brand theming possible at all. A brand
 * overrides semantic tokens; if a component reaches past them to a primitive,
 * that component silently ignores the brand — and on a status colour, "silently
 * ignores the brand" can mean rendering a customer's critical colour as our
 * green.
 *
 * The token file states this rule in a comment today. Stating it in a comment
 * scales to 29 components, not to 500.
 *
 * See content/decisions/0005-three-tier-token-pipeline.md.
 */

const PRIMITIVE = /--ox-(?:brand|slate|red|amber|blue|green|gray|grey|neutral)-\d{2,3}\b/g;

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow referencing primitive palette tokens from component source; components use semantic tokens.",
    },
    schema: [],
    messages: {
      primitive:
        'Component references the primitive token "{{token}}". Components must reference semantic tokens (--ox-status-critical, --ox-text-muted) so that a brand override reaches them. Add a semantic token if none fits.',
    },
  },

  create(context) {
    function scan(node, text) {
      if (typeof text !== "string") return;
      for (const match of text.matchAll(PRIMITIVE)) {
        context.report({ node, messageId: "primitive", data: { token: match[0] } });
      }
    }

    return {
      Literal(node) {
        scan(node, node.value);
      },
      TemplateElement(node) {
        scan(node, node.value.raw);
      },
      JSXText(node) {
        scan(node, node.value);
      },
    };
  },
};
