import { BreathLoader } from "@/components/zoblocks/breath-loader";

function IntakeFields() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--zb-border)] bg-[var(--zb-surface)] p-4 text-[length:var(--zb-text-sm)]">
      {["Preferred name", "Reason for visit"].map((field) => (
        <label key={field} className="flex flex-col gap-1 text-[var(--zb-text-muted)]">
          {field}
          <span className="h-8 rounded-md border border-[var(--zb-border)] bg-[var(--zb-bg-muted)]" />
        </label>
      ))}
    </div>
  );
}

export default function FormSubmittingDemo() {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="relative w-full max-w-md">
        <form style={{ position: "relative" }} aria-busy="true">
          <IntakeFields />
          <BreathLoader mode="overlay" label="Saving your answers" />
        </form>
      </div>
    </div>
  );
}
