/**
 * Tests for the tabs semantic-mode rule.
 *
 * As with the signature rule, the `valid` cases carry the weight. Anything
 * this rule cannot fully analyse — a spread, a variable, a mapped array — it
 * must stay silent about, because a rule that fires on correct code gets
 * disabled wholesale and then protects nothing at all.
 */

import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";
import tabsSemanticMode from "./tabs-semantic-mode.js";

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

ruleTester.run("tabs-semantic-mode", tabsSemanticMode, {
  valid: [
    // Every mode, spelled out.
    { code: 'const a = <Tabs as="tabs" items={items} />;' },
    { code: 'const a = <Tabs as="radiogroup" items={items} />;' },
    { code: 'const a = <Tabs as="steps" items={items} />;' },
    { code: 'const a = <Tabs as="nav" items={[{ value: "a", href: "/a" }]} />;' },

    // The compound root, both spellings.
    { code: 'const a = <TabsRoot as="tabs" />;' },
    { code: 'const a = <Tabs.Root as="tabs" />;' },

    // Links belong under nav.
    {
      code: 'const a = <Tabs as="nav" items={[{ value: "a", href: "/a" }, { value: "b", href: "/b" }]} />;',
    },

    // Wrap is legal in exactly one place.
    { code: 'const a = <Tabs as="radiogroup" overflow="wrap" items={items} />;' },
    { code: 'const a = <Tabs as="tabs" overflow="menu" items={items} />;' },
    { code: 'const a = <Tabs as="tabs" overflow="scroll" items={items} />;' },

    // An unrelated component that happens to have an `as` prop, or none.
    { code: 'const a = <Box as="section" />;' },
    { code: "const a = <Table items={items} />;" },

    // Not statically analysable. Guessing here produces false positives on
    // perfectly correct code.
    { code: "const a = <Tabs {...props} />;" },
    { code: "const a = <Tabs as={mode} items={[{ value: 'a', href: '/a' }]} />;" },
    { code: 'const a = <Tabs as={isNav ? "nav" : "tabs"} />;' },
    { code: 'const a = <Tabs as="nav" items={sections.map(toItem)} />;' },
    { code: 'const a = <Tabs as="nav" items={items} />;' },
    { code: 'const a = <Tabs as="tabs" overflow={strategy} items={items} />;' },
    // An empty literal array tells us nothing about hrefs either way.
    { code: 'const a = <Tabs as="nav" items={[]} />;' },
  ],

  invalid: [
    {
      // The default that does not exist, and must not.
      code: "const a = <Tabs items={items} />;",
      errors: [{ messageId: "missingMode" }],
    },
    {
      code: 'const a = <Tabs.Root defaultValue="x" />;',
      errors: [{ messageId: "missingMode" }],
    },
    {
      code: 'const a = <Tabs as="tab" items={items} />;',
      errors: [{ messageId: "unknownMode" }],
    },
    {
      // The defect the whole component exists to prevent: a tablist of links.
      code: 'const a = <Tabs as="tabs" items={[{ value: "a", label: "A", href: "/a" }]} />;',
      errors: [{ messageId: "hrefWithoutNav" }],
    },
    {
      code: 'const a = <Tabs as="radiogroup" items={[{ value: "a", href: "/a" }]} />;',
      errors: [{ messageId: "hrefWithoutNav" }],
    },
    {
      code: 'const a = <Tabs as="steps" items={[{ value: "a", href: "/a" }]} />;',
      errors: [{ messageId: "hrefWithoutNav" }],
    },
    {
      // Quoted key, same problem.
      code: 'const a = <Tabs as="tabs" items={[{ "href": "/a" }]} />;',
      errors: [{ messageId: "hrefWithoutNav" }],
    },
    {
      code: 'const a = <Tabs as="nav" items={[{ value: "a", label: "A" }]} />;',
      errors: [{ messageId: "navWithoutHref" }],
    },
    {
      code: 'const a = <Tabs as="tabs" overflow="wrap" items={items} />;',
      errors: [{ messageId: "wrapOutsideRadiogroup" }],
    },
    {
      code: 'const a = <Tabs as="steps" overflow="wrap" />;',
      errors: [{ messageId: "wrapOutsideRadiogroup" }],
    },
    {
      // Two independent problems, both reported.
      code: 'const a = <Tabs as="tabs" overflow="wrap" items={[{ href: "/a" }]} />;',
      errors: [{ messageId: "hrefWithoutNav" }, { messageId: "wrapOutsideRadiogroup" }],
    },
  ],
});
