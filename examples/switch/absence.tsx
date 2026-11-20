import DemoSection from "./_shared/DemoSection";
import DemoSpec from "./_shared/DemoSpec";
import { Switch } from "@/components/zoblocks/switch";

export default function AbsenceDemo() {
  return (
    <DemoSection>
      <DemoSpec code="not-collected" note="nobody collected it">
        <Switch
          label="Advance directive"
          checked="unknown"
          absentReason="not-collected"
          stateLabels="yes-no"
        />
      </DemoSpec>
      <DemoSpec code="declined" note="the person refused">
        <Switch
          label="Interpreter needed"
          checked="unknown"
          absentReason="declined"
          stateLabels="yes-no"
        />
      </DemoSpec>
      <DemoSpec code="masked" note="policy withheld it from you">
        <Switch
          label="Substance use screen"
          checked="unknown"
          absentReason="masked"
          readOnly
          stateLabels="yes-no"
        />
      </DemoSpec>
      <DemoSpec code="pending" note="collected, result not back">
        <Switch label="MRSA screen" checked="unknown" absentReason="pending" stateLabels="yes-no" />
      </DemoSpec>
    </DemoSection>
  );
}
