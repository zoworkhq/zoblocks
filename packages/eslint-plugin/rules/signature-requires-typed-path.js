/**
 * A signature control always offers the typed path.
 *
 *   <Signature methods={["draw", "type", "upload"]} />   ✓
 *   <Signature methods={["draw"]} />                     ✗  fails WCAG 2.1.1
 *
 * Drawing is a path-dependent input technique. WCAG 2.1.1 Keyboard — **Level
 * A**, not AA — excepts only functions that "require input that depends on the
 * path of the user's movement", and its normative Note 1 refuses that excuse
 * for exactly this case:
 *
 *   "This exception relates to the underlying function, not the input
 *   technique. For example, if using handwriting to enter text, the input
 *   technique (handwriting) requires path-dependent input but the underlying
 *   function (text input) does not."
 *
 * The function here is recording assent, not producing a bitmap of cursive.
 * Typing a name achieves it — under ESIGN a signature is defined by intent, not
 * by technique — so the exception does not apply and a draw-only pad is not
 * operable by keyboard at all.
 *
 * This is a lint rule rather than a runtime warning for two reasons. A
 * component that writes to a customer's console is already forbidden here
 * (`no-forbidden-capability`), and more importantly the mistake is invisible at
 * runtime: the component renders, the tests pass, and the product has simply
 * stopped being usable by anyone who cannot hold a stylus — a population that,
 * in healthcare, is not an edge case.
 *
 * The escape hatch is deliberate and narrow: a host that provides a genuinely
 * equivalent alternative elsewhere on the page can disable the rule on that
 * line, which forces the claim to be written down next to the code.
 *
 * See zoblocks-signature-brief.html §06.
 */

/** Components that take a `methods` array of capture modes. */
const SIGNATURE_COMPONENTS = new Set(["Signature", "SignatureModal", "SignaturePad"]);

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require the typed capture method on signature controls; drawing alone is not keyboard operable.",
    },
    schema: [],
    messages: {
      missingTyped:
        'Signature `methods` omits "type". Drawing is path-dependent input, and WCAG 2.1.1 (Level A) requires the underlying function — recording assent — to be operable by keyboard. Without the typed path this control cannot be used without a pointer. Add "type", or disable this rule on this line and state where the equivalent alternative lives.',
      emptyMethods: "Signature `methods` is empty, so the control offers no way to sign at all.",
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : null;
        if (!name || !SIGNATURE_COMPONENTS.has(name)) return;

        const methods = node.attributes.find(
          (attribute) =>
            attribute.type === "JSXAttribute" &&
            attribute.name.type === "JSXIdentifier" &&
            attribute.name.name === "methods",
        );

        // Absent means the default, which includes "type". Only an explicit
        // list can remove it.
        if (!methods || methods.type !== "JSXAttribute") return;

        const value = methods.value;
        if (!value || value.type !== "JSXExpressionContainer") return;
        const expression = value.expression;
        if (expression.type !== "ArrayExpression") return;

        // A spread or a variable could contain anything; flagging it would be
        // a guess, and a rule that guesses gets disabled wholesale.
        if (expression.elements.some((element) => element?.type === "SpreadElement")) return;

        const literals = expression.elements.filter(
          (element) => element?.type === "Literal" && typeof element.value === "string",
        );
        if (literals.length !== expression.elements.length) return;

        if (expression.elements.length === 0) {
          context.report({ node: methods, messageId: "emptyMethods" });
          return;
        }

        const offered = literals.map((element) => element.value);
        if (!offered.includes("type")) {
          context.report({ node: methods, messageId: "missingTyped" });
        }
      },
    };
  },
};
