import { RhythmLoader } from "@/components/zoblocks/rhythm-loader";

export default function InsideButtonDemo() {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <button
        type="button"
        aria-busy="true"
        disabled
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3.5 py-2 text-sm text-[var(--zb-text)]"
      >
        <RhythmLoader size="sm" label="Saving the note" />
        Saving
      </button>
    </div>
  );
}
