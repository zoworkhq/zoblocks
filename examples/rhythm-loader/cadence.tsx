import { RhythmLoader } from "@/components/zoblocks/rhythm-loader";

export default function CadenceClampedDemo() {
  return (
    <div className="flex min-h-[220px] flex-wrap items-center justify-center gap-10">
      <RhythmLoader bpm={40} showLabel label="40 bpm" />
      <RhythmLoader bpm={60} showLabel label="60 bpm" />
      <RhythmLoader bpm={100} showLabel label="100 bpm" />
    </div>
  );
}
