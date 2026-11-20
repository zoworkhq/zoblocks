import { RhythmLoader } from "@/components/zoblocks/rhythm-loader";

export default function ReducedMotionDemo() {
  return (
    <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-10">
      <RhythmLoader motion="full" showLabel label="Full motion" />
      <RhythmLoader motion="reduced" showLabel label="Reduced motion" />
    </div>
  );
}
