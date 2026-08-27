# Oxygen UI in a Material UI app

MUI 9, React 18 or 19. A bridge reads MUI's resolved theme and writes Oxygen's
token surface, so Oxygen components speak your brand without any component being
swapped or any capability reduced.

← [How to start](../how-to-start.md)

---

## 1. Install the bridge

```bash
npm install @oxygenui-design/bridge-mui
```

`@mui/material` is a peer dependency — the bridge uses the version you already
have.

## 2. Wrap your tree

```tsx
import { ThemeProvider } from "@mui/material/styles";
import { MuiBridge } from "@oxygenui-design/bridge-mui";

<ThemeProvider theme={brand}>
  <MuiBridge>{app}</MuiBridge>
</ThemeProvider>;
```

`MuiBridge` reads the theme MUI resolved — palette, mode, spacing, typography —
and writes the Oxygen tokens beneath it. Nothing else crosses the boundary.

### The inverse also exists

To render your **own MUI components** in an Oxygen brand:

```tsx
import { OxygenMuiProvider } from "@oxygenui-design/bridge-mui";

<OxygenMuiProvider>{app}</OxygenMuiProvider>;
```

Same contract, opposite direction: Oxygen's tokens become an MUI theme.

### Dark mode

MUI's `palette.mode` drives Oxygen's theme through the bridge, so a single MUI
theme switch moves both. You do not need to also set the `dark` class.

## 3. Add Oxygen components

Follow [Existing React project](react-existing.md) from step 2 — `oxygen init`,
`oxygen add`, then the stylesheet imports. Nothing about the bridge changes
those steps.

Note that two components — Signature and Tabs — are **antd skins** and are not
usable in an MUI app. Everything else in the catalog is framework-neutral. For
signature capture on MUI, `@oxygenui-design/signature-core` is the capture
engine with no React, no antd, and no DOM, so you can put your own MUI surface
on it.

---

## What the bridge will not carry

**Clinical status is never bridged, in either direction.** Oxygen's status
tokens carry a validated contrast floor and 60° of hue separation, so the
direction of an abnormal result survives colour-vision deficiency. MUI's
`palette.error` has neither — and going the other way, MUI would apply a clinical
critical colour to a form validation message.

So `--ox-status-critical` stays Oxygen's in an MUI app, and your
`palette.error` stays yours. See
[ADR 0012](../../content/decisions/0012-token-surface-is-a-contract.md).

Switching framework changes the wrapper and nothing inside it —
`e2e/bridge-hosts.spec.ts` renders one application under antd, MUI, and neither,
and asserts the accessibility trees are identical.

---

- Supporting antd as well: [Ant Design](antd.md)
- Overriding tokens by hand instead: [Theming](../reference/theming.md)
- Something not working? [Troubleshooting](../reference/troubleshooting.md)
