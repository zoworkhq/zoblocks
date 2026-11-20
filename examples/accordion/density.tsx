import { Accordion } from "@/components/zoblocks/accordion";

const items = [
  {
    key: "allergies",
    label: "Allergies",
    summary: "2 recorded",
    severity: "high" as const,
    children: (
      <div className="space-y-2">
        <p className="font-medium">Recorded allergies</p>
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
    severity: "normal" as const,
    children: <p>Immunisation records are up to date.</p>,
  },
];

export default function DensityIsSpacingExample() {
  return (
    <div className="w-full space-y-8">
      {/* Patient density */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">patient</p>
        <Accordion density="patient" headingLevel={3} items={items} />
      </div>

      {/* Standard density */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">standard</p>
        <Accordion density="standard" headingLevel={3} items={items} />
      </div>

      {/* Clinical density */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">clinical</p>
        <Accordion density="clinical" headingLevel={3} items={items} />
      </div>
    </div>
  );
}
