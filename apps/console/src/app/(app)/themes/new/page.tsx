import { PageHeader } from "@/components/ui";
import { NewThemeForm } from "./NewThemeForm";

export const metadata = { title: "New theme" };

export default function NewThemePage() {
  return (
    <>
      <PageHeader
        eyebrow="New"
        title="Create a theme"
        lede="Give us your brand colour. We generate the ramp and check every derived pair."
      />
      <NewThemeForm />
    </>
  );
}
