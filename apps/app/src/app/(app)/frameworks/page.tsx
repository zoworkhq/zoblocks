import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { whyNot } from "@/lib/roles";
import { CLINICAL_TOTAL, FRAMEWORKS, SURFACE_TOTAL } from "@/lib/frameworks";
import { Callout, PageHeader, Panel } from "@/components/ui";
import { FrameworkBoard } from "./FrameworkBoard";

export const metadata = { title: "Frameworks" };

/**
 * Which UI framework the customer's applications are built on.
 *
 * The screen the rail has been linking to since the app was built, and
 * which returned 404 until now.
 *
 * What it deliberately does *not* claim: it does not detect anything. The
 * app has no channel into a customer's running application, so a "detected
 * version" column would be a number invented to fill a column — the honest
 * fact is the major each bridge is written against, which is what decides
 * whether an install resolves. Every other number here is computed from the
 * bridges themselves at build time.
 */
export default async function FrameworksPage() {
  const member = await requireMember();
  const org = await scoped(member.orgId).organisation.get();

  return (
    <>
      <PageHeader
        eyebrow={org?.name}
        title="Frameworks"
        lede="Oxygen components take your host framework's design language through a token bridge."
      />

      <div className="space-y-6">
        <FrameworkBoard
          frameworks={FRAMEWORKS}
          enabled={org?.frameworks ?? []}
          surfaceTotal={SURFACE_TOTAL}
          reason={whyNot(member.role, "org.configure")}
        />

        {/*
          Rewritten to describe what it does rather than what it was going to do.
          
          The previous copy claimed this selected which bridge the preview
          rendered through and which host-theme imports were accepted. Neither
          was wired: the setting was written to the organisation and read by the
          badge counter beside "Frameworks" in the rail, and nowhere else. The
          last sentence was always true and is the important one, so it stays.
        */}
        <Callout tone="info" title="What this setting does">
          It decides which theme exports this app offers you. An organisation that runs Ant Design
          is offered an antd <code className="font-mono text-[0.8125rem]">ConfigProvider</code> file
          on the import and export screen; one that does not is told the format exists and why it is
          hidden. It changes nothing in a running application: a bridge is a package you install and
          mount yourself, so switching here and switching there are two separate acts.
        </Callout>

        <Panel
          title="Why the clinical tokens are never bridged"
          description={`${CLINICAL_TOTAL} of the ${SURFACE_TOTAL} component tokens are refused to every bridge, in both directions.`}
        >
          <p className="body-sm text-graphite">
            A framework has <code className="font-mono text-[0.75rem]">colorError</code>. Oxygen has
            five status tokens carrying a validated contrast floor and 60° of hue separation, so the
            direction of an abnormal result survives colour-vision deficiency. No framework token
            carries direction, so there is nothing honest to map onto.
          </p>
        </Panel>
      </div>
    </>
  );
}
