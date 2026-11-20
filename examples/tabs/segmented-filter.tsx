import { Form } from "antd";
import { Tabs } from "@zoblocks/tabs";

export default function SemanticSegmentedFormExample() {
  return (
    <section className="space-y-4">
      <Form layout="vertical" initialValues={{ density: "default" }} className="mx-auto w-fit">
        <Form.Item name="density" label="Density" className="text-center">
          <Tabs
            as="radiogroup"
            variant="segmented"
            aria-label="Density"
            items={[
              { value: "compact", label: "Compact" },
              { value: "default", label: "Default" },
              { value: "comfortable", label: "Comfortable" },
            ]}
          />
        </Form.Item>
      </Form>
    </section>
  );
}
