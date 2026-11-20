import { AllergyChip } from "@/components/zoblocks/allergy-chip";
import { allergyModerate } from "./_shared/allergy-fixtures";

export default function AllergyModerate() {
  return (
    <section>
      <div>
        <AllergyChip record={allergyModerate} />
      </div>
    </section>
  );
}
