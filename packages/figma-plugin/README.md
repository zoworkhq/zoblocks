# ZoBlocks

ZoBlocks's design system, inside Figma. Three things:

- **Check** — reads the variables already in the open file and measures them
  with the same code the build and the publish gate run. Needs no account.
- **Pull** — a published theme becomes variables, previewed before anything is
  written.
- **Propose** — one brand colour goes to the app as a draft.

`manifest.json` allows exactly one origin in production and no wildcard. The
sandbox has no `fetch` at all; the iframe has the network. The key lives in
`figma.clientStorage`, never in the document — plugin data travels with a file,
so a token written there reaches every branch, every duplicate, and every copy
handed to an agency.

Two things it cannot do, and both are enforced by the API surface in
`src/sandbox/api.ts` declaring no such call rather than by a check somebody
could remove: **it cannot delete anything** — not a variable, not a mode, not a
collection — and **it cannot publish**, neither a Figma library nor a theme
version.

## Running it

```bash
pnpm --filter @zoblocks/figma-plugin build
```

Then in Figma: **Plugins → Development → Import plugin from manifest**, and
choose `packages/figma-plugin/manifest.json`. The manifest points at `dist/`,
which is not committed, so the build has to run first.

Against a local app, the address is `http://localhost:6003` — allowed by
`devAllowedDomains`, which is deliberately not `allowedDomains`. A published
plugin that may talk to whatever is listening on a designer's own machine is a
different product.

## Connecting

Mint a key in the app at **Market → Tokens** with the scope set to _Themes,
for the Figma plugin_, then paste it with the app address. `apps/app/
PLUGIN-API.md` covers what the key can reach; the short version is that it reads
themes and proposes a brand anchor, cannot install purchased components, and
never exceeds the role of the person who minted it.

## The two readings, and why there are two

**ZoBlocks** — the collection carries variables stamped with ZoBlocks token names,
so the plugin knows which colour is text and which is the ground beneath it. It
measures `CONTRAST_PAIRS` and `STATUS_PAIRS` from the validator, at the floors
`floorForPair` and `floorFor` impose, and reports hue separation between
`status.high` and `status.low` as a separate finding — two colours can both
clear 4.5:1 and still be indistinguishable to a reader with deuteranopia.

**Palette** — nothing in the collection carries a ZoBlocks stamp. The pairs are
therefore unknown, and pairing swatches by guesswork would produce a confident
number about a combination nobody will render. So the designer names a ground
and says whether the colours are text (SC 1.4.3, 4.5:1) or interface components
(SC 1.4.11, 3:1), and everything is measured against that.

The panel always says which of the two it gave. A passing palette measurement is
not the same claim as a passing theme.

## Structure

| File                  | Runs in | Holds                                            |
| --------------------- | ------- | ------------------------------------------------ |
| `src/gate.ts`         | neither | Every rule. Pure; no `figma`, no DOM.            |
| `src/snapshot.ts`     | neither | The two questions both halves ask of a snapshot. |
| `src/protocol.ts`     | both    | The messages, and the narrowing that reads them. |
| `src/sandbox/api.ts`  | sandbox | The Figma calls this plugin holds. Read-only.    |
| `src/sandbox/read.ts` | sandbox | Variables → the plain snapshot.                  |
| `src/ui/*`            | iframe  | Controls, rendering, copying.                    |

A plugin runs across two isolated contexts — a sandbox with the Figma API and no
networking, an iframe with networking and no Figma API — and neither is pleasant
to test. Keeping every rule out of both is what makes the halves thin enough to
have no conditionals worth testing, and it is the same trade `bridge-core` makes
to serve antd and MUI from one contract.

`api.ts` declares only the read calls, so a write is a compile error rather than
something a reviewer has to notice. Phase 4 is where this plugin earns the right
to write to somebody's file, and it earns it by previewing every change first —
which is also why the panel _offers_ a nearest-passing colour rather than
applying one.

## What the tests protect

- **Parity.** The ratio the panel shows a designer is the ratio inside the
  message the publish gate would print, and the ratio the conformance table
  publishes, for the same colours. Two answers to one question is the failure
  sharing a validator exists to prevent.
- **Identity.** A renamed variable is still measured; a swatch named `accent`
  that claims nothing is not.
- **Its own panel.** `panel-contrast.test.ts` measures this interface with the
  thing this interface measures. It found `--rule-strong` — the border of every
  control, and so an SC 1.4.11 surface — at 1.63:1 the first time it ran.
- **Writes, counted.** `test/fake-figma.ts` records every call rather than only
  the values afterwards, because "pull twice writes nothing" is a claim about
  writes. A run that sets each variable to the value it already had reaches the
  same end state and churns the history.
- **The claims in the manifest.** One origin, no wildcard, localhost only in the
  development list, no `fetch` in the sandbox, no credential in plugin data, and
  a client that can build exactly three URLs and issue exactly one POST.

## See also

`content/decisions/0015-the-direction-of-truth-for-design-tool-sync.md` records
which side owns each tier, and why push is one brand anchor rather than a
palette.
