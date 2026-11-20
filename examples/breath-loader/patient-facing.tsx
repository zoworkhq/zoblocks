import { BreathLoader } from "@/components/zoblocks/breath-loader";

export default function CalmWaitDemo() {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <BreathLoader
        showLabel
        label="Loading your information"
        hint="This usually takes a few seconds."
      />
    </div>
  );
}
