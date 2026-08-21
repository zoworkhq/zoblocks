"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { Button, Select } from "@/components/ui";

/**
 * Choosing which two versions to compare.
 *
 * The selection lives in the URL rather than in component state, and that is
 * the whole design: a comparison is a thing people paste into a ticket. State
 * would make every such link land on the default pair, which is the one the
 * sender was not talking about.
 *
 * Native `<select>`s rather than a custom listbox. There are rarely more than a
 * few dozen versions, the platform control is keyboard-operable and screen-
 * reader-correct without any work, and on a phone it opens the system picker.
 */
export function ComparePicker({
  versions,
  left,
  right,
}: {
  /** Newest first, as the table shows them. */
  versions: readonly { version: number; live: boolean }[];
  left: number;
  right: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const go = (next: { a?: number; b?: number }) => {
    const query = new URLSearchParams(params.toString());
    query.set("a", String(next.a ?? left));
    query.set("b", String(next.b ?? right));
    // `scroll: false` because the reader is looking at the diff, and a
    // comparison that jumps to the top of the page on every change is a
    // comparison you cannot actually step through.
    router.replace(`?${query.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Picker
        label="From"
        value={left}
        versions={versions}
        onChange={(version) => go({ a: version })}
      />

      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={() => go({ a: right, b: left })}
        className="mb-0.5"
        aria-label="Swap the two versions"
      >
        <ArrowLeftRight aria-hidden="true" className="size-3.5" />
      </Button>

      <Picker
        label="To"
        value={right}
        versions={versions}
        onChange={(version) => go({ b: version })}
      />
    </div>
  );
}

function Picker({
  label,
  value,
  versions,
  onChange,
}: {
  label: string;
  value: number;
  versions: readonly { version: number; live: boolean }[];
  onChange: (version: number) => void;
}) {
  const id = `compare-${label.toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[0.75rem] font-medium">
        {label}
      </label>
      <Select
        id={id}
        mono
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-32"
      >
        {versions.map((entry) => (
          <option key={entry.version} value={entry.version}>
            v{entry.version}
            {entry.live ? " · live" : ""}
          </option>
        ))}
      </Select>
    </div>
  );
}
