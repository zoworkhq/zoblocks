import { Recorder } from "@/components/zoblocks/recorder";

export function AwaitingConsentExample() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <Recorder variant="bars" phase="armed" consent={null} />
    </section>
  );
}

export default AwaitingConsentExample;
