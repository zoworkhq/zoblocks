/**
 * No host framework, no bridge.
 *
 * A supported configuration rather than a degraded one, and the control the
 * other two are measured against: same application, same accessibility tree,
 * Zoblocks's own tokens for the styling.
 */

import { createRoot } from "react-dom/client";
import { Application } from "../shared/Application";
import "@zoblocks/tokens/zoblocks-tokens.css";
import "@zoblocks/react/styles.css";
import "../shared/page.css";

createRoot(document.getElementById("root")!).render(<Application />);
