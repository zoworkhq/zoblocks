import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

function LiveSwitch({
  flaky = false,
  ...props
}: { flaky?: boolean } & React.ComponentProps<typeof Switch>) {
  const [value, setValue] = React.useState<boolean | "unknown">(
    (props.checked as boolean | "unknown" | undefined) ?? false,
  );
  const attempts = React.useRef(0);

  return (
    <Switch
      {...props}
      checked={value}
      onCommit={async (next) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        attempts.current += 1;
        if (flaky && attempts.current % 2 === 1) throw new Error("Could not reach the record.");
        setValue(next);
      }}
    />
  );
}

export default function WriteAndFailDemo() {
  return (
    <DemoSection>
      <LiveSwitch label="Contact precautions" stateLabels="in-effect" tone="caution" size="large" />
      <LiveSwitch
        label="Falls risk"
        stateLabels="in-effect"
        size="large"
        flaky
        description="This one fails every other write, on purpose."
      />
    </DemoSection>
  );
}
