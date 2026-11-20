import { AllergyList } from "@/components/zoblocks/allergy-chip";
import { allergyListKnown, allergyListUnattributed } from "./_shared/allergy-fixtures";

export default function AllergyListExample() {
  return (
    <section>
      <div>
        <div className="flex flex-col gap-4">
          <AllergyList noneKnown={allergyListKnown} />

          <AllergyList noneKnown={allergyListUnattributed} onAsk={() => {}} />
        </div>
      </div>
    </section>
  );
}
