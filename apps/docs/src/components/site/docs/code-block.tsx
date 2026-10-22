"use client";

/**
 * The code surfaces on a component page, as pieces.
 *
 * The playground footer, an example card and a plain usage snippet all draw
 * the same three things — a copy button, the "open online" links and the
 * highlighted lines — inside different chrome. So the pieces are exported
 * separately and `CodeBlock` is just the commonest assembly of them.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/components/site/code-block";
import { showLineNumbers, tokenize, type Lang } from "@/lib/highlight";
import type { DemoLink } from "./sandbox";

/* ------------------------------------------------------------------ */

/*
 * The copy logic is the site's one `useCopy`; this button is only its skin
 * for the light toolbar above a code block, where the site's own CopyButton
 * (drawn for the dark panel) would not sit.
 */
const BAR_BUTTON =
  "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-[7px] px-[9px] text-[12.5px] " +
  "text-graphite transition-colors hover:bg-rule/60 hover:text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function CopyButton({
  text,
  what = "code",
  showLabel = true,
}: {
  text: string;
  what?: string;
  showLabel?: boolean;
}) {
  const { copied, copy } = useCopy(text);
  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `Copied ${what}` : `Copy ${what}`}
        className={BAR_BUTTON}
      >
        <svg
          aria-hidden="true"
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="5" y="5" width="9" height="9" rx="2" />
          <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
        </svg>
        <span className={cn(!showLabel && "sr-only", "max-sm:sr-only")}>
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${what[0]!.toUpperCase()}${what.slice(1)} copied to clipboard` : ""}
      </span>
    </>
  );
}

export function PlatformLinks({ links }: { links: readonly DemoLink[] }) {
  if (!links.length) return null;
  return (
    <>
      <span aria-hidden="true" className="mx-1 h-4 w-px bg-rule" />
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          title={link.title}
          aria-label={link.title}
          className={BAR_BUTTON}
        >
          <span
            aria-hidden="true"
            className="rounded-[3px] border border-current px-[3px] py-px font-mono text-[9.5px] font-semibold leading-none"
          >
            {link.mark}
          </span>
          <span className="max-sm:hidden">{link.label}</span>
          <span aria-hidden="true" className="text-[10.5px]">
            ↗
          </span>
        </a>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

export function CodeLines({
  code,
  lang = "tsx",
  numbered = true,
  className,
  label,
}: {
  code: string;
  lang?: Lang;
  numbered?: boolean;
  className?: string;
  /** Names the scroll region; a region that scrolls has to be reachable by keyboard. */
  label?: string;
}) {
  const lines = React.useMemo(() => tokenize(code, lang), [code, lang]);
  const gutter = showLineNumbers(code, numbered);
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className={cn(
        "zb-code scroll-thin m-0 overflow-auto bg-paper-sunk py-3.5 font-mono text-[13px] leading-[22px]",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
        className,
      )}
    >
      <code className="block min-w-max">
        {lines.map((line) => (
          <span key={line.n} className="flex min-h-[22px] px-[18px]">
            {gutter ? (
              <span
                aria-hidden="true"
                className="mr-[18px] w-[22px] flex-none select-none text-right text-graphite-soft"
              >
                {line.n}
              </span>
            ) : null}
            <span className="whitespace-pre">
              {line.toks.map((tok, index) => (
                <span key={index} className={`tk-${tok.k}`}>
                  {tok.v}
                </span>
              ))}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}

/** A file name, the copy button and optional demo links, over highlighted code. */
export function CodeBlock({
  code,
  lang = "tsx",
  file,
  links = [],
  numbered = true,
  className,
  bodyClassName,
}: {
  code: string;
  lang?: Lang;
  file: string;
  links?: readonly DemoLink[];
  numbered?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden rounded-[10px] border border-rule bg-paper-sunk", className)}
    >
      <div className="flex h-10 items-center justify-between gap-2 border-b border-rule pl-3.5 pr-1.5">
        <span className="min-w-0 truncate font-mono text-xs text-graphite">{file}</span>
        <div className="flex flex-none items-center gap-0.5">
          <CopyButton text={code} />
          <PlatformLinks links={links} />
        </div>
      </div>
      <CodeLines
        code={code}
        lang={lang}
        numbered={numbered}
        className={bodyClassName}
        label={file}
      />
    </div>
  );
}
