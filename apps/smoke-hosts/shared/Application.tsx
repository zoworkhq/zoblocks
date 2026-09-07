/**
 * The application. One module, mounted by all three hosts.
 *
 * Nothing here names a UI framework. There is no `framework` prop, no
 * `useUIFramework()`, no registry lookup — components are imported directly by
 * name and TypeScript sees one concrete API rather than a union.
 *
 * That is the architectural claim, and this file is what makes it checkable:
 * the antd page, the MUI page and the no-bridge page import *this*, so if a
 * framework ever leaked into a component the three would stop agreeing and
 * `e2e/bridge-hosts.spec.ts` would say so.
 *
 * The components chosen are the ones with something to lose. `Switch` carries
 * the third value that no framework's switch can express; `Timeline` carries
 * the ARIA wiring antd's own Timeline does not have.
 */

import * as React from "react";
import { Switch, Timeline } from "@zoblocks/react";

export function Application() {
  const [precautions, setPrecautions] = React.useState<boolean | "unknown">(true);
  const [directive] = React.useState<boolean | "unknown">("unknown");

  return (
    <main>
      <h1>Patient record</h1>

      <section aria-labelledby="flags">
        <h2 id="flags">Flags</h2>

        {/* The third value is why this is not a wrapper around a framework
            switch: a binary control cannot distinguish "no" from "nobody
            asked", and that distinction is the component's whole clinical
            contribution. It renders identically under every host. */}
        <Switch
          id="precautions"
          label="Contact precautions"
          value={precautions}
          onChange={setPrecautions}
        />
        <Switch
          id="directive"
          label="Advance directive"
          value={directive}
          absentReason="not-collected"
        />
      </section>

      <section aria-labelledby="history">
        <h2 id="history">History</h2>
        <Timeline
          aria-label="Admission history"
          items={[
            { key: "admit", content: "Admitted to ward 4B" },
            { key: "review", content: "Consultant review" },
            { key: "discharge", content: "Discharge planned" },
          ]}
        />
      </section>
    </main>
  );
}
