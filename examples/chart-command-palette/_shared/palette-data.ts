import type { PaletteItem } from "@/components/zoblocks/chart-command-palette";

// This standalone demo does not include the private @zoblocks/fixtures package.
// These local records make the documented scope and audit counts reproducible.
export const paletteItems: PaletteItem[] = [
  { id: "p-mine", kind: "patient", label: "A. Okonkwo", detail: "Your patient" },
  { id: "p-other-1", kind: "patient", label: "A. Okonjo", detail: "Out of scope" },
  { id: "p-other-2", kind: "patient", label: "B. Okonkwo", detail: "Out of scope" },
  { id: "p-other-3", kind: "patient", label: "C. Okonkwo", detail: "Out of scope" },
];

export const patientScope = {
  inScope: new Set(["p-mine"]),
  breakGlass: true,
} as const;
