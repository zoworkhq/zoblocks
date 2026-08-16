/**
 * Refuse to publish this package with npm.
 *
 * The publishConfig block in package.json rewrites main/types/exports to
 * ./dist. That rewrite is a pnpm feature — npm honours only access, registry,
 * tag, and provenance. Publishing with npm therefore ships a package whose
 * entry points still say ./src/index.ts, and every consumer that does not
 * compile TypeScript out of node_modules breaks on install.
 *
 * This is not hypothetical: it is exactly what a local publish rehearsal
 * produced before this guard existed.
 *
 * Lives in a file rather than an inline `node -e` on purpose. npm runs scripts
 * through a shell, so backticks in an inline string are command substitutions,
 * not punctuation — an earlier inline version of this guard executed the very
 * commands it was trying to name.
 */

const agent = process.env.npm_config_user_agent || "";

if (!agent.includes("pnpm")) {
  console.error(
    [
      "",
      "  Refusing to publish: use pnpm, not npm.",
      "",
      "  publishConfig rewrites main/types/exports to ./dist, and that rewrite",
      "  is applied by pnpm only. Publishing with npm ships entry points that",
      "  point at ./src/index.ts, which breaks every plain-Node consumer.",
      "",
      "  Use one of:",
      "    pnpm publish",
      "    pnpm release        (builds, then runs changeset publish)",
      "",
      `  Detected user agent: ${agent || "(none)"}`,
      "",
    ].join("\n"),
  );
  process.exit(1);
}
