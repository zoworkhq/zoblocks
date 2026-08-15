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

/**
 * Two patterns, because there are two ways to get this wrong.
 *
 * The first is the current shape: every primitive the build emits is namespaced
 * `--ox-ref-*`, so the prefix alone is sufficient and stays correct as palette
 * scales are added.
 *
 * The second is the shape primitives had before the token build existed
 * (`--ox-red-600`). Those names no longer resolve to anything, so a component
 * still referencing one renders with no colour at all rather than the wrong
 * one — which on a status badge means the severity signal silently disappears.
 * Worth its own message.
 */
const PRIMITIVE = /--ox-ref-[a-z0-9-]+/g;
const LEGACY_PRIMITIVE =
  /--ox-(?:brand|slate|red|amber|blue|green|violet|cyan|ink|gray|grey|neutral)-\d{2,3}\b/g;

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
      legacy:
        '"{{token}}" was a primitive before the token build; it is now "--ox-ref-{{suffix}}" and no longer resolves. This renders with no colour at all rather than the wrong one, which on a status badge means the severity signal disappears. Use the semantic token instead.',
    },
  },

  create(context) {
    function scan(node, text) {
      if (typeof text !== "string") return;
      for (const match of text.matchAll(PRIMITIVE)) {
        context.report({ node, messageId: "primitive", data: { token: match[0] } });
      }
      for (const match of text.matchAll(LEGACY_PRIMITIVE)) {
        context.report({
          node,
          messageId: "legacy",
          data: { token: match[0], suffix: match[0].replace("--ox-", "") },
        });
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
