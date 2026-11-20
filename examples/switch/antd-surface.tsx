import DemoSection from "./_shared/DemoSection";
import DemoSpec from "./_shared/DemoSpec";
import { Switch } from "@/components/zoblocks/switch";

export default function AntdSurfaceDemo() {
  return (
    <DemoSection>
      <DemoSpec code="checkedChildren" note="antd's in-track words">
        <Switch
          label="Interpreter required"
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          defaultChecked
        />
      </DemoSpec>
      <DemoSpec code="loading" note="pending, focusable, never disabled">
        <Switch label="Saving your preference" loading checked />
      </DemoSpec>
      <DemoSpec code="size" note="antd's two, plus ours">
        <div className="flex flex-wrap items-center gap-6">
          <Switch label="small" size="small" defaultChecked showState={false} />
          <Switch label="default" defaultChecked showState={false} />
          <Switch label="large" size="large" defaultChecked showState={false} />
        </div>
      </DemoSpec>
    </DemoSection>
  );
}
