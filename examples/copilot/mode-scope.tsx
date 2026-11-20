import { Copilot } from "@/components/zoblocks/copilot";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  prepare,
  type CopilotContextResolver,
  type CopilotEvent,
  type ExclusionCategory,
  type FhirResource,
} from "@zoblocks/copilot-core";

const disclosure = minimalDisclosure("scripted-demo@1", {
  developer: "Documentation example",
  knowledgeCutoff: "2026-01",
});

const events: CopilotEvent[] = [
  { type: "delta", text: "This is a scripted response for the scope demonstration." },
  { type: "done", finish: "stop" },
];

// This scripted provider is marked as permitted for this synthetic context demo.
const provider = createStaticProvider({ events, disclosure, phiPermitted: true });

const demoFixtures: { resource: FhirResource; excludedBy?: ExclusionCategory }[] = [
  {
    resource: {
      resourceType: "Observation",
      id: "demo-observation",
      valueString: "Fictional sample observation for interface demonstration",
    },
  },
];

const context: CopilotContextResolver = {
  resolve: async (request) => {
    // The host must enforce authorization and apply request.categories/excludes.
    // These fixture filters demonstrate the contract; they are not authorization.
    const resources: FhirResource[] = [];
    for (const fixture of demoFixtures) {
      if (!request.categories.some((category) => category === fixture.resource.resourceType))
        continue;
      if (fixture.excludedBy && request.excludes.includes(fixture.excludedBy)) continue;
      resources.push(fixture.resource);
    }
    return {
      resources,
      withheld: [{ reason: "policy", count: 2, disclosable: true }],
      asOf: "2026-01-15T12:00:00.000Z",
    };
  },
};

export default function ModeScopeExample() {
  return (
    <div className="w-full min-w-0 max-w-[36rem]">
      <Copilot
        provider={provider}
        modes={[lookUp, prepare]}
        initialModeId="look-up"
        subject={{ reference: "Patient/demo-01", display: "Jordan Lee (fictional)" }}
        context={context}
        actor={{ display: "Documentation example" }}
        anchor="inline"
      />
      <p className="m-0 mt-3 text-xs leading-relaxed text-[var(--zb-text-muted)]">
        Look up reads no patient data. Prepare declares {prepare.reads.join(", ")}; excluded
        categories: {prepare.excludes.join(", ")}. The returned Observation is fictional. This
        scripted provider is configured for synthetic context; that setting is not authorization.
        The host resolver owns authorization. The scope display is not an access control.
      </p>
    </div>
  );
}
