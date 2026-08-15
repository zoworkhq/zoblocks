/**
 * Where a string literal sits in a JSX tree, which is what decides whether it
 * is copy a reader sees or a value the machine compares.
 *
 * Shared by the two content rules. Getting this wrong in either direction is
 * costly: too broad and the rule fires on `state === "failed"` and on React
 * keys, which trains everyone to ignore it; too narrow and it misses the
 * `value ?? "—"` it exists for.
 */

/** JSX attributes whose value is prose a human reads. */
const PROSE_ATTRIBUTES = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "consequence",
  "description",
  "hint",
  "label",
  "message",
  "placeholder",
  "summary",
  "title",
]);

/**
 * Node types a value may pass through on its way to being rendered.
 *
 * A BinaryExpression is deliberately absent: `state === "failed"` compares, it
 * does not render. That single omission is what stops this rule firing on every
 * discriminated-union check in the codebase.
 */
const TRANSPARENT = new Set(["ConditionalExpression", "LogicalExpression", "TemplateLiteral"]);

/**
 * Walks from a literal up to the JSX construct that renders it.
 *
 * Returns the JSXExpressionContainer or JSXAttribute it lands in, or undefined
 * if the value is consumed by something else on the way — a comparison, a call,
 * an object property.
 */
function renderTarget(context, node) {
  const ancestors = context.sourceCode.getAncestors(node);

  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const parent = ancestors[i];

    if (parent.type === "JSXExpressionContainer" || parent.type === "JSXAttribute") {
      return { target: parent, container: ancestors[i - 1] };
    }
    if (!TRANSPARENT.has(parent.type)) return undefined;
  }

  return undefined;
}

/** The name of the attribute a target belongs to, if it belongs to one. */
function attributeName(target, container) {
  if (target.type === "JSXAttribute") return target.name?.name;
  if (container?.type === "JSXAttribute") return container.name?.name;
  return undefined;
}

/**
 * True when the literal is what gets rendered because a value was missing.
 *
 *   {value ?? "—"}              ✓  the dash substitutes for the value
 *   {value ? value : "N/A"}     ✓  same thing, spelled longer
 *   <span>— {explanation}</span> ✗  the dash separates two rendered things
 *   key={`${a ?? "?"}-${b}`}     ✗  never reaches a reader
 *
 * The separator case is the reason this is narrower than "any literal in JSX".
 * A dash between a name and a role is typography; a dash standing where a value
 * should be is a missing clinical fact rendered as punctuation.
 */
export function isValueSubstitute(context, node) {
  const ancestors = context.sourceCode.getAncestors(node);
  const parent = ancestors[ancestors.length - 1];
  if (!parent) return false;

  const substituting =
    (parent.type === "LogicalExpression" &&
      (parent.operator === "??" || parent.operator === "||") &&
      parent.right === node) ||
    (parent.type === "ConditionalExpression" &&
      (parent.consequent === node || parent.alternate === node));

  if (!substituting) return false;

  const found = renderTarget(context, node);
  if (!found) return false;

  const name = attributeName(found.target, found.container);
  // A key or a className is not read by anyone.
  if (name && !PROSE_ATTRIBUTES.has(name)) return false;
  return true;
}

/**
 * True when the literal is prose a reader sees — JSX text, a prose attribute,
 * or a string rendered directly as a child.
 */
export function isProse(context, node) {
  if (node.type === "JSXText") return true;

  const found = renderTarget(context, node);
  if (!found) return false;

  const name = attributeName(found.target, found.container);
  if (name) return PROSE_ATTRIBUTES.has(name);

  // No attribute: a child expression container, e.g. <span>{"Normal"}</span>.
  return found.target.type === "JSXExpressionContainer";
}
