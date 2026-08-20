/**
 * No host framework, no bridge.
 *
 * A supported configuration rather than a degraded one, and the control the
 * other two are measured against: same application, same accessibility tree,
 * Oxygen's own tokens for the styling.
 */

import { createRoot } from "react-dom/client";
import { Application } from "../shared/Application";
import "@oxygenui-design/tokens/oxygen-tokens.css";
import "@oxygenui-design/react/styles.css";
import "../shared/page.css";

createRoot(document.getElementById("root")!).render(<Application />);
