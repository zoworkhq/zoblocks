/**
 * Text placed in one cell of a GitHub-flavoured Markdown table.
 *
 * GFM splits a row on every `|` that is not escaped, and a backslash escapes
 * the character after it — so a cell has three things to neutralise, in this
 * order:
 *
 * 1. `\` → `\\`, first. Otherwise a value ending in a backslash, or holding
 *    `\|`, turns the `\|` added in step 2 into an escaped backslash followed
 *    by a bare pipe that splits the cell (CodeQL js/incomplete-sanitization).
 * 2. `|` → `\|`, so a union type like `"a" | "b"` stays one cell.
 * 3. Line breaks → a space. A row is one line; a newline ends it.
 *
 * Every column goes through this, not only the ones that usually hold pipes:
 * the values come from component metadata, and the table is read by agents
 * that trust its shape.
 */
export function tableCell(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
