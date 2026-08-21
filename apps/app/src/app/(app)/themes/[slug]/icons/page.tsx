import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { can, whyNot } from "@/lib/roles";
import { PageHeader } from "@/components/ui";
import { IconGrid } from "./IconGrid";

export const metadata = { title: "Icons" };

/**
 * The glyphs a customer may replace.
 *
 * Twenty-nine, all of them copilot chrome, plus five that carry meaning and are
 * refused. That split is the whole screen: the library has no general icon
 * layer, so this is not "your icon set" — it is the specific affordances whose
 * shape is a brand decision rather than a clinical one.
 */
export default async function IconsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await requireMember();

  const theme = await scoped(member.orgId).themes.findOne({ slug });
  if (!theme) notFound();

  return (
    <>
      <PageHeader
        eyebrowHref={`/themes/${slug}`}
        eyebrow={`${theme.name}${theme.liveVersion ? ` · v${theme.liveVersion} live` : " · draft"}`}
        title="Icons"
        lede="Replace the copilot's glyphs with your own. Each is drawn as a mask, so it takes the colour of whatever it sits beside."
      />

      <div className="mt-6">
        <IconGrid
          themeId={theme._id.toHexString()}
          overrides={theme.assets?.icons ?? []}
          canWrite={can(member.role, "theme.write")}
          reason={whyNot(member.role, "theme.write")}
        />
      </div>
    </>
  );
}
