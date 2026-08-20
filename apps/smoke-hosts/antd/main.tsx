/**
 * The antd host. Provider, bridge, application — in that order.
 *
 * Note what is *not* here: no component import differs from the other two
 * pages, because the application is a shared module. The framework appears in
 * this file and nowhere else.
 */

import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import { AntdBridge } from "@oxygenui-design/bridge-antd";
import { Application } from "../shared/Application";
import "@oxygenui-design/tokens/oxygen-tokens.css";
import "@oxygenui-design/react/styles.css";
import "../shared/page.css";

createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#7c3aed",
        borderRadius: 10,
        fontFamily: "Georgia, serif",
        // Deliberately present. The bridge must not carry it onto a clinical
        // token, and the test asserts the badge keeps Oxygen's validated red.
        colorError: "#ff00ff",
      },
    }}
  >
    <AntdBridge>
      <Application />
    </AntdBridge>
  </ConfigProvider>,
);
