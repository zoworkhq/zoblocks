import { Accordion } from "@/components/zoblocks/accordion";

export default function NestedWithHeadingLevelsExample() {
  return (
    <Accordion
      headingLevel={2}
      items={[
        {
          key: "plan",
          label: "Treatment plan",
          summary: "2 problems · 5 goals",
          children: (
            <Accordion
              headingLevel={3}
              variant="ghost"
              items={[
                {
                  key: "mdd",
                  label: "Major depressive disorder, recurrent, severe",
                  summary: "3 goals",
                  children: (
                    <div className="space-y-2">
                      <p className="font-medium">Treatment goals</p>
                      <ul className="list-disc space-y-1 pl-5">
                        <li>Improve mood and daily functioning.</li>
                        <li>Establish a consistent sleep routine.</li>
                        <li>Develop strategies to manage depressive symptoms.</li>
                      </ul>
                    </div>
                  ),
                },
                {
                  key: "aud",
                  label: "Alcohol use disorder, moderate",
                  summary: "2 goals",
                  children: (
                    <div className="space-y-2">
                      <p className="font-medium">Treatment goals</p>
                      <ul className="list-disc space-y-1 pl-5">
                        <li>Reduce alcohol consumption.</li>
                        <li>Develop strategies to prevent relapse.</li>
                      </ul>
                    </div>
                  ),
                },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
