import { Accordion } from "@/components/zoblocks/accordion";

const items = [
  {
    key: "allergies",
    label: "Allergies",
    summary: "2 recorded",
    children: (
      <div className="space-y-2">
        <p>Recorded allergies:</p>
        <ul className="list-disc pl-5">
          <li>Penicillin</li>
          <li>Peanuts</li>
        </ul>
      </div>
    ),
  },
  {
    key: "immunisations",
    label: "Immunisations",
    summary: "Up to date",
    children: (
      <div>
        <p>Immunisation records are up to date.</p>
      </div>
    ),
  },
];

export default function ThreeVariantsExample() {
  return (
    <div className="w-full space-y-8">
      {/* Bordered variant */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">bordered</p>
        <Accordion variant="bordered" headingLevel={3} items={items} />
      </div>

      {/* Separate variant */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">separate</p>
        <Accordion variant="separate" headingLevel={3} items={items} />
      </div>

      {/* Ghost variant */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">ghost</p>
        <div className="p-4">
          <Accordion variant="ghost" headingLevel={3} items={items} />
        </div>
      </div>
    </div>
  );
}
