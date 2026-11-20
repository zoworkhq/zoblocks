import { ResultValue, type ResultValueData } from "@/components/zoblocks/result-value";

const values: ResultValueData[] = [
  { id: "hba1c", analyte: "HbA1c", absent: "not-ordered" },
  { id: "trop", analyte: "Troponin I", absent: "awaiting" },
  { id: "bc", analyte: "Blood culture", absent: "cancelled" },
  {
    id: "wbc",
    analyte: "White blood cell count",
    absent: "specimen-problem",
    absentDetail: "Haemolysed. Recollection requested.",
  },
  { id: "smoking", analyte: "Smoking status", absent: "declined" },
  { id: "tox", analyte: "Toxicology screen", absent: "masked" },
  { id: "mg", analyte: "Magnesium", absent: "unknown" },
];

export default function AbsenceExample() {
  return (
    <div className="grid gap-1.5">
      {values.map((value) => (
        <ResultValue key={value.id} value={value} />
      ))}
    </div>
  );
}
