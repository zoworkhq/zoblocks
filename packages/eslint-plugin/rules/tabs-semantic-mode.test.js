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
    // antd's Tabs is a different component that happens to share the name and
    // has no `as` prop. Demanding one would forward an unknown property to the
    // DOM, and a rule that flags code which cannot comply gets disabled
    // wholesale — after which it protects nothing.
    {
      code: `import { Tabs } from "antd";\nconst a = <Tabs items={items} />;`,
    },
    {
      code: `import { Modal, Tabs } from "antd";\nconst a = <Tabs activeKey={k} onChange={f} />;`,
    },
    // A relative or @/ import is ours, and still has to declare itself — the
    // registry copies components in under those specifiers.
    {
      code: `import { Tabs } from "./tabs";\nconst a = <Tabs as="tabs" items={items} />;`,
    },
    // Every mode, spelled out.
    { code: 'const a = <Tabs as="tabs" items={items} />;' },
    { code: 'const a = <Tabs as="radiogroup" items={items} />;' },
    { code: 'const a = <Tabs as="steps" items={items} />;' },
    { code: 'const a = <Tabs as="nav" items={[{ value: "a", href: "/a" }]} />;' },

    // Somebody else's Tabs. antd exports one, it has no `as` prop, and
    // demanding a prop the component does not accept is worse advice than
    // silence. This is the case that fired on SignatureModal.tsx.
    //
    // Every import shape the specifier check has to see through: named,
    // named-among-others, default, and aliased.
    { code: 'import { Tabs } from "antd";\nconst a = <Tabs id="x" items={items} />;' },
    { code: 'import { Tabs, Modal } from "antd";\nconst a = <Tabs items={items} />;' },
    { code: 'import Tabs from "rc-tabs";\nconst a = <Tabs items={items} />;' },
    { code: 'import { Tabs as Foo } from "antd";\nconst a = <Tabs items={items} as="tabs" />;' },

    // ZoBlocks's own Tabs is still required to declare itself, however it is
    // imported — otherwise the fix above would disable the rule everywhere.
    {
      code: 'import { Tabs } from "@zoblocks/react";\nconst a = <Tabs as="tabs" items={items} />;',
    },
    {
      code: 'import { Tabs } from "./tabs.js";\nconst a = <Tabs as="nav" items={[{ href: "/a" }]} />;',
    },

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
    // A spread item could carry the href, so a missing one is a guess.
    { code: 'const a = <Tabs as="nav" items={[{ ...home }, { ...billing }]} />;' },
    { code: 'const a = <Tabs as="nav" items={[{ ...home, value: "a" }]} />;' },
    // An empty literal array tells us nothing about hrefs either way.
    { code: 'const a = <Tabs as="nav" items={[]} />;' },
  ],

  invalid: [
    // Imported from a workspace package: still ours, still required.
    {
      code: 'import { Tabs } from "@zoblocks/react";\nconst a = <Tabs items={items} />;',
      errors: [{ messageId: "missingMode" }],
    },
    // Relative import: ours.
    {
      code: 'import { Tabs } from "../tabs.js";\nconst a = <Tabs items={items} />;',
      errors: [{ messageId: "missingMode" }],
    },
    // An antd import elsewhere in the file must not launder an unqualified
    // Tabs that came from somewhere else.
    {
      code: 'import { Modal } from "antd";\nconst a = <Tabs items={items} />;',
      errors: [{ messageId: "missingMode" }],
    },
    {
      // The default that does not exist, and must not.
      code: "const a = <Tabs items={items} />;",
      errors: [{ messageId: "missingMode" }],
    },
    {
      // Ours, by package specifier — the rule still applies.
      code: 'import { Tabs } from "@zoblocks/tabs";\nconst a = <Tabs items={items} />;',
      errors: [{ messageId: "missingMode" }],
    },
    {
      // Ours, by relative path — the tabs package's own source and stories.
      code: 'import { Tabs } from "./tabs";\nconst a = <Tabs items={items} />;',
      errors: [{ messageId: "missingMode" }],
    },
    {
      // Ours, by the specifier the ZoBlocks CLI writes into a consumer project.
      code: 'import { Tabs } from "@/components/zoblocks/tabs";\nconst a = <Tabs items={items} />;',
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
