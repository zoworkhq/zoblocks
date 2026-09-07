"use client";

import { useState } from "react";
import { createThemeAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { ColorField, Field, Input, Panel, Ramp, SubmitButton } from "@/components/ui";
import { RAMP_STEPS, generateRamp } from "@zoblocks/theme";

/**
 * One colour, not eleven.
 *
 * Asking a customer for a full ramp is asking them to do the part that has a
 * right answer — and most of what the contrast gate catches is a hand-picked
 * step rather than the chosen colour. So the form takes a brand colour, the
 * ramp is generated, and every derived step is validated before anything can go
 * live.
 *
 * The preview runs `generateRamp` — the *same* function the server calls on
 * submit, not an approximation of it. A preview that disagrees with the result
 * is worse than no preview, because the customer trusts it and then has to
 * work out which of the two lied.
 */
const SEED = "#1d63c9";

export function NewThemeForm() {
  const [brand, setBrand] = useState(SEED);

  // Only for a complete value: `generateRamp` is given colours, and "#1d6" on
  // the way to "#1d63c9" is a legal thing to be typing rather than an error.
  const valid = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(brand);
  const ramp = valid ? generateRamp(brand) : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
      <ActionForm
        action={createThemeAction}
        className="space-y-5"
        footer={
          <SubmitButton pendingLabel="Creating…" className="mt-5">
            Create theme
          </SubmitButton>
        }
      >
        <Field
          label="Theme name"
          required
          hint="Becomes the theme's address, so it is fixed once published."
        >
          {(props) => (
            <Input {...props} name="name" maxLength={60} placeholder="Northwind Clinical" />
          )}
        </Field>

        <Field
          label="Brand colour"
          required
          hint="Three or six hex digits. Eight carry transparency, and contrast against an unknown backdrop cannot be verified."
        >
          {(props) => (
            <ColorField
              id={props.id}
              describedBy={props["aria-describedby"]}
              name="brandColour"
              required
              value={brand}
              onChange={setBrand}
            />
          )}
        </Field>
      </ActionForm>

      <Panel
        title="Generated ramp"
        description="Step 600 is the colour you chose. The other ten are derived, and every pair they take part in is checked in light, dark and high contrast before this theme can be published."
      >
        {ramp ? (
          <div className="preview-region -m-1 space-y-4 p-4">
            <Ramp steps={ramp} anchor="600" label="Preview of the generated brand ramp" />

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {RAMP_STEPS.map((step) => {
                // Indexed with the literal rather than `String(step)`:
                // `generateRamp` returns a `Record<RampStep, string>` keyed by
                // the numeric steps, and stringifying the key loses the type.
                const value = ramp[step];
                if (!value) return null;
                return (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-3.5 shrink-0 rounded ring-1 ring-rule-strong"
                      style={{ background: value }}
                    />
                    <dt className="tabular font-mono text-[0.6875rem] text-graphite-soft">
                      {step}
                    </dt>
                    <dd className="tabular font-mono text-[0.6875rem] uppercase">{value}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ) : (
          <p className="body-sm text-graphite">
            Enter a complete hex colour to see the ramp it generates.
          </p>
        )}
      </Panel>
    </div>
  );
}
