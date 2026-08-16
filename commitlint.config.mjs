/**
 * Conventional Commits, enforced.
 *
 * CONTRIBUTING.md asks for them; nothing checked. A commit convention that is
 * only documented produces a changelog nobody can generate and a history nobody
 * can bisect by intent.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // The scope is the package or component the change belongs to. Optional,
    // because a repo-wide change genuinely has none.
    "scope-case": [2, "always", "kebab-case"],
    "subject-case": [2, "never", ["upper-case", "pascal-case", "start-case"]],
    // Long enough to say what changed, short enough to read in a log.
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 100],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "test", "refactor", "perf", "build", "ci", "chore", "revert"],
    ],
  },
};
