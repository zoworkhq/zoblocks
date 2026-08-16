/**
 * A tab strip declares what it is.
 *
 *   <Tabs as="tabs" ... />                              ✓
 *   <Tabs ... />                                        ✗  no semantic mode
 *   <Tabs as="tabs" items={[{ href: "/billing" }]} />    ✗  a tablist of links
 *   <Tabs as="radiogroup" overflow="wrap" />             ✓
 *   <Tabs as="tabs" overflow="wrap" />                   ✗  wrapped tablist
 *
 * Four different components share the tab silhouette — a view switch, a
 * navigation menu, a form value and a wizard — and they need four different
 * accessibility trees. Shipping one of them and using it as all four is the
 * most-reported tab defect in every design system audit, and it is invisible
 * at runtime: the component renders, every attribute is spelled correctly, and
 * every automated checker passes.
 *
 * The specific failure this catches most often is a `role="tablist"` wrapped
 * around anchors. A screen reader announces "tab, 2 of 5"; the user presses
 * ArrowRight expecting to preview the next panel; the page navigates and their
 * focus is destroyed. Nothing in the DOM is malformed — the *claim* is wrong.
 *
 * A lint rule rather than a runtime warning, for the same two reasons as
 * `signature-requires-typed-path`: writing to a customer's console is
 * forbidden here, and the only moment anyone will look at this is the moment
 * it is written.
 */

const TAB_COMPONENTS = new Set(["Tabs", "TabsRoot", "Tabs.Root"]);
const VALID_MODES = new Set(["tabs", "nav", "radiogroup", "steps"]);

function elementName(node) {
  const name = node.name;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") {
    const object = name.object.type === "JSXIdentifier" ? name.object.name : null;
    const property = name.property.type === "JSXIdentifier" ? name.property.name : null;
    return object && property ? `${object}.${property}` : null;
  }
  return null;
}

function findAttribute(node, attributeName) {
  return node.attributes.find(
    (attribute) =>
      attribute.type === "JSXAttribute" &&
      attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === attributeName,
  );
}

/** The literal string behind `foo="bar"` or `foo={"bar"}`, or null. */
function literalString(attribute) {
  if (!attribute || attribute.type !== "JSXAttribute" || !attribute.value) return null;
  const value = attribute.value;
  if (value.type === "Literal" && typeof value.value === "string") return value.value;
  if (
    value.type === "JSXExpressionContainer" &&
    value.expression.type === "Literal" &&
    typeof value.expression.value === "string"
  ) {
    return value.expression.value;
  }
  return null;
}

/** True when any object in a literal `items` array carries a truthy `href`. */
function itemsCarryHref(attribute) {
  if (!attribute || attribute.type !== "JSXAttribute" || !attribute.value) return false;
  const value = attribute.value;
  if (value.type !== "JSXExpressionContainer") return false;
  const expression = value.expression;
  if (expression.type !== "ArrayExpression") return false;

  return expression.elements.some((element) => {
    if (!element || element.type !== "ObjectExpression") return false;
    return element.properties.some(
      (property) =>
        property.type === "Property" &&
        !property.computed &&
        ((property.key.type === "Identifier" && property.key.name === "href") ||
          (property.key.type === "Literal" && property.key.value === "href")),
    );
  });
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an explicit semantic mode on Oxygen Tabs, and keep the mode consistent with links and overflow.",
    },
    schema: [],
    messages: {
      missingMode:
        'Tabs is missing `as`. There is no safe default: a view switch (as="tabs"), a navigation menu (as="nav"), a form value (as="radiogroup") and a wizard (as="steps") share this silhouette and need four different accessibility trees. Pick the one this control actually is.',
      unknownMode:
        'Unknown semantic mode "{{mode}}". Valid values are "tabs", "nav", "radiogroup" and "steps".',
      hrefWithoutNav:
        'This Tabs has items with an `href` but `as="{{mode}}"`. A tablist of links announces "tab, n of m" and then destroys focus when an arrow key navigates the page — the single most common tab accessibility defect, and one no automated checker catches. Use as="nav", which renders real anchors and keeps cmd-click and middle-click working.',
      navWithoutHref:
        'as="nav" renders anchors, but no item has an `href`. An anchor without one is neither focusable nor clickable. Give every item an `href`, or use as="tabs".',
      wrapOutsideRadiogroup:
        'overflow="wrap" is only legal with as="radiogroup". Once a tablist wraps onto two rows, "the next tab" stops being a direction and arrow navigation has no correct answer. Use overflow="menu" or overflow="collapse".',
    },
  },

  create(context) {
    /**
     * Names bound by an import from somewhere that is not Oxygen.
     *
     * The rule matches on the element name, which is the only thing available
     * at a JSX site — and `Tabs` is what antd calls its own tab strip too.
     * `packages/signature` imports antd's, which has no `as` prop at all, so
     * the rule was demanding an attribute that would forward an unknown
     * property to the DOM. Flagging code that cannot comply is how a rule gets
     * disabled wholesale, and then it protects nothing.
     */
    const foreign = new Set();

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;
        if (source.startsWith("@oxygenui") || source.startsWith(".") || source.startsWith("@/")) {
          return;
        }
        for (const specifier of node.specifiers) {
          if (specifier.local?.type === "Identifier") foreign.add(specifier.local.name);
        }
      },

      JSXOpeningElement(node) {
        const name = elementName(node);
        if (!name || !TAB_COMPONENTS.has(name)) return;
        // Someone else's Tabs. It is not ours to make claims about.
        if (foreign.has(name.split(".")[0])) return;

        // A spread could carry `as`, and flagging it would be a guess. A rule
        // that guesses gets disabled wholesale, and then it protects nothing.
        if (node.attributes.some((attribute) => attribute.type === "JSXSpreadAttribute")) return;

        const asAttribute = findAttribute(node, "as");
        if (!asAttribute) {
          context.report({ node, messageId: "missingMode" });
          return;
        }

        const mode = literalString(asAttribute);
        // Not statically analysable — a variable or a ternary. The component
        // validates it at runtime in development.
        if (mode === null) return;

        if (!VALID_MODES.has(mode)) {
          context.report({ node: asAttribute, messageId: "unknownMode", data: { mode } });
          return;
        }

        const items = findAttribute(node, "items");
        const hasHref = itemsCarryHref(items);
        if (hasHref && mode !== "nav") {
          context.report({ node: asAttribute, messageId: "hrefWithoutNav", data: { mode } });
        }
        // Only complain about a missing href when the array is a literal we
        // could actually read; a mapped or variable `items` tells us nothing.
        if (
          mode === "nav" &&
          items &&
          items.value?.type === "JSXExpressionContainer" &&
          items.value.expression.type === "ArrayExpression" &&
          items.value.expression.elements.length > 0 &&
          items.value.expression.elements.every(
            (element) => element?.type === "ObjectExpression",
          ) &&
          !hasHref
        ) {
          context.report({ node: items, messageId: "navWithoutHref" });
        }

        // Reported on the attribute rather than the element, so the squiggle
        // lands on the prop that is wrong.
        const overflowAttribute = findAttribute(node, "overflow");
        if (literalString(overflowAttribute) === "wrap" && mode !== "radiogroup") {
          context.report({ node: overflowAttribute, messageId: "wrapOutsideRadiogroup" });
        }
      },
    };
  },
};
