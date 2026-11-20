import DemoSection from "./_shared/DemoSection";
import DemoSpec from "./_shared/DemoSpec";
import { Switch } from "@/components/zoblocks/switch";

export default function AppearancesDemo() {
  return (
    <DemoSection>
      <DemoSpec code='"switch"' note="the default">
        <Switch label="Interpreter required" stateLabels="yes-no" checked />
      </DemoSpec>
      <DemoSpec code='"labeled"' note="the word is inside the track">
        <Switch
          label="Interpreter required"
          appearance="labeled"
          stateLabels="active-inactive"
          checked
        />
      </DemoSpec>
      <DemoSpec code='"segmented"' note="both answers are visible choices">
        <div className="grid gap-3">
          <Switch
            label="Interpreter required"
            appearance="segmented"
            stateLabels="yes-no"
            checked
          />
          <Switch
            label="Latex allergy"
            appearance="segmented"
            stateLabels="yes-no"
            checked="unknown"
            absentReason="not-collected"
          />
        </div>
      </DemoSpec>
      <DemoSpec code='"chip"' note="a filter bar, eight at a time">
        <div className="flex flex-wrap gap-2">
          <Switch label="My patients" appearance="chip" checked />
          <Switch label="Unacknowledged results" appearance="chip" checked={false} />
          <Switch label="Discharge today" appearance="chip" checked />
          <Switch label="Isolation" appearance="chip" checked={false} />
        </div>
      </DemoSpec>
      <DemoSpec code='"row"' note="the whole row is the target">
        <Switch
          label="Text me when my results are ready"
          description="To the mobile ending 4471. Standard rates apply."
          appearance="row"
          audience="patient"
          checked
        />
      </DemoSpec>
    </DemoSection>
  );
}
