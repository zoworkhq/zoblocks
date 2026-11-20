import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { InfusionLoader } from "@/components/zoblocks/infusion-loader";

export default function ProgressFromImportDemo() {
  const [done, setDone] = React.useState(0);
  const total = 240;

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setDone((current) => (current >= total ? 0 : current + 12));
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <DemoSection>
      <InfusionLoader
        showLabel
        label={`Importing ${done} of ${total} records`}
        progress={(done / total) * 100}
      />
    </DemoSection>
  );
}
