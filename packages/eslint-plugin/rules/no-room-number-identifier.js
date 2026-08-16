/**
 * A room number is not a patient identifier.
 *
 *   identifiers={[{ kind: "mrn" }, { kind: "room" }]}      ✗
 *   <IdentifierField label="Bed" … />                      ✗
 *   identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}       ✓
 *
 * Joint Commission NPSG.01.01.01 requires two *person-specific* identifiers
 * before any care action and excludes the patient's room number explicitly. It
 * excludes it because location is the fastest thing on a ward to be wrong
 * about: patients move, beds get reassigned, and a bay number is a statement
 * about furniture rather than about a person.
 *
 * The failure this prevents is a banner that satisfies the two-identifier type
 * with a name and a bed, which is one identifier and a piece of geography.
 *
 * See ACCESSIBILITY.md, CONTENT.md § Identity and people, and the Identity
 * brief §3.
 */

const LOCATION_KIND = /^(room|bed|bay|ward|cubicle|chair|trolley|slot|location|unit)$/i;
const LOCATION_LABEL = /^(room|bed|bay|ward|cubicle|chair|trolley|slot)\b/i;

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow a room, bed or ward number in a patient identifier position.",
    },
    schema: [],
    messages: {
      location:
        "NPSG.01.01.01 requires two person-specific identifiers and excludes the room number explicitly. A bed is a statement about furniture: patients move and beds get reassigned. Use a second person-specific identifier — a medical record number, an NHS number, a national identifier.",
    },
  },

  create(context) {
    /** `{ kind: "room" }` inside an `identifiers` array. */
    function checkIdentifierObject(node) {
      if (node.type !== "ObjectExpression") return;
      for (const prop of node.properties) {
        if (prop.type !== "Property" || prop.key.type !== "Identifier") continue;
        if (prop.key.name !== "kind" && prop.key.name !== "system") continue;
        if (prop.value.type !== "Literal" || typeof prop.value.value !== "string") continue;
        if (LOCATION_KIND.test(prop.value.value)) {
          context.report({ node: prop, messageId: "location" });
        }
      }
    }

    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== "identifiers") return;
        const value = node.value;
        if (value?.type !== "JSXExpressionContainer") return;
        const expr = value.expression;
        if (expr.type !== "ArrayExpression") return;
        for (const element of expr.elements) {
          if (element) checkIdentifierObject(element);
        }
      },

      /**
       * A label prop that names a location on something identifier-shaped.
       * Scoped to props called `label` on elements whose name mentions an
       * identifier, so a genuine ward field elsewhere in the layout is not
       * flagged — that is information, it just is not identification.
       */
      JSXOpeningElement(node) {
        const elementName =
          node.name.type === "JSXIdentifier"
            ? node.name.name
            : node.name.type === "JSXMemberExpression" &&
                node.name.property.type === "JSXIdentifier"
              ? node.name.property.name
              : "";
        if (!/identifier/i.test(elementName)) return;

        for (const attr of node.attributes) {
          if (attr.type !== "JSXAttribute" || !attr.name) continue;
          if (attr.name.name !== "label" && attr.name.name !== "kind") continue;
          const value = attr.value;
          if (value?.type !== "Literal" || typeof value.value !== "string") continue;
          if (LOCATION_LABEL.test(value.value)) {
            context.report({ node: attr, messageId: "location" });
          }
        }
      },
    };
  },
};
