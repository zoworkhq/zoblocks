import { AllergyChip } from "@/components/zoblocks/allergy-chip";
import { allergyHighRisk, allergyLowRisk } from "./_shared/allergy-fixtures";

export default function AllergyHighRisk() {
  return (
    <section>
      <div>
        <div className="flex flex-col gap-3">
          <AllergyChip record={allergyHighRisk} />
          <AllergyChip record={allergyLowRisk} />
        </div>
      </div>
    </section>
  );
}
