/**
 * An error message that names nothing.
 *
 * `no-ambiguous-clinical-copy` already catches these — inside the component
 * library, which is the one place they were not happening. A content audit
 * found the console's own root error boundary saying "Something went wrong",
 * the first entry on CONTENT.md §5's forbidden list, in an application the
 * clinical rules had never been pointed at.
 *
 * This is that half of §5, scoped to our own products and widened for how
 * failures are actually written outside a component: not as JSX prose but as
 * an object field on a server-action result.
 *
 *   return { ok: false, message: "That request could not be completed." };
 *   <Failure title="Something went wrong" />
 *
 * Both name nothing. Both render perfectly. Both leave a reader who has just
 * lost work with no idea whether to retry, wait, or start again.
 *
 * ## The bar
 *
 * §5 asks an error to do two things: name what failed, and say whether what is
 * still on screen is complete. This rule can only check the first, and it does
 * it the only way that holds without false positives — by matching the small
 * set of phrases that are, by construction, about nothing.
 *
 *   ✗  "Something went wrong."
 *   ✗  "That did not work."
 *   ✗  "That request could not be completed."
 *   ✓  "No organisation is registered at that address."
 *   ✓  "This page did not load. You have not been signed out."
 *
 * The second is longer, and that is not the point — "Sign in again." is short
 * and passes, because it names the thing to do.
 *
 * See CONTENT.md §10.7.
 */

/** Fields whose value is shown to a person when something fails. */
const FAILURE_FIELDS = new Set(["message", "title", "error", "detail", "reason", "problem"]);

/** JSX attributes that carry the same. */
const FAILURE_ATTRIBUTES = new Set(["title", "message", "error", "detail", "reason"]);

/**
 * Phrases whose whole content is "a thing happened".
 *
 * Anchored, so a message that opens with one and then says something —
 * "Something went wrong while publishing v4; nothing was saved" — is not
 * caught. That message is worse than it could be and better than this rule can
 * judge.
 */
const VAGUE = [
  /^something went wrong\.?$/i,
  /^an? error (has )?occurred\.?$/i,
  /^error!?\.?$/i,
  /^oops[!.]?$/i,
  /^(that|this|it) (did ?n[o']t|does not|doesn't) work\.?$/i,
  /^(that|this|the) (request|action|operation) (could not|couldn't|cannot) be (completed|processed)\.?$/i,
  /^(that|this) (failed|went wrong)\.?$/i,
  /^(unable to|failed to|could not) (complete|process|continue)\.?$/i,
  /^unexpected error\.?$/i,
  /^(request|operation|action) failed\.?$/i,
  /^try again(\s+later)?\.?$/i,
];

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require a failure message to name what failed.",
    },
    schema: [],
    messages: {
      vague:
        'Failure copy "{{text}}" names nothing. Say what failed and whether what is still on screen is complete — "No organisation is registered at that address", "This page did not load. Nothing was saved." See CONTENT.md §5.',
    },
  },

  create(context) {
    function report(node, raw) {
      if (typeof raw !== "string") return;
      const text = raw.trim();
      if (!text) return;
      if (!VAGUE.some((p) => p.test(text))) return;
      context.report({ node, messageId: "vague", data: { text } });
    }

    return {
      Literal(node) {
        const parent = node.parent;
        if (!parent) return;

        // `{ message: "…" }` — how a server action reports a refusal.
        if (parent.type === "Property" && parent.value === node && !parent.computed) {
          const key = parent.key?.name ?? parent.key?.value;
          if (typeof key === "string" && FAILURE_FIELDS.has(key)) report(node, node.value);
          return;
        }

        // `<Failure title="…">` — how a boundary renders one.
        if (parent.type === "JSXAttribute" && FAILURE_ATTRIBUTES.has(parent.name?.name)) {
          report(node, node.value);
          return;
        }

        // `["That did not work."]` inside a `problems` array.
        if (parent.type === "ArrayExpression") {
          const owner = parent.parent;
          if (owner?.type === "Property" && !owner.computed) {
            const key = owner.key?.name ?? owner.key?.value;
            if (key === "problems" || key === "errors") report(node, node.value);
          }
        }
      },

      /** A ternary result is still what the reader is handed. */
      ConditionalExpression(node) {
        const parent = node.parent;
        if (parent?.type !== "Property" || parent.computed) return;
        const key = parent.key?.name ?? parent.key?.value;
        if (typeof key !== "string" || !FAILURE_FIELDS.has(key)) return;

        for (const branch of [node.consequent, node.alternate]) {
          if (branch.type === "Literal") report(branch, branch.value);
        }
      },
    };
  },
};
