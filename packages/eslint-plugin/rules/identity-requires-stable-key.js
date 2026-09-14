/**
 * An avatar's colour is keyed on the record, never on the name.
 *
 *   identityKey={patient.name[0].family}      ✗
 *   identityKey={displayName}                 ✗
 *   identityKey={patient.id}                  ✓
 *   identityKey={mrn}                         ✓
 *
 * Hashing the displayed name is the obvious implementation and it is wrong in a
 * way that is invisible in a design file and obvious in production:
 *
 *   - A patient marries and changes surname. Their colour changes, and staff
 *     who had learned the record visually now have a stranger.
 *   - A trans patient updates their name. The same failure, with a worse
 *     meaning attached to it.
 *   - The banner shows the chosen name and the worklist shows the legal one.
 *     Same person, two colours, on two screens at the same moment.
 *
 * The whole reason a decorative tint is worth having is that the same person
 * looks the same everywhere. Keyed on a name, it stops being worth having and
 * starts being actively misleading — and nobody files a bug about a colour.
 *
 * See content/decisions/0004 and the Identity brief §2.
 */

/**
 * Property paths and bare identifiers that are a name rather than a record key.
 *
 * `given` and `family` are included unqualified because those are the FHIR
 * field names — a developer destructuring a `HumanName` gets exactly those two
 * bindings, and they are the likeliest thing to end up in a swatch key by
 * accident.
 */
const NAME_LIKE =
  /^(name|names|given|givens|family|displayName|fullName|familyName|givenName|surname|firstName|lastName|patientName|chosenName|legalName|usualName|preferredName|title|label|text)$/;

/** Nodes that wrap an expression without changing its value. */
const WRAPPERS = new Set([
  "ChainExpression",
  "TSAsExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
]);

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an identity swatch key to be derived from a stable record identifier rather than from a name.",
    },
    schema: [],
    messages: {
      nameKeyed:
        "An avatar swatch keyed on a name repaints the patient every time the name changes — a marriage, a correction, a gender transition, or simply a banner showing the chosen name beside a worklist showing the legal one. Key it on `patient.id` or an identifier value instead.",
    },
  },

  create(context) {
    function isNameExpression(node) {
      if (!node) return false;

      // identityKey={patient?.name} / {displayName as string} / {displayName!}
      // The wrapper changes the type or the null handling, never the value.
      if (WRAPPERS.has(node.type)) return isNameExpression(node.expression);

      // identityKey={displayName}
      if (node.type === "Identifier") return NAME_LIKE.test(node.name);

      // identityKey={patient.name} / {p.name[0].family} / {n.family}
      if (node.type === "MemberExpression") {
        const property = node.property;
        if (property.type === "Identifier" && NAME_LIKE.test(property.name)) return true;
        if (
          property.type === "Identifier" &&
          /^(family|given|prefix|suffix)$/.test(property.name)
        ) {
          return true;
        }
        return isNameExpression(node.object);
      }

      // identityKey={`${given} ${family}`}
      if (node.type === "TemplateLiteral") {
        return node.expressions.some((e) => isNameExpression(e));
      }

      // identityKey={given + " " + family}
      if (node.type === "BinaryExpression" && node.operator === "+") {
        return isNameExpression(node.left) || isNameExpression(node.right);
      }

      // identityKey={formatHumanName(name)} / {name.join(" ")}
      if (node.type === "CallExpression") {
        const callee = node.callee;
        if (callee.type === "Identifier" && /name/i.test(callee.name)) return true;
        if (callee.type === "MemberExpression") return isNameExpression(callee.object);
        return node.arguments.some((a) => isNameExpression(a));
      }

      return false;
    }

    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== "identityKey") return;
        const value = node.value;
        if (value?.type !== "JSXExpressionContainer") return;
        if (!isNameExpression(value.expression)) return;
        context.report({ node, messageId: "nameKeyed" });
      },

      // identitySwatch(displayName) — the engine call, used directly.
      CallExpression(node) {
        const callee = node.callee;
        const name =
          callee.type === "Identifier"
            ? callee.name
            : callee.type === "MemberExpression" && callee.property.type === "Identifier"
              ? callee.property.name
              : null;
        if (name !== "identitySwatch") return;
        const first = node.arguments[0];
        if (!isNameExpression(first)) return;
        context.report({ node, messageId: "nameKeyed" });
      },
    };
  },
};
