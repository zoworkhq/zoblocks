/**
 * React 19.
 *
 * The interesting part is what React does with `open={String(open)}`. React 19
 * checks whether a property of that name exists on the element and assigns it
 * if so, falling back to setAttribute. Our elements expose `isOpen` as a getter
 * and keep `open` as attribute-only precisely so both React majors take the
 * same path — the string is not defensive clutter, it is the contract.
 */

import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@oxygenui-design/loaders/pulse";
import "@oxygenui-design/loaders/rhythm";

declare module "react" {
  // The only way to teach React 19's JSX about a custom element. React 19
  // moved IntrinsicElements under `React.JSX`, and TypeScript has no
  // non-namespace syntax for augmenting it — an ES module declaration cannot
  // reopen a namespace from outside.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "ox-pulse-loader": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Record<string, unknown>;
      "ox-rhythm-loader": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
        Record<string, unknown>;
    }
  }
}

function App() {
  const [open, setOpen] = useState(true);
  const [progress, setProgress] = useState(0);
  const [events, setEvents] = useState(0);
  const host = useRef<HTMLDivElement>(null);

  // Custom events do not cross into React's synthetic system, so a real
  // listener is the only way a React app observes them. If this stops working,
  // every React consumer's "hide the skeleton when the loader closes" breaks.
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const bump = () => setEvents((n) => n + 1);
    node.addEventListener("ox-loader-show", bump);
    node.addEventListener("ox-loader-hide", bump);
    return () => {
      node.removeEventListener("ox-loader-show", bump);
      node.removeEventListener("ox-loader-hide", bump);
    };
  }, []);

  return (
    <div ref={host}>
      <h1>
        Framework: <span id="framework">react</span>
      </h1>

      <div className="row">
        <ox-pulse-loader
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
        <ox-rhythm-loader
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
