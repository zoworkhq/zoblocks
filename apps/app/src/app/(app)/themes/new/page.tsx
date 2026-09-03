import { PageHeader } from "@/components/ui";
import { NewThemeForm } from "./NewThemeForm";

export const metadata = { title: "New theme" };

export default function NewThemePage() {
  return (
    <>
      <PageHeader
        eyebrow="New"
        title="Create a theme"
        lede="One brand colour. The console derives the ramp and checks every pair it produces."
      />
      <NewThemeForm />
    </>
  );
}
