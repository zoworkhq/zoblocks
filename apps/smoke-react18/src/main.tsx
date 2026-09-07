/**
 * React 18 — the version that breaks most web components.
 *
 * React ≤18 has no custom-element property path. Every unknown prop goes
 * through `setAttribute` with the value coerced to a string, which produces the
 * two failures this page exists to catch:
 *
 *   - `open={false}` renders `open="false"` — an attribute that is *present*.
 *     A component reading presence (`hasAttribute("open")`) is stuck open
 *     forever. Ours reads `getAttribute("open") !== "false"`, which is why the
 *     toggle below works in both majors, and this page is the proof.
 *
 *   - `progress={0}` renders `progress="0"`, not the number 0. A component
 *     parsing with `Number(...)` is fine; one testing `if (progress)` is not.
 *
 * The page is otherwise byte-for-byte the behaviour of the React 19 page, so
 * the same Playwright script drives both and any divergence is a real one.
 */

import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@zoblocks/loaders/pulse";
import "@zoblocks/loaders/rhythm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "zb-pulse-loader": Record<string, unknown>;
      "zb-rhythm-loader": Record<string, unknown>;
    }
  }
}

function App() {
  const [open, setOpen] = useState(true);
  const [progress, setProgress] = useState(0);
  const [events, setEvents] = useState(0);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const bump = () => setEvents((n) => n + 1);
    node.addEventListener("zb-loader-show", bump);
    node.addEventListener("zb-loader-hide", bump);
    return () => {
      node.removeEventListener("zb-loader-show", bump);
      node.removeEventListener("zb-loader-hide", bump);
    };
  }, []);

  return (
    <div ref={host}>
      <h1>
        Framework: <span id="framework">react18</span>
      </h1>

      <div className="row">
        <zb-pulse-loader
          id="loader"
          label="Loading patient record"
          mode="inline"
          min-duration="0"
          open={String(open)}
        />
        <button id="toggle" type="button" onClick={() => setOpen((v) => !v)}>
          Toggle
        </button>
      </div>

      <div className="row">
        <zb-rhythm-loader
          id="determinate"
          label="Uploading study"
          mode="inline"
          min-duration="0"
          progress={progress}
        />
        <button id="step" type="button" onClick={() => setProgress((p) => (p + 25) % 125)}>
          Step
        </button>
      </div>

      <p>
        Events: <span id="events">{events}</span>
      </p>
    </div>
  );
}

createRoot(document.querySelector("#root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
