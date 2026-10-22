"use client";

/** The one-line install command in a component page's overview. */

import { useCopy } from "@/components/site/code-block";

export function InstallPill({ command }: { command: string }) {
  const { copied, copy } = useCopy(command);
  return (
    <div className="flex h-[38px] max-w-full items-center overflow-hidden rounded-[9px] border border-rule bg-paper-sunk">
      <span aria-hidden="true" className="pl-3 font-mono text-[12.5px] text-graphite-soft">
        $
      </span>
      <code className="min-w-0 truncate px-2 pr-3 font-mono text-[12.5px] text-ink">{command}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Install command copied" : `Copy install command: ${command}`}
        className="flex h-full flex-none items-center border-l border-rule px-3 text-[12.5px] text-graphite transition-colors hover:bg-rule/60 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Install command copied to clipboard" : ""}
      </span>
    </div>
  );
}
