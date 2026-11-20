import { ClinicalStatus } from "@/components/zoblocks/clinical-status";

// The chip describes how protected a record is without disclosing any of it,
// which is what lets it appear on a screen the reader is not cleared for.
export default function RestrictedIsNotAbsent() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ClinicalStatus scale="access" step="part-2" />
      <ClinicalStatus scale="access" step="restricted" />
    </div>
  );
}
