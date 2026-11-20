import { Accordion } from "@/components/zoblocks/accordion";

export default function ReaderChoosesWhenToSeeItExample() {
  return (
    <Accordion
      headingLevel={3}
      onDisclose={() => true}
      items={[
        {
          key: "note",
          label: "Your session summary — 13 August",
          access: {
            kind: "advisory",
            notice: "This summary talks about self-harm",
          },
          children: (
            <div className="space-y-2">
              <p>
                During this session, we discussed your recent experiences and the feelings
                associated with self-harm.
              </p>
              <p>
                We also discussed coping strategies and people you can contact when you need
                support.
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
