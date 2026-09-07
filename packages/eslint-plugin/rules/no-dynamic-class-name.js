/**
 * Tailwind resolves classes by scanning source text. A class name assembled at
 * runtime therefore produces no CSS at all.
 *
 *   text-[var(--zb-status-${tone})]     ← compiles to nothing
 *
 * On a severity chip that does not fail loudly; it renders the element unstyled,
 * which silently deletes the severity signal from a clinical display. This is
 * documented in the README as one of two things that will "silently break a
 * component". A rule is a better place for it than a paragraph.
 *
 * The fix is always the same: a literal lookup map, which is also what makes the
 * full set of possible classes visible to Tailwind's scanner.
 */

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow building a Tailwind class name from an interpolated value; Tailwind cannot see it and emits no CSS.",
    },
    schema: [
      {
        type: "object",
        properties: {
          classFunctions: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      dynamic:
        "Class name built from an interpolated value. Tailwind resolves classes by scanning source text, so this produces no CSS and the element renders unstyled. Use a literal lookup map: const TONE_CLASS = {{ '{' }} critical: \"text-[var(--zb-status-critical)]\" {{ '}' }}.",
    },
  },

  create(context) {
    const configured = context.options[0]?.classFunctions;
    const CLASS_FUNCTIONS = new Set(configured ?? ["cn", "clsx", "cx", "classNames", "twMerge"]);

    /** Template literals with interpolation are the hazard; static ones are fine. */
    function check(node) {
      if (!node) return;

      switch (node.type) {
        case "TemplateLiteral":
          if (node.expressions.length > 0) context.report({ node, messageId: "dynamic" });
          return;
        // cn(a ? "x" : "y") and cond && "x" are safe shapes, but their branches
        // can still hide a template literal.
        case "ConditionalExpression":
          check(node.consequent);
          check(node.alternate);
          return;
        case "LogicalExpression":
          check(node.right);
          return;
        case "ArrayExpression":
          node.elements.forEach(check);
          return;
        case "CallExpression":
          if (node.callee.type === "Identifier" && CLASS_FUNCTIONS.has(node.callee.name)) {
            node.arguments.forEach(check);
          }
          return;
        default:
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (node.name.name !== "className" && node.name.name !== "class") return;
        if (node.value?.type === "JSXExpressionContainer") check(node.value.expression);
      },

      CallExpression(node) {
        if (node.callee.type === "Identifier" && CLASS_FUNCTIONS.has(node.callee.name)) {
          node.arguments.forEach(check);
        }
      },
    };
  },
};
