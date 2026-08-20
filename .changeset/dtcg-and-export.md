---
"@oxygenui-design/tokens": minor
"@oxygenui-design/theme": minor
---

DTCG spec compliance at the boundary, and themes in five formats.

**The format fix.** `dimension`, `duration`, `cubicBezier` and `shadow` are
structured objects in the W3C spec and CSS strings in our source, and the loader
coerced with `String($value)` — so a spec-compliant file parsed to
`"[object Object]"`, emitted a custom property with a meaningless value, and
rendered as nothing. No error, no warning, no failing test.

Fixed at the edges rather than in the middle: internally a token value stays a
CSS string, because that is what the emitters need. What changed is that
**export serialises to the spec form and import reads it**, so a customer's file
round-trips through Tokens Studio, Style Dictionary v4 or Figma Variables and
comes back meaning the same thing. Proven over all 543 shipped tokens: out to
the spec form and back, byte-identical.

**Five exports.** DTCG, CSS, Tailwind `@theme`, an antd `ConfigProvider` token
object, and an MUI `createTheme` call. The last two are the bridge mapping
tables run backwards — a bridge reads `colorPrimary` and writes `--ox-accent`;
the export reads the accent and writes `colorPrimary` — so a customer can theme
their _own_ antd or MUI components from the brand they configured once, and the
correspondence stays correct automatically when a bridge is corrected.

**Import** reads DTCG, Tokens Studio and an existing antd or MUI theme object.
Clinical tokens found in a file are discarded and _reported_, before
confirmation: a customer whose file contained a status colour needs to know it
did not take effect, or the first they hear of it is a support conversation
about a red that did not change.
