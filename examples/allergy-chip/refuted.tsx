import { AllergyChip } from "@/components/zoblocks/allergy-chip";
import { allergyRefuted } from "./_shared/allergy-fixtures";

export default function AllergyRefuted() {
  return (
    <section>
      <div>
        <AllergyChip record={allergyRefuted} />
      </div>
    </section>
  );
}
