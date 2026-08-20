"use client";

import * as React from "react";
import { ConfigProvider, Button as AntButton, Input as AntInput, Switch as AntSwitch } from "antd";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MuiButton from "@mui/material/Button";
import MuiTextField from "@mui/material/TextField";
import MuiChip from "@mui/material/Chip";
import MuiSwitch from "@mui/material/Switch";
import { toAntdTheme } from "@oxygenui-design/bridge-antd/inverse";
import { toMuiTheme } from "@oxygenui-design/bridge-mui/inverse";

/**
 * The export file, rendered.
 *
 * These are Ant Design's and Material UI's own components — not Oxygen's —
 * drawn under exactly the theme object the download beside them contains. That
 * is the point: the outbound bridge's claim is "your brand, in your framework's
 * vocabulary", and the only way to settle whether that survived the translation
 * is to look at the framework's own Button.
 *
 * It is deliberately the *outbound* direction. The inbound bridge maps a host's
 * resolved theme onto Oxygen's tokens, and the console does not have a
 * customer's `ConfigProvider` config — so an inbound preview here could only
 * show a sample theme dressed up as theirs, which is worse than showing
 * nothing. What the console does have is their Oxygen theme, and this is what
 * their own components will look like wearing it.
 *
 * Loaded on the client only, and the wrapper beside this file is what makes
 * that true. `"use client"` marks a boundary, not a target: Next still imports
 * and evaluates the module on the server to produce the first HTML, so antd and
 * MUI were both being pulled into the request path — which took the render
 * stream down with "the destination stream closed early".
 *
 * `next/dynamic` with `ssr: false` is the thing that actually keeps them out.
 * The alternative is a server-side style registry for antd's cssinjs *and* one
 * for MUI's emotion, added to every page in the console for one panel on one
 * screen.
 */

export function FrameworkSpecimenImpl({
  framework,
  resolved,
}: {
  framework: "antd" | "mui";
  /** The theme's semantic tier, resolved — the same input the export uses. */
  resolved: Record<string, string>;
}) {
  return (
    <div
      /*
        A white ground, fixed.
        
        Both frameworks' default themes are light, and the export carries one
        palette because `ConfigProvider` and `createTheme` each hold one. Drawn
        on the console's own surface it would sit on a dark ground in dark mode
        and look broken through no fault of the theme.
      */
      className="rounded-lg border border-rule p-3"
      style={{ background: "#ffffff" }}
    >
      {framework === "antd" ? (
        <AntdSpecimen resolved={resolved} />
      ) : (
        <MuiSpecimen resolved={resolved} />
      )}
    </div>
  );
}

/**
 * Controls chosen because each reads a different part of the mapping: the
 * primary button takes the accent, the secondary takes the border, the input
 * takes the radius and border, and the switch takes the accent again at a size
 * where a wrong shade is obvious.
 *
 * A preset-coloured `Tag` was here and is not any more. `color="processing"`
 * paints from antd's own preset palette, which the bridge deliberately does not
 * map — so it showed antd's stock blue rather than the customer's brand, proved
 * nothing about the export, and failed contrast on the way. A specimen that
 * demonstrates the wrong thing is worse than one control fewer.
 *
 * Every one carries a real accessible name. They are a demonstration, but they
 * are also live DOM on a real page in a product whose argument is that
 * accessibility is not a later pass — and a placeholder has never been a label.
 * The axe sweep caught these the first time it ran over this panel.
 */
function AntdSpecimen({ resolved }: { resolved: Record<string, string> }) {
  const theme = toAntdTheme(resolved);
  return (
    <ConfigProvider theme={theme}>
      <div className="flex flex-wrap items-center gap-2">
        <AntButton type="primary">Admit</AntButton>
        <AntButton>Cancel</AntButton>
        <AntInput aria-label="NHS number" placeholder="NHS number" style={{ width: 140 }} />
        <AntSwitch aria-label="Contact precautions" defaultChecked />
      </div>
    </ConfigProvider>
  );
}

function MuiSpecimen({ resolved }: { resolved: Record<string, string> }) {
  // Rebuilt whenever the tokens change, and memoised because `createTheme` is
  // not cheap and this sits beside a list that re-renders on every download.
  const theme = React.useMemo(() => createTheme(toMuiTheme(resolved)), [resolved]);

  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-wrap items-center gap-2">
        <MuiButton variant="contained" size="small">
          Admit
        </MuiButton>
        <MuiButton variant="outlined" size="small">
          Cancel
        </MuiButton>
        <MuiTextField
          size="small"
          placeholder="NHS number"
          slotProps={{ htmlInput: { "aria-label": "NHS number" } }}
          sx={{ width: 140 }}
        />
        <MuiChip label="Ward 4B" color="primary" size="small" />
        <MuiSwitch
          slotProps={{ input: { "aria-label": "Contact precautions" } }}
          defaultChecked
          size="small"
        />
      </div>
    </ThemeProvider>
  );
}
