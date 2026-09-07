/**
 * A nested accordion that flattens the document outline.
 *
 * Every accordion trigger is wrapped in a real heading, and for a screen-reader
 * user that heading list is the record's table of contents. `headingLevel`
 * defaults to 3, which is right for a top-level accordion and wrong for one
 * nested inside another — two accordions both emitting `h3` produce an outline
 * where a treatment plan's goals appear to be siblings of the plan itself.
 *
 * Nothing at runtime complains. The markup is valid, axe is quiet (heading-order
 * is a best-practice rule, not a WCAG one), and the page looks correct. The
 * only reader who experiences the bug is the one navigating by heading, which
 * is the reader the heading was for.
 *
 * A warning rather than an error: the rule can only see lexical nesting, and a
 * nested accordion composed through a variable or a separate component is
 * invisible to it. It catches the common shape, which is the inline one.
 */

const ACCORDION_NAMES = new Set(["Accordion", "ChartAccordion", "Disclosure", "SafetyPlan"]);

function elementName(node) {
  const name = node.openingElement?.name;
  if (!name) return undefined;
  if (name.type === "JSXIdentifier") return name.name;
  // <ZoBlocks.Accordion /> — take the property, which is what carries the meaning.
  if (name.type === "JSXMemberExpression" && name.property.type === "JSXIdentifier") {
    return name.property.name;
  }
  return undefined;
}

function hasHeadingLevel(node) {
  return (node.openingElement?.attributes ?? []).some((attribute) => {
    // A spread might carry it. Staying quiet is the right call — see the
    // module comment about lexical visibility.
    if (attribute.type === "JSXSpreadAttribute") return true;
    return attribute.name?.type === "JSXIdentifier" && attribute.name.name === "headingLevel";
  });
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an explicit headingLevel on an accordion nested inside another, so the document outline is not silently flattened.",
    },
    schema: [],
    messages: {
      drift:
        "This <{{inner}}> is nested inside a <{{outer}}> and does not set headingLevel, so both emit the same heading level and the outline flattens. For a screen-reader user the heading list is the record's table of contents. Set headingLevel one deeper than the accordion around it.",
    },
  },

  create(context) {
    /** Outer accordion elements currently open, innermost last. */
    const stack = [];

    return {
      JSXElement(node) {
        const name = elementName(node);
        if (!name || !ACCORDION_NAMES.has(name)) return;

        const outer = stack[stack.length - 1];
        if (outer && !hasHeadingLevel(node)) {
          context.report({
            node: node.openingElement,
            messageId: "drift",
            data: { inner: name, outer },
          });
        }

        stack.push(name);
      },

      "JSXElement:exit"(node) {
        const name = elementName(node);
        if (!name || !ACCORDION_NAMES.has(name)) return;
        stack.pop();
      },
    };
  },
};
