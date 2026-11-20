import { ClinicalNote } from "@/components/zoblocks/clinical-note";
import { AUTHOR, ExampleNotice, NOW, SUBJECT } from "./_shared/demo-note";

export default function EmptyProgressDraft() {
  return (
    <div>
      <ExampleNotice />
      <ClinicalNote subject={SUBJECT} author={AUTHOR} noteType="progress" now={NOW} />
    </div>
  );
}
