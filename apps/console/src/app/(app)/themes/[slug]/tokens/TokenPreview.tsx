"use client";

import { useState } from "react";
import { Switch, Timeline } from "@oxygenui-design/react";
import { Preview } from "@/components/ui";
import type { EditorModel, ThemeName } from "@/lib/token-editor";

/**
 * Real components, under the draft, as it is typed.
 *
 * Not a swatch grid and not a screenshot. The whole argument for a token system
 * is that changing `accent` reaches every component without any component
 * knowing — and the only honest way to show that is to render components that
 * were built without knowing about this screen.
 *
 * `Switch` and `Timeline` for the same reason the cross-host smoke app picks
 * them: `Switch` carries the third value no framework's switch can express, and
 * `Timeline` carries clinical status colours a customer is *not* allowed to
 * change. Seeing the accent move while the status colours hold still is the
 * clinical-token rule made visible, which lands better than the paragraph
 * explaining it.
 */
export function TokenPreview({
  theme,
  model,
  overrides,
}: {
  theme: ThemeName;
  model: EditorModel;
  /** Token paths to hex, as the customer has them right now. */
  overrides: Record<string, string>;
}) {
  const [precautions, setPrecautions] = useState<boolean | "unknown">(true);

  const tokens: Record<string, string> = {};

  /*
   * Every semantic token, not only the edited ones.
   *
   * The console's own page resolves `--ox-accent` from Oxygen's palette, not
   * from this customer's brand — so a preview applying only the overrides would
   * show a customer their edits sitting on our colours.
   */
  for (const [name, value] of Object.entries(model.resolved)) tokens[name] = value;
  for (const [path, value] of Object.entries(overrides)) {
    tokens[`--ox-${path.replace(/\./g, "-")}`] = value;
  }

  /*
   * And every component token that falls through to one of them.
   *
   * Required, not belt-and-braces. The component tier is declared at `:root` —
   * `--ox-switch-track-on-bg: var(--ox-accent)` — and a `var()` resolves at the
   * element that declares it, so setting `--ox-accent` on this subtree changes
   * nothing a component actually reads. Without this the switch stayed Oxygen's
   * teal while the swatch beside it went red, which is a preview that lies.
   */
  for (const [semantic, names] of Object.entries(model.dependents)) {
    const value = tokens[semantic];
    if (!value) continue;
    for (const name of names) tokens[name] = value;
  }

  return (
    <div className="xl:sticky xl:top-6">
      <p className="eyebrow mb-1.5 text-graphite-soft">Live preview</p>

      <Preview label="Components rendered under the draft theme" tokens={tokens} theme={theme}>
        <div className="space-y-4">
          <Switch
            id="preview-precautions"
            label="Contact precautions"
            value={precautions}
            onChange={setPrecautions}
          />
          <Switch id="preview-directive" label="Advance directive" value="unknown" />

          <Timeline
            aria-label="Preview history"
            items={[
              { key: "admit", content: "Admitted to ward 4B" },
              { key: "review", content: "Consultant review" },
            ]}
          />
        </div>
      </Preview>

      <p className="mt-2 text-[0.6875rem] leading-relaxed text-graphite">
        Components imported by name, with no idea this screen exists. Change the accent and every
        one of them follows; the clinical status colours will not move, because a theme cannot reach
        them.
      </p>
    </div>
  );
}
