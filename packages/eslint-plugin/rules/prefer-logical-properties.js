/**
 * Right-to-left support, enforced before it is needed.
 *
 * `ml-2` is a left margin in every language. `ms-2` is a margin at the start of
 * the reading direction, which is the left in English and the right in Arabic.
 * The difference is invisible until someone opens the interface in Hebrew, at
 * which point every physical property in the catalog is a layout bug.
 *
 * Retrofitting this across 500 components is a project. Enforcing it from the
 * start costs nothing, because the logical utility is the same length as the
 * physical one.
 *
 * See content/decisions/0008-internationalisation-before-fifty-components.md.
 */

const REPLACEMENTS = [
  [/\bml-/, "ms-"],
  [/\bmr-/, "me-"],
  [/\bpl-/, "ps-"],
  [/\bpr-/, "pe-"],
  [/\bborder-l\b/, "border-s"],
  [/\bborder-r\b/, "border-e"],
  [/\bborder-l-/, "border-s-"],
  [/\bborder-r-/, "border-e-"],
  [/\brounded-l\b/, "rounded-s"],
  [/\brounded-r\b/, "rounded-e"],
  [/\btext-left\b/, "text-start"],
  [/\btext-right\b/, "text-end"],
  [/\bleft-/, "start-"],
  [/\bright-/, "end-"],
];

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Require CSS logical properties over physical ones so components lay out correctly in right-to-left locales.",
    },
    schema: [],
    messages: {
      physical:
        'Use the logical utility "{{logical}}" instead of "{{physical}}". Physical properties do not flip in right-to-left locales, and the bug is invisible until someone opens the interface in Arabic or Hebrew.',
    },
  },

  create(context) {
    /** Only class-name-shaped strings. A prose string containing "right-" is not a utility. */
    function looksLikeClassList(text) {
      return /(?:^|\s)[a-z][a-z0-9]*(?:-[a-z0-9[\]()#%./:_-]+)+(?:\s|$)/.test(text);
    }

    function scan(node, text) {
      if (typeof text !== "string" || !looksLikeClassList(text)) return;

      for (const token of text.split(/\s+/)) {
        // Strip variant prefixes: "md:ml-2" and "hover:pl-1" are the same hazard.
        const utility = token.slice(token.lastIndexOf(":") + 1);

        for (const [pattern, logical] of REPLACEMENTS) {
          if (!pattern.test(utility)) continue;
          context.report({
            node,
            messageId: "physical",
            data: { physical: utility, logical: utility.replace(pattern, logical) },
          });
          break;
        }
      }
    }

    return {
      Literal(node) {
        scan(node, node.value);
      },
      TemplateElement(node) {
        scan(node, node.value.raw);
      },
    };
  },
};
