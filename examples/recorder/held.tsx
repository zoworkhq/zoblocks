import { Recorder } from "@/components/zoblocks/recorder";

export function HeldNotUploadedExample() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Recorder
        variant="bars"
        phase="held"
        disposition={{ state: "failed", bytes: 14_200_000, sent: 8_900_000, error: "network" }}
      />
    </section>
  );
}

export default HeldNotUploadedExample;
