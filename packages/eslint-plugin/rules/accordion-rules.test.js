/**
 * Tests for the two accordion rules.
 *
 * The `valid` cases carry the weight. A rule that fires on anything it cannot
 * fully analyse — a spread, a variable, an object that merely happens to have a
 * `severity` field — gets disabled wholesale, and then it protects nothing.
 * Every valid entry below is a shape the rule must stay quiet about.
 */

import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";
import requireAccordionSummary from "./require-accordion-summary.js";
import noHeadingLevelDrift from "./no-heading-level-drift.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("require-accordion-summary", requireAccordionSummary, {
  valid: [
    // Severity and summary together — the shape the rule exists to require.
    {
      code: 'const i = { key: "a", label: "A", severity: "critical", summary: "C-SSRS positive" };',
    },
    {
      code: 'const i = { key: "a", label: "A", severity: "high", summary: <Chip>ANC due</Chip> };',
    },

    // No severity, no rail, nothing to pair.
    { code: 'const i = { key: "a", label: "A" };' },
    { code: 'const i = { key: "a", label: "A", children: <p>x</p> };' },

    // `extra` is rendered beside the header and counts.
    { code: 'const i = { key: "a", label: "A", severity: "low", extra: <Button /> };' },

    // ChartSection names the slot `status`; it is composed into the chip that
    // sits beside the rail, so it satisfies the same requirement.
    {
      code: 'const i = { key: "a", label: "A", severity: "critical", status: "C-SSRS positive" };',
    },
    {
      code: 'const i = { key: "a", label: "A", severity: "unknown", status: "Not asked this visit" };',
    },

    // Not an accordion item — a log record, a chart datum, an alert config.
    { code: 'const e = { severity: "critical", message: "disk full" };' },
    { code: 'const e = { severity: "high", at: "2026-08-16" };' },
    { code: 'const e = { label: "A", severity: "critical" };' },
    { code: 'const e = { key: "a", severity: "critical" };' },

    // Not statically analysable. Guessing produces false positives on correct
    // code, and a rule that cries wolf gets turned off.
    { code: 'const i = { ...base, key: "a", label: "A", severity: "critical" };' },
    { code: 'const i = { key: "a", label: "A", severity: "critical", ...withSummary };' },
    { code: 'const i = { key: "a", label: "A", severity: sev, summary: text };' },
  ],

  invalid: [
    {
      // The whole point: renders perfectly, passes every other test, and is a
      // red rail with nothing beside it.
      code: 'const i = { key: "risk", label: "Risk", severity: "critical" };',
      errors: [{ messageId: "missing", data: { severity: "critical" } }],
    },
    {
      code: 'const i = { key: "a", label: "A", severity: "high", children: <p>x</p> };',
      errors: [{ messageId: "missing" }],
    },
    {
      // Written longhand is still an omission.
      code: 'const i = { key: "a", label: "A", severity: "low", summary: undefined };',
      errors: [{ messageId: "missing" }],
    },
    {
      // A computed severity is still a severity.
      code: 'const i = { key: "a", label: "A", severity: sev };',
      errors: [{ messageId: "missing", data: { severity: "(computed)" } }],
    },
    {
      code: `const items = [
        { key: "a", label: "A", severity: "critical", summary: "ok" },
        { key: "b", label: "B", severity: "high" },
      ];`,
      errors: [{ messageId: "missing", data: { severity: "high" } }],
    },
  ],
});

ruleTester.run("no-heading-level-drift", noHeadingLevelDrift, {
  valid: [
    // Top level. The default of 3 is correct here.
    { code: "const a = <Accordion items={items} />;" },
    { code: "const a = <ChartAccordion sections={sections} />;" },

    // Nested, and says so.
    {
      code: `const a = (
        <Accordion headingLevel={2} items={[{ key: "p", label: "Plan", children: (
          <Accordion headingLevel={3} items={inner} />
        ) }]} />
      );`,
    },
    {
      code: `const a = (
        <ChartAccordion headingLevel={2} sections={[{ key: "p", label: "P", children: (
          <Accordion headingLevel={3} items={inner} />
        ) }]} />
      );`,
    },

    // A spread might carry it; staying quiet is right.
    {
      code: `const a = (
        <Accordion headingLevel={2} items={[{ key: "p", label: "P", children: (
          <Accordion {...rest} items={inner} />
        ) }]} />
      );`,
    },

    // Siblings, not nested.
    {
      code: `const a = (
        <div>
          <Accordion items={a} />
          <Accordion items={b} />
        </div>
      );`,
    },

    // Not an accordion.
    {
      code: `const a = (
        <Accordion items={[{ key: "p", label: "P", children: <Tabs items={inner} /> }]} />
      );`,
    },
  ],

  invalid: [
    {
      // Both emit h3, and the goals appear to be siblings of the plan.
      code: `const a = (
        <Accordion headingLevel={2} items={[{ key: "p", label: "Plan", children: (
          <Accordion items={inner} />
        ) }]} />
      );`,
      errors: [{ messageId: "drift", data: { inner: "Accordion", outer: "Accordion" } }],
    },
    {
      code: `const a = (
        <ChartAccordion sections={[{ key: "p", label: "P", children: (
          <SafetyPlan steps={steps} />
        ) }]} />
      );`,
      errors: [{ messageId: "drift", data: { inner: "SafetyPlan", outer: "ChartAccordion" } }],
    },
    {
      // Three deep: the middle one is reported against the outer, the inner
      // against the middle.
      code: `const a = (
        <Accordion headingLevel={1} items={[{ key: "a", label: "A", children: (
          <Accordion items={[{ key: "b", label: "B", children: (
            <Accordion items={inner} />
          ) }]} />
        ) }]} />
      );`,
      errors: [{ messageId: "drift" }, { messageId: "drift" }],
    },
    {
      code: `const a = (
        <Accordion headingLevel={2} items={[{ key: "p", label: "P", children: (
          <ZoBlocks.Accordion items={inner} />
        ) }]} />
      );`,
      errors: [{ messageId: "drift" }],
    },
  ],
});
