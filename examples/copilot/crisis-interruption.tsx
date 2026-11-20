import { Copilot } from "@/components/zoblocks/copilot";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  type CopilotEvent,
} from "@zoblocks/copilot-core";

const events: CopilotEvent[] = [
  { type: "delta", text: "The scripted answer should not appear after interruption." },
  { type: "done", finish: "stop" },
];

const provider = createStaticProvider({
  events,
  disclosure: minimalDisclosure("scripted-demo@1", {
    developer: "Documentation example",
    knowledgeCutoff: "2026-01",
  }),
});

export default function CrisisInterruptionExample() {
  return (
    <div className="w-full min-w-0 max-w-[36rem]">
      <Copilot provider={provider} modes={[lookUp]} locale="en-US" anchor="inline" />
      <p className="m-0 mt-3 text-xs leading-relaxed text-[var(--zb-text-muted)]">
        Development default for en-US. Review crisis wording and regional resources before use.
      </p>
    </div>
  );
}
