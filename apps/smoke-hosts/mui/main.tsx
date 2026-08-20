/**
 * The Material UI host.
 *
 * The same theme values as the antd page, expressed in MUI's vocabulary, so a
 * difference between the two pages is a difference in the bridges rather than
 * in what they were asked for.
 */

import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MuiBridge } from "@oxygenui-design/bridge-mui";
import { Application } from "../shared/Application";
import "@oxygenui-design/tokens/oxygen-tokens.css";
import "@oxygenui-design/react/styles.css";
import "../shared/page.css";

const theme = createTheme({
  palette: {
    primary: { main: "#7c3aed" },
    // As above: MUI's error colour must not reach a clinical token either.
    error: { main: "#ff00ff" },
  },
  shape: { borderRadius: 10 },
  typography: { fontFamily: "Georgia, serif" },
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <MuiBridge>
      <Application />
    </MuiBridge>
  </ThemeProvider>,
);
