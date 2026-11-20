import { Tabs } from "@zoblocks/tabs";

const VARIANTS = [
  "segmented",
  "underline",
  "pill",
  "enclosed",
  "rail",
  "ghost",
  "stepper",
  "command",
  "card",
  "stat",
  "unstyled",
] as const;

export default function EveryVariantOneTreeExample() {
  return (
    <section className="space-y-4">
      <div className="space-y-6">
        {VARIANTS.map((variant) => (
          <div key={variant} className="space-y-2">
            <h3 className="text-sm font-semibold capitalize text-gray-700">{variant}</h3>

            <Tabs
              as="tabs"
              variant={variant}
              aria-label={`${variant} example`}
              defaultValue="a"
              items={[
                { value: "a", label: "Personal" },
                { value: "b", label: "Shared" },
                { value: "c", label: "Archived" },
              ]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
