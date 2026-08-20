# Oxygen — contrast

Oxygen's accessibility gate, running inside Figma. It reads the variables
already in the open file, measures them with the same code the build and the
publish gate run, and reports what fails, by how much, and what would fix it.

No account, no network, no sync. `manifest.json` declares
`networkAccess: { allowedDomains: ["none"] }`, and a test over the source keeps
that declaration honest — there is no `fetch`, no `XMLHttpRequest`, no dynamic
`import()` anywhere in it.

## Running it

```bash
pnpm --filter @oxygenui-design/figma-plugin build
```

Then in Figma: **Plugins → Development → Import plugin from manifest**, and
choose `packages/figma-plugin/manifest.json`. The manifest points at `dist/`,
which is not committed, so the build has to run first.

## The two readings, and why there are two

**Oxygen** — the collection carries variables stamped with Oxygen token names,
so the plugin knows which colour is text and which is the ground beneath it. It
measures `CONTRAST_PAIRS` and `STATUS_PAIRS` from the validator, at the floors
`floorForPair` and `floorFor` impose, and reports hue separation between
`status.high` and `status.low` as a separate finding — two colours can both
clear 4.5:1 and still be indistinguishable to a reader with deuteranopia.

**Palette** — nothing in the collection carries an Oxygen stamp. The pairs are
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

## See also

`content/decisions/0015-the-direction-of-truth-for-design-tool-sync.md` records
which side owns each tier, and why push is one brand anchor rather than a
palette.
