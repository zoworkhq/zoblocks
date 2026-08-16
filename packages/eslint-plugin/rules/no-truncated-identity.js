/**
 * A name is never ellipsised, and neither is an identifier.
 *
 *   <span className="truncate">{patient.name}</span>        ✗
 *   style={{ textOverflow: "ellipsis" }} on an MRN          ✗
 *   drop the whole field, or wrap it                        ✓
 *
 * This looks like a typography rule and is a data-loss rule. "Mohammed
 * Al-Rash…" and "Mohammed Al-Rashid" are two people on the same ward, and a
 * truncated MRN is not a shorter MRN — it is a different number. Both render
 * beautifully, pass every test, and are wrong at exactly the moment somebody
 * uses them to confirm who they are treating.
 *
 * The fix is never CSS. It is a priority order: the identity components take a
 * `fields` array and drop from the tail when the container is too narrow, so
 * the decision about what disappears was made by a designer rather than by a
 * layout engine at runtime.
 *
 * Scoped to elements that carry identity — a class name or a data attribute
 * that mentions a name or an identifier — because `truncate` on a free-text
 * note is legitimate and firing on it would train everyone to ignore the rule.
 *
 * See ACCESSIBILITY.md § Reflow, and the Identity brief §8.9.
 */

/** CSS class names that clip text. */
const CLIPPING_CLASS = /(^|\s)(truncate|text-ellipsis|line-clamp-\d+|ox-truncate)(\s|$)/;

/** Identity-bearing markers in a class name, data attribute or prop. */
const IDENTITY_HINT =
  /(patient|person|identity|human)?-?(name|mrn|identifier|nhs|abha|medicare|ssn)|ox-banner__name|ox-chip__name/i;

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow CSS truncation on elements that render a patient name or an identifier.",
    },
    schema: [],
    messages: {
      clipped:
        'Never truncate a name or an identifier. "Mohammed Al-Rash…" and "Mohammed Al-Rashid" are two people on the same ward, and a clipped MRN is a different number — not a shorter one. Drop the whole field via the `fields` priority order, or let it wrap.',
    },
  },

  create(context) {
    /** Does this JSX element look like it renders identity? */
    function carriesIdentity(node) {
      return node.attributes.some((attr) => {
        if (attr.type !== "JSXAttribute" || !attr.name) return false;
        const name = attr.name.name;
        if (typeof name !== "string") return false;
        if (name === "data-ox-field" || name === "data-ox-patient-id") return true;
        if (name !== "className" && name !== "class") return false;
        const value = attr.value;
        if (value?.type === "Literal" && typeof value.value === "string") {
          return IDENTITY_HINT.test(value.value);
        }
        return false;
      });
    }

    function hasClipping(node) {
      for (const attr of node.attributes) {
        if (attr.type !== "JSXAttribute" || !attr.name) continue;
        const name = attr.name.name;

        if ((name === "className" || name === "class") && attr.value?.type === "Literal") {
          if (typeof attr.value.value === "string" && CLIPPING_CLASS.test(attr.value.value)) {
            return true;
          }
        }

        if (name === "style" && attr.value?.type === "JSXExpressionContainer") {
          const expr = attr.value.expression;
          if (expr.type !== "ObjectExpression") continue;
          for (const prop of expr.properties) {
            if (prop.type !== "Property" || prop.key.type !== "Identifier") continue;
            if (prop.key.name !== "textOverflow" && prop.key.name !== "WebkitLineClamp") continue;
            if (prop.value.type === "Literal" && prop.value.value === "clip") continue;
            return true;
          }
        }
      }
      return false;
    }

    return {
      JSXOpeningElement(node) {
        if (!carriesIdentity(node)) return;
        if (!hasClipping(node)) return;
        context.report({ node, messageId: "clipped" });
      },
    };
  },
};
