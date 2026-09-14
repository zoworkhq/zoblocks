/**
 * Four ways a Switch is reached for wrongly. Each renders, each passes review,
 * and each is a defect in a clinical display.
 *
 * They share a file because they share the AST walk and the component set —
 * splitting them into four rules would mean four passes over every JSX opening
 * element for checks that are each a dozen lines.
 *
 * See zoblocks-switch-brief.html §17 and
 * content/decisions/0010-antd-compatible-primitives.md.
 */

const SWITCH_COMPONENTS = new Set(["Switch", "SwitchField"]);

/** @param {import("estree").Node} node */
function attributeNamed(node, name) {
  return node.attributes.find(
    (attribute) =>
      attribute.type === "JSXAttribute" &&
      attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === name,
  );
}

/**
 * The literal string an attribute carries, if it plainly carries one.
 *
 * Returns undefined for anything computed. A rule that guesses at a variable's
 * contents gets disabled wholesale, which costs more than the cases it catches.
 */
function literalOf(attribute) {
  if (!attribute || attribute.type !== "JSXAttribute" || !attribute.value) return undefined;
  if (attribute.value.type === "Literal" && typeof attribute.value.value === "string") {
    return attribute.value.value;
  }
  if (
    attribute.value.type === "JSXExpressionContainer" &&
    attribute.value.expression.type === "Literal" &&
    typeof attribute.value.expression.value === "string"
  ) {
    return attribute.value.expression.value;
  }
  return undefined;
}

/**
 * A label that reads as a question.
 *
 * Deliberately narrow: a trailing question mark, or one of the four openers
 * that begin nearly every clinical yes/no field. Broadening it to "any label
 * containing a verb" would fire on half the catalogue.
 */
const QUESTION_OPENERS = /^\s*(does|did|has|have|is|are|was|were|do)\b/i;

function looksLikeAQuestion(text) {
  return text.trim().endsWith("?") || QUESTION_OPENERS.test(text);
}

/** @type {import("eslint").Rule.RuleModule} */
export const switchNotForQuestions = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Flag a Switch whose label reads as a question; a pill shows only the answer it is currently on.",
    },
    schema: [],
    messages: {
      question:
        'This Switch is labelled as a question ("{{label}}"). A pill renders only the answer it currently holds, so "no" and "nobody asked" look the same and the reader cannot tell which they are seeing. Use appearance="segmented", which renders the same value as a radiogroup with both answers visible — or a radio group, if a third answer is genuinely selectable.',
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : null;
        if (!name || !SWITCH_COMPONENTS.has(name)) return;

        // A segmented switch already shows both answers; that is the fix.
        if (literalOf(attributeNamed(node, "appearance")) === "segmented") return;

        const label = attributeNamed(node, "label");
        const text = literalOf(label);
        if (!text || !looksLikeAQuestion(text)) return;

        context.report({ node: label, messageId: "question", data: { label: text } });
      },
    };
  },
};

/** @type {import("eslint").Rule.RuleModule} */
export const switchNeedsCommitStrategy = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an explicit commit strategy on a Switch inside a Form; a switch means applied now.",
    },
    schema: [],
    messages: {
      missing:
        'This Switch is inside a <Form> but declares no commit strategy. A switch\'s whole visual grammar promises "applied now" — inside a form that submits, that is a lie about when the change takes effect, and users navigate away believing it is done. Set commit="deferred" to render the unsaved-change marker, commit="instant" to state that it writes immediately, or use a Checkbox, which carries no such promise.',
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : null;
        if (!name || !SWITCH_COMPONENTS.has(name)) return;
        if (attributeNamed(node, "commit")) return;

        // Walk up for an enclosing <Form>. Only a literal element counts — a
        // form rendered through a variable is not something to guess about.
        for (let current = node.parent; current; current = current.parent) {
          if (current.type !== "JSXElement") continue;
          const opening = current.openingElement;
          const enclosing =
            opening?.name?.type === "JSXIdentifier"
              ? opening.name.name
              : opening?.name?.type === "JSXMemberExpression" &&
                  opening.name.object.type === "JSXIdentifier"
                ? opening.name.object.name
                : null;
          if (enclosing === "Form" || enclosing === "form") {
            context.report({ node, messageId: "missing" });
            return;
          }
        }
      },
    };
  },
};

/** @type {import("eslint").Rule.RuleModule} */
export const noDisabledWithReason = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `disabled` alongside `lockedReason`; the author knew the reason and reached for the wrong prop.",
    },
    schema: [],
    fixable: "code",
    messages: {
      both: "This control passes both `disabled` and `lockedReason`. `disabled` removes it from the tab order, so a screen-reader user never learns it exists or why it cannot be changed — and the reason you wrote is never announced. Use `readOnly` with the reason. `disabled` is correct only when the unavailability is transient and caused by something the user just did.",
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : null;
        if (!name || !SWITCH_COMPONENTS.has(name)) return;

        const disabled = attributeNamed(node, "disabled");
        const reason = attributeNamed(node, "lockedReason");
        if (!disabled || !reason) return;

        context.report({
          node: disabled,
          messageId: "both",
          // The name only. `disabled={!canEdit}` becomes `readOnly={!canEdit}`;
          // replacing the whole attribute locked the control for everybody.
          fix: (fixer) => fixer.replaceText(disabled.name, "readOnly"),
        });
      },
    };
  },
};

/** @type {import("eslint").Rule.RuleModule} */
export const switchAuditNeedsNow = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a server-supplied `now` wherever audit events are recorded.",
    },
    schema: [],
    messages: {
      missing:
        "`onAuditEvent` is supplied without `now`. The component never reads the clock, so an audit event with no `now` is stamped with nothing — and a component that filled it in from `Date.now()` would be stamping a ward workstation's clock, which is frequently wrong. Pass the server's ISO 8601 time.",
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : null;
        if (!name || !SWITCH_COMPONENTS.has(name)) return;

        const audit = attributeNamed(node, "onAuditEvent");
        if (!audit || attributeNamed(node, "now")) return;

        context.report({ node: audit, messageId: "missing" });
      },
    };
  },
};
