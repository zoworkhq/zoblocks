/**
 * Tests for the signature typed-path rule.
 *
 * The `valid` cases carry the weight. A rule that fires on anything it cannot
 * fully analyse — a spread, a variable, a prop on an unrelated component — gets
 * disabled wholesale, and then it protects nothing. Every valid entry below is
 * a shape the rule must stay quiet about.
 */

import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";
import signatureRequiresTypedPath from "./signature-requires-typed-path.js";

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

ruleTester.run("signature-requires-typed-path", signatureRequiresTypedPath, {
  valid: [
    // The default includes "type", so saying nothing is correct.
    { code: "const a = <Signature now={now} />;" },
    { code: 'const a = <Signature methods={["draw", "type", "upload"]} />;' },
    { code: 'const a = <Signature methods={["type"]} />;' },
    { code: 'const a = <SignatureModal methods={["type", "draw"]} />;' },
    { code: 'const a = <SignaturePad methods={["type"]} />;' },

    // A different component that happens to have a `methods` prop.
    { code: 'const a = <HttpClient methods={["GET", "POST"]} />;' },

    // Not statically analysable. Guessing here would produce false positives
    // on perfectly correct code, and a rule that cries wolf gets turned off.
    { code: "const a = <Signature methods={allowedMethods} />;" },
    { code: 'const a = <Signature methods={[...base, "draw"]} />;' },
    { code: "const a = <Signature methods={[DRAW, TYPE]} />;" },
    { code: 'const a = <Signature methods={cond ? ["type"] : ["draw"]} />;' },
    { code: 'const a = <Signature {...{ methods: ["draw"] }} />;' },
  ],

  invalid: [
    {
      // The whole point: renders perfectly, passes every other test, and is
      // unusable by anyone who cannot hold a stylus.
      code: 'const a = <Signature methods={["draw"]} />;',
      errors: [{ messageId: "missingTyped" }],
    },
    {
      code: 'const a = <Signature methods={["draw", "upload"]} />;',
      errors: [{ messageId: "missingTyped" }],
    },
    {
      code: 'const a = <SignatureModal methods={["draw"]} />;',
      errors: [{ messageId: "missingTyped" }],
    },
    {
      // Upload alone is worse than draw alone — it needs a file that already
      // has a signature in it.
      code: 'const a = <Signature methods={["upload"]} />;',
      errors: [{ messageId: "missingTyped" }],
    },
    {
      code: "const a = <Signature methods={[]} />;",
      errors: [{ messageId: "emptyMethods" }],
    },
  ],
});
