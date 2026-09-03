/**
 * A number a reader can count, typed into a sentence.
 *
 * Every stale figure a content audit found on our own surfaces had this exact
 * shape — an integer written next to the noun it counts, in a string nobody
 * re-reads:
 *
 *   "27 components installed as source you own"     the catalogue held 30
 *   "Oxygen ships 27 components carrying 300-plus"  30, and 352
 *   "Twenty-two of the forty-four registry items"   26 of 50
 *   "All fourteen states"                           right, and hand-written
 *
 * Not one of them was wrong when it was typed. That is the whole argument for
 * a rule rather than a review note: the defect is introduced by the passage of
 * time, and review only looks at the diff.
 *
 * The fix the rule wants is always the same — derive it:
 *
 *   `${CATALOG.length} components`
 *   `${component.states.length} states`
 *
 * A template literal carrying an expression is therefore always valid, which
 * is what makes the rule teachable: the failing form and the passing form are
 * one keystroke apart.
 *
 * ## What it deliberately does not catch
 *
 * Rhetorical numbers, where the figure is doing prose work rather than
 * reporting a quantity — "twelve hours of a record being wrong", "eleven
 * browser tabs whose titles truncate". Those are caught only if the noun that
 * follows is one of the countable nouns below, and that list is deliberately
 * short: it names things this repository can count with an expression.
 *
 * "one" and "a" are excluded outright. "Install one component" is an
 * instruction, not a census.
 *
 * See CONTENT.md §10.1.
 */

/**
 * Nouns this repository can count, so a literal beside one has a derived form.
 *
 * Kept narrow on purpose. A rule that fires on every number in prose is a rule
 * everybody disables — and the four real defects all landed on this handful.
 */
const COUNTABLE = [
  "components?",
  "states?",
  "registry items?",
  "items?",
  "props?",
  "packs?",
  "loaders?",
  "variants?",
  "categories",
  "glyphs?",
];

/**
 * Number words from two upwards, including the hyphenated compounds.
 *
 * "one" is absent: it is almost always an article in disguise.
 */
const WORDS =
  "(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:-(?:one|two|three|four|five|six|seven|eight|nine))?" +
  "|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|hundred";

const COUNT = new RegExp(
  // A digit run of any length, or a spelled-out number, optionally carrying a
  // vague suffix — "300-plus documented states" was one of the real defects.
  String.raw`\b(\d{2,}|${WORDS})(?:-plus|\+)?\s+` +
    /*
     * Up to two adjectives between the number and its noun — "27 accessible
     * components", "300-plus documented states".
     *
     * Determiners are excluded, and that exclusion is load-bearing: without
     * it "after eight seconds the loader stops" parsed as a count of loaders,
     * because "seconds the" filled the adjective slots. A determiner between
     * a number and a noun means the number belongs to something else.
     */
    String.raw`(?:(?!(?:the|a|an|of|in|on|and|or)\s)[a-z]+(?:-[a-z]+)?\s+){0,2}` +
    String.raw`(${COUNTABLE.join("|")})\b`,
  "i",
);

/** Text that is an address, a selector or a command rather than a sentence. */
function isMachineText(text) {
  if (/^https?:\/\//.test(text)) return true;
  if (/^[./@]/.test(text)) return true;
  if (/^[a-z-]+:/.test(text)) return true;

  /*
   * A Tailwind class list.
   *
   * Detected by shape rather than by punctuation. The first attempt required
   * the string to contain no sentence punctuation, and `gap-1.5` has a full
   * stop in it — so every class list with a fractional spacing token fell
   * through and `z-10 inline-flex items-center` was read as "10 … items".
   *
   * Utility tokens carry a hyphen, a colon or a slash; English words do not.
   * A class list is almost entirely such tokens and a sentence is almost none,
   * so the ratio separates them with a wide margin either side of the
   * threshold.
   */
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return false;
  const utility = tokens.filter((t) => /[-:/[]/.test(t)).length;
  return utility / tokens.length >= 0.6;
}

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a countable figure in user-visible copy to be derived rather than typed.",
    },
    schema: [
      {
        type: "object",
        properties: {
          /**
           * Extra nouns to treat as countable, for a surface with its own.
           */
          countable: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcoded:
        'Hardcoded count "{{match}}" in user-visible copy. A number a reader can count goes stale the moment the thing it counts changes — derive it (`${{{suggestion}}}.length} {{noun}}`) or replace it with a qualifier that cannot be wrong by one ("about half", "every"). See CONTENT.md §10.1.',
    },
  },

  create(context) {
    const extra = context.options[0]?.countable ?? [];
    const pattern = extra.length
      ? new RegExp(
          COUNT.source.replace(COUNTABLE.join("|"), [...COUNTABLE, ...extra].join("|")),
          "i",
        )
      : COUNT;

    /** A suggestion for the message, chosen from the noun that was counted. */
    function suggest(noun) {
      const n = noun.toLowerCase();
      if (n.startsWith("component")) return "CATALOG";
      if (n.startsWith("state")) return "component.states";
      if (n.startsWith("prop")) return "component.props";
      return "items";
    }

    function check(node, text) {
      if (typeof text !== "string") return;
      const trimmed = text.trim();
      if (!trimmed || isMachineText(trimmed)) return;

      const found = pattern.exec(trimmed);
      if (!found) return;

      context.report({
        node,
        messageId: "hardcoded",
        data: {
          match: found[0],
          noun: found[2],
          suggestion: suggest(found[2]),
        },
      });
    }

    return {
      Literal(node) {
        // A property key, an import source and a JSX className are not copy.
        const parent = node.parent;
        if (parent?.type === "Property" && parent.key === node && !parent.computed) return;
        if (parent?.type === "ImportDeclaration" || parent?.type === "ImportExpression") return;
        if (parent?.type === "JSXAttribute") {
          const name = parent.name?.name;
          if (name === "className" || name === "class" || name === "key" || name === "href") return;
        }
        check(node, node.value);
      },

      JSXText(node) {
        check(node, node.value);
      },

      /**
       * A template literal with no expression is a string that merely looks
       * derived. One with an expression is the fix, and is always allowed —
       * including when part of it is still typed, because the author has
       * already reached for the mechanism and a second count beside a derived
       * one is a judgement call rather than a defect.
       */
      TemplateLiteral(node) {
        if (node.expressions.length > 0) return;
        check(node, node.quasis.map((q) => q.value.cooked ?? "").join(""));
      },
    };
  },
};
