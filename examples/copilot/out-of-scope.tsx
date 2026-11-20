import { Copilot } from "@/components/zoblocks/copilot";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  type CopilotEvent,
} from "@zoblocks/copilot-core";

const events: CopilotEvent[] = [
  { type: "delta", text: "This event should not be reached for the refused request." },
  { type: "done", finish: "stop" },
];

const provider = createStaticProvider({
  events,
  disclosure: minimalDisclosure("scripted-demo@1", {
    developer: "Documentation example",
    knowledgeCutoff: "2026-01",
  }),
});

export default function OutOfScopeExample() {
  return (
    <div className="w-full min-w-0 max-w-[36rem]">
      <Copilot provider={provider} modes={[lookUp]} anchor="inline" />
    </div>
  );
}
