# Oxygen UI in an Ant Design app

antd 6, React 18 or 19. A bridge reads antd's resolved theme and writes Oxygen's
token surface, so Oxygen components speak your brand without any component being
swapped or any capability reduced.

← [How to start](../how-to-start.md)

---

## 1. Install the bridge

```bash
npm install @oxygenui-design/bridge-antd
```

`antd` is a peer dependency — the bridge uses the version you already have.

## 2. Wrap your tree

```tsx
import { ConfigProvider } from "antd";
import { AntdBridge } from "@oxygenui-design/bridge-antd";

<ConfigProvider theme={brand}>
  <AntdBridge>{app}</AntdBridge>
</ConfigProvider>;
```

`AntdBridge` reads the theme antd resolved — including any nested
`ConfigProvider` — and writes the Oxygen tokens beneath it. Nothing else crosses
the boundary.

### The inverse also exists

To render your **own antd components** in an Oxygen brand:

```tsx
import { OxygenAntdProvider } from "@oxygenui-design/bridge-antd";

<OxygenAntdProvider>{app}</OxygenAntdProvider>;
```

Same contract, opposite direction: Oxygen's tokens become antd's `token` object.

## 3. Add Oxygen components

Follow [Existing React project](react-existing.md) from step 2 — `oxygen init`,
`oxygen add`, then the stylesheet imports. Nothing about the bridge changes
those steps.

Two components are antd skins rather than framework-neutral, and list `antd` as
a peer dependency directly:

| Package                      | What it is                                     |
| ---------------------------- | ---------------------------------------------- |
| `@oxygenui-design/signature` | Signature capture as an antd `Form.Item` value |
| `@oxygenui-design/tabs`      | Tabs with four semantic modes and eleven skins |

```tsx
import { Signature, signatureRequired } from "@oxygenui-design/signature";

<Form.Item name="consent" rules={[signatureRequired()]}>
  <Signature now={serverTime} meaning="consent" attestation="I agree to…" />
</Form.Item>;
```

`signatureRequired()` accepts a **decline** as a valid answer. A rule demanding
`outcome === "signed"` would make refusal impossible to submit, which is the
kind of defect this library exists to make unwritable.

---

## What the bridge will not carry

**Clinical status is never bridged, in either direction.** Oxygen's status
tokens carry a validated contrast floor and 60° of hue separation, so the
direction of an abnormal result survives colour-vision deficiency. antd's
`colorError` has neither — and going the other way, antd would apply a clinical
critical colour to a form validation message.

So `--ox-status-critical` stays Oxygen's in an antd app, and your `colorError`
stays yours. See
[ADR 0012](../../content/decisions/0012-token-surface-is-a-contract.md).

Switching framework changes the wrapper and nothing inside it —
`e2e/bridge-hosts.spec.ts` renders one application under antd, MUI, and neither,
and asserts the accessibility trees are identical.

---

- Moving from antd to MUI, or supporting both: [Material UI](mui.md)
- Overriding tokens by hand instead: [Theming](../reference/theming.md)
- Something not working? [Troubleshooting](../reference/troubleshooting.md)
