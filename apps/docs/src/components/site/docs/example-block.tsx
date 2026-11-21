"use client";

/**
 * One documented example: what it is for, the real thing, and its code.
 *
 * With a live preview the card is a Preview / Code tab pair, Preview first —
 * a reader decides from what it looks like whether the code is worth reading.
 * Without one the tabs are not drawn: a tab strip with one usable tab is a
 * control that does nothing, so the card shows the code under its file name.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { CodeLines, CopyButton, PlatformLinks } from "./code-block";
import {
  isRunnable,
  openSandbox,
  prepareSandbox,
  type DemoLink,
  type DemoLinkStatus,
  type PreparedSandbox,
} from "./sandbox";
import { HostStage } from "../host-stage";
import { EXAMPLE_MODULES } from "@/lib/generated/example-modules";

export interface ExampleBlockProps {
  component: string;
  id: string;
  title: string;
  description: string;
  code: string;
  fixture?: string;
  /** Overrides the registry lookup; used by tests and by callers with a preview in hand. */
  preview?: React.ReactNode;
  /** h4 when the example sits under a group heading. */
  level?: 3 | 4;
}

export function fileNameFor(title: string): string {
  const words = title.match(/[A-Za-z0-9]+/g) ?? [];
  const name = words.map((word) => word[0]!.toUpperCase() + word.slice(1)).join("");
  return `${name || "Example"}.tsx`;
}

/**
 * The StackBlitz button for one example, or none when it cannot run.
 *
 * The project is fetched when the card comes near the viewport, so by the time
 * a reader reaches the button it is ready and the click can open it directly —
 * a browser only lets a new tab open inside the click itself.
 */
function useSandboxLinks(
  component: string,
  id: string,
  title: string,
  card: React.RefObject<HTMLElement | null>,
): DemoLink[] {
  const runnable = isRunnable(component, id);
  const [status, setStatus] = React.useState<DemoLinkStatus>("idle");
  const ready = React.useRef<PreparedSandbox | null>(null);

  const prepare = React.useCallback(() => {
    if (!runnable || ready.current) return;
    setStatus("loading");
    prepareSandbox(component, id).then(
      (sandbox) => {
        ready.current = sandbox;
        setStatus("ready");
      },
      () => setStatus("error"),
    );
  }, [runnable, component, id]);

  React.useEffect(() => {
    const element = card.current;
    if (!runnable || !element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          prepare();
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [runnable, card, prepare]);

  return React.useMemo(() => {
    if (!runnable) return [];
    return [
      {
        id: "stackblitz",
        label: "StackBlitz",
        mark: "SB",
        title:
          status === "error"
            ? `The ${title} example could not be loaded. Try StackBlitz again`
            : `Open the ${title} example in StackBlitz`,
        status,
        prepare,
        open: () => (ready.current ? openSandbox(ready.current) : prepare()),
      },
    ];
  }, [runnable, status, title, prepare]);
}

/**
 * The example's own file, rendered — the same file the Code tab shows and
 * StackBlitz opens. An example still written as a `code` string has none, and
 * shows its code alone.
 */
function examplePreviewNode(
  component: string,
  id: string,
  onHydrated: () => void,
): React.ReactNode {
  const File = EXAMPLE_MODULES[`${component}/${id}`];
  if (!File) return null;
  return (
    <React.Suspense fallback={null}>
      {ANTD_BACKED.has(component) || ANTD_BACKED.has(`${component}/${id}`) ? (
        <AntdExampleFrame>
          <File />
        </AntdExampleFrame>
      ) : (
        <File />
      )}
      <Hydrated onHydrated={onHydrated} />
    </React.Suspense>
  );
}

/**
 * Reports that the example beside it has hydrated.
 *
 * The example is lazy, so until its chunk arrives the preview is
 * server-rendered markup with no handlers attached, and a click in that gap is
 * lost — about two seconds in WebKit. This shares the example's Suspense
 * boundary, so its effect runs only once that boundary has hydrated. Surfaced
 * as `data-hydrated` on the preview panel purely so tests can wait for it, as
 * the signature demo does.
 */
function Hydrated({ onHydrated }: { onHydrated: () => void }) {
  React.useEffect(() => onHydrated(), [onHydrated]);
  return null;
}

/**
 * Components built on antd, or single examples that mount antd themselves,
 * whose previews need antd themed to match the site.
 */
const ANTD_BACKED = new Set(["signature", "tabs/segmented-filter"]);

const AntdExampleFrame = React.lazy(() => import("./antd-example-frame"));

export function ExampleBlock({
  component,
  id,
  title,
  description,
  code,
  fixture,
  preview,
  level = 3,
}: ExampleBlockProps) {
  const Heading = level === 4 ? "h4" : "h3";
  const [hydrated, setHydrated] = React.useState(false);
  const markHydrated = React.useCallback(() => setHydrated(true), []);
  const live = preview ?? examplePreviewNode(component, id, markHydrated);
  const [tab, setTab] = React.useState<"preview" | "code">("preview");
  const baseId = `ex-${id}`;
  const showing = live ? tab : "code";
  const card = React.useRef<HTMLDivElement>(null);
  const links = useSandboxLinks(component, id, title, card);

  return (
    <div ref={card} id={baseId} data-toc={baseId} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Heading className="m-0 text-[17px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </Heading>
          {fixture ? (
            <code className="font-mono text-[0.6875rem] text-graphite-soft">{fixture}</code>
          ) : null}
        </div>
        <p className="m-0 max-w-[640px] text-pretty text-[14.5px] leading-relaxed text-graphite">
          {description}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-rule bg-paper">
        <div className="flex h-11 items-center justify-between gap-2 border-b border-rule px-1.5">
          {live ? (
            <div role="tablist" aria-label={`${title} example`} className="flex h-full">
              {(["preview", "code"] as const).map((key) => {
                const on = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${key}`}
                    aria-selected={on}
                    aria-controls={`${baseId}-panel-${key}`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setTab(key)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                        event.preventDefault();
                        const next = key === "preview" ? "code" : "preview";
                        setTab(next);
                        document.getElementById(`${baseId}-tab-${next}`)?.focus();
                      }
                    }}
                    className={cn(
                      "h-full px-2.5 text-[13px] font-medium capitalize transition-colors",
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                      on
                        ? "text-ink shadow-[inset_0_-2px_0_var(--color-ink)]"
                        : "text-graphite hover:text-ink",
                    )}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="min-w-0 truncate pl-2 font-mono text-xs text-graphite">
              {fileNameFor(title)}
            </span>
          )}
          <div className="flex flex-none items-center gap-0.5">
            <CopyButton text={code} what={`${title} code`} />
            <PlatformLinks links={links} />
          </div>
        </div>

        {live ? (
          <div
            role="tabpanel"
            id={`${baseId}-panel-preview`}
            aria-labelledby={`${baseId}-tab-preview`}
            hidden={showing !== "preview"}
            data-hydrated={hydrated || undefined}
            className="zb-stage flex min-h-[220px] items-center justify-center px-7 py-11"
          >
            <HostStage className="flex w-full min-w-0 flex-col items-center">{live}</HostStage>
          </div>
        ) : null}

        <div
          role={live ? "tabpanel" : undefined}
          id={`${baseId}-panel-code`}
          aria-labelledby={live ? `${baseId}-tab-code` : undefined}
          hidden={showing !== "code"}
        >
          <CodeLines code={code} className="max-h-[440px]" label={`${title} code`} />
        </div>
      </div>
    </div>
  );
}
