import { Copilot } from "@/components/zoblocks/copilot";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  type CopilotEvent,
  type Source,
} from "@zoblocks/copilot-core";

const passage =
  "This fictional source record demonstrates citation display; it is not clinical guidance.";

const source: Source = {
  id: "demo-source",
  title: "Illustrative demonstration source",
  passage,
  highlight: [0, passage.length],
  kind: "org-policy",
  version: "demo-1",
  retrievedAt: "2026-01-15T12:00:00.000Z",
};

const answer = "This scripted response demonstrates how a cited statement is displayed.";

const events: CopilotEvent[] = [
  { type: "delta", text: answer },
  { type: "citation", marker: 1, source },
  { type: "claim", claim: { span: [0, answer.length], markers: [1] } },
  { type: "done", finish: "stop" },
];

const provider = createStaticProvider({
  events,
  disclosure: minimalDisclosure("scripted-demo@1", {
    developer: "Documentation example",
    knowledgeCutoff: "2026-01",
  }),
});

export default function GroundedCitationsExample() {
  return (
    <div className="w-full min-w-0 max-w-[36rem]">
      <Copilot provider={provider} modes={[lookUp]} anchor="inline" />
      <p className="m-0 mt-3 text-xs text-[var(--zb-text-muted)]">
        Illustrative source record only; not clinical guidance.
      </p>
    </div>
  );
}
