import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

export default function RestyledDemo() {
  return (
    <DemoSection>
      <Switch label="Default tokens" stateLabels="in-effect" checked size="large" />
      <div
        style={
          {
            "--zb-switch-radius": "0.25rem",
            "--zb-switch-track-on-bg": "#4338ca",
            "--zb-switch-track-w": "64px",
          } as React.CSSProperties
        }
      >
        <Switch
          label="Squared, wider, another brand"
          stateLabels="in-effect"
          checked
          size="large"
        />
      </div>
      <Switch
        label="A custom thumb, through slots"
        stateLabels="in-effect"
        checked
        size="large"
        slots={{
          thumb: ({ value }) => (
            <span aria-hidden="true" style={{ fontSize: 11, lineHeight: 1 }}>
              {value === true ? "✓" : ""}
            </span>
          ),
        }}
      />
    </DemoSection>
  );
}
