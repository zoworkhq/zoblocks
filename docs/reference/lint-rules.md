# Lint rules

Eighteen rules enforcing the invariants Oxygen is built around. Worth running in
your repository too — the source is yours once it lands, and every defect these
catch **renders perfectly**.

← [How to start](../how-to-start.md)

---

## Install

```bash
npm i -D @oxygenui-design/eslint-plugin
```

```js
// eslint.config.mjs
import oxygen from "@oxygenui-design/eslint-plugin";

export default [
  {
    files: ["src/components/oxygen/**/*.{ts,tsx}"],
    ...oxygen.configs.components,
  },
];
```

The `components` preset is what this repository runs on its own registry source.
Point it at the directory the CLI installs into; whether you extend it to your
own components is your call, and most of the rules are worth extending.

Flat config only. The plugin has no dependencies.

---

## What the preset enforces

### Errors — each one prevents a defect that renders perfectly

| Rule                            | What it catches                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-absence-placeholder`        | `{value ?? "—"}`. A blank cell is indistinguishable from a rendering bug; _why_ a value is missing is part of the value.                        |
| `no-primitive-token`            | A component reaching past `--ox-status-critical` to `--ox-red-600`, which ignores every brand override.                                         |
| `no-dynamic-class-name`         | An interpolated Tailwind class. It produces no CSS and no error, and the severity styling vanishes.                                             |
| `no-forbidden-capability`       | A component reaching for a capability its layer may not have.                                                                                   |
| `identity-requires-stable-key`  | Identity rendered without a stable key — the wrong-patient defect.                                                                              |
| `no-room-number-identifier`     | A room or bed number used as a patient identifier. It is not one.                                                                               |
| `no-truncated-identity`         | A patient name or identifier truncated to fit.                                                                                                  |
| `signature-requires-typed-path` | A draw-only signature pad — a WCAG Level A failure that passes every other test.                                                                |
| `require-accordion-summary`     | A severity rail with no words beside it, which deletes the signal in forced-colors, in print, and for anyone unable to separate red from green. |
| `switch-needs-commit-strategy`  | A switch inside a form that submits, promising something it does not do.                                                                        |
| `no-disabled-with-reason`       | `disabled` beside a reason, which throws the reason away.                                                                                       |
| `switch-audit-needs-now`        | An audit event stamped with nothing is not an audit trail.                                                                                      |
| `tabs-semantic-mode`            | A tablist of links. It passes every automated checker and destroys a keyboard user's focus on the first arrow key.                              |

### Warnings — by design, not by transition

| Rule                         | Why a warning                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `no-heading-level-drift`     | It can only see lexical nesting; a nested accordion composed through a variable is invisible to it.                                        |
| `no-ambiguous-clinical-copy` | Every phrase it catches has a legitimate use somewhere. The rule exists to make the author look once, not to forbid a word.                |
| `no-stigmatising-language`   | Same reasoning, higher stakes. A patient's own words are exempt, and the alternative is always offered rather than the term merely banned. |
| `switch-not-for-questions`   | A question-shaped label is sometimes right for a control that holds one answer. The rule makes you reach for `segmented` deliberately.     |
| `prefer-logical-properties`  | Warn while the catalog is converted; becomes an error in Phase 1. See ADR 0008.                                                            |

---

## Why lint rather than review

The four ideas Oxygen is built on are each enforced by something that fails:

| The idea                       | What enforces it                     |
| ------------------------------ | ------------------------------------ |
| Absence is a state             | `no-absence-placeholder`             |
| Never colour alone             | the contrast gate in the token build |
| Don't infer clinical meaning   | component contract tests             |
| Semantic tokens, never palette | `no-primitive-token`                 |

A review comment catches a defect once. A rule catches it every time, including
in the pull request nobody had time to read carefully — which is the one where
it matters.

---

- [Theming](theming.md) — the token contract these rules protect
- [Styles and Tailwind](styles-and-tailwind.md) — the interpolated-class failure in full
- [`ENGINEERING.md`](../../ENGINEERING.md) — the standard behind all of it
