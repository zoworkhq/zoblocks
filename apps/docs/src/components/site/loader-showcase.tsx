/**
 * The homepage instrument: all five loaders, running.
 *
 * Not a screenshot and not a video — the real registry components, the same
 * files `zoblocks add` copies into a customer's project. A loader is one of the
 * few components whose entire value is visible in three seconds, so the
 * honest thing to put on a homepage is the component itself.
 *
 * Server component: nothing here has state. The motion is CSS.
 */

import Link from "next/link";
import { PulseLoader } from "@/registry/zoblocks/pulse-loader/pulse-loader";
import { RhythmLoader } from "@/registry/zoblocks/rhythm-loader/rhythm-loader";
import { BreathLoader } from "@/registry/zoblocks/breath-loader/breath-loader";
import { HelixLoader } from "@/registry/zoblocks/helix-loader/helix-loader";
import { InfusionLoader } from "@/registry/zoblocks/infusion-loader/infusion-loader";

const LOADERS = [
  {
    name: "pulse-loader",
    title: "Pulse",
    note: "Heart and rhythm line, 60 bpm",
    render: () => <PulseLoader size={92} label="Loading your records" />,
  },
  {
    name: "rhythm-loader",
    title: "Rhythm",
    note: "One strip, swept",
    render: () => <RhythmLoader size={112} label="Loading results" />,
  },
  {
    name: "breath-loader",
    title: "Breath",
    note: "15 a minute",
    render: () => <BreathLoader size={78} label="Loading your information" />,
  },
  {
    name: "helix-loader",
    title: "Helix",
    note: "For the lab",
    render: () => <HelixLoader size={112} label="Running the panel" />,
  },
  {
    name: "infusion-loader",
    title: "Infusion",
    note: "Determinate",
    render: () => <InfusionLoader size={124} progress={62} label="Importing records" />,
  },
] as const;

/**
 * @param caption  The pacing note under the grid. Off where the surrounding
 *   section already carries its own claim about the loaders — this component
 *   is rendered twice on the home page, and the note was the one part that
 *   read as a mistake rather than as a reprise.
 */
export function LoaderShowcase({ caption = true }: { caption?: boolean } = {}) {
  return (
    <div className="instrument instrument-demo">
      <div className="relative flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Live · the real components</span>
        </div>
        <span className="eyebrow hidden text-panel-muted sm:block">svg + css · 0 dependencies</span>
      </div>

      <div className="relative grid gap-px bg-panel-rule/60 sm:grid-cols-2 lg:grid-cols-5">
        {LOADERS.map((loader) => (
          <Link
            key={loader.name}
            href={`/components/${loader.name}`}
            className="group flex flex-col items-center gap-4 bg-panel px-4 py-8 transition-colors duration-300 hover:bg-panel-fg/[0.03]"
          >
            <div className="flex min-h-[112px] items-center justify-center">{loader.render()}</div>
            <div className="text-center">
              <p className="font-display text-sm font-semibold tracking-tight text-panel-fg">
                {loader.title}
              </p>
              <p className="mt-0.5 text-[0.6875rem] text-panel-muted">{loader.note}</p>
            </div>
          </Link>
        ))}
      </div>

      {caption ? (
        <div className="relative border-t border-panel-rule bg-panel/60 px-4 py-3">
          <p className="max-w-3xl text-[0.8125rem] leading-relaxed text-panel-muted">
            Paced to resting physiology rather than to a spinner: 60 beats a minute, a seven percent
            beat, nothing above 1.7 Hz. Each one is installed on its own, respects{" "}
            <code className="font-mono text-[0.75rem] text-panel-fg/80">
              prefers-reduced-motion
            </code>{" "}
            with a designed still state, and announces the wait in words.
          </p>
        </div>
      ) : null}
    </div>
  );
}
