import { notFound } from "next/navigation";
import { currentMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { baseTokens } from "@/lib/base-tokens";
import { can, whyNot } from "@/lib/roles";
import {
  THEME_NAMES,
  buildEditorModel,
  type EditorModel,
  type ThemeName,
} from "@/lib/token-editor";
import { PageHeader } from "@/components/ui";
import { TokenEditor } from "./TokenEditor";

export const metadata = { title: "Design tokens" };

/**
 * The design-token editor.
 *
 * The semantic tier, which is the one a customer may actually move: primitives
 * are the brand ramp and live on the brand screen, and the component tier has
 * its own screen because it is 282 rows and a different job.
 *
 * Everything the editor needs is resolved here rather than in the browser. The
 * token source is a tree of `Map`s over the whole corpus and is not
 * serialisable; resolving it to literals server-side sends a few kilobytes
 * instead of a few hundred, and leaves the browser doing the one thing it has
 * to do live — measuring contrast as a customer types.
 */
export default async function TokensPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = (await currentMember())!;
  const theme = await scoped(member.orgId).themes.findOne({ slug });
  if (!theme) notFound();

  const source = await baseTokens();

  // One model per theme. The semantic tier *is* the per-theme tier, so `accent`
  // in dark and `accent` in light are two editable values, not one.
  const models = Object.fromEntries(
    THEME_NAMES.map((name) => [name, buildEditorModel(source, theme.slug, theme.tokens, name)]),
  ) as Record<ThemeName, EditorModel>;

  return (
    <>
      <PageHeader
        eyebrowHref={`/themes/${slug}`}
        eyebrow={`${theme.name}${theme.liveVersion ? ` · v${theme.liveVersion} live` : " · draft"}`}
        title="Design tokens"
        lede="Three tiers, measured against the same contrast floors the build enforces."
      />

      <TokenEditor
        themeId={theme._id.toHexString()}
        models={models}
        ramp={theme.tokens?.ref?.brand}
        canWrite={can(member.role, "theme.write")}
        reason={whyNot(member.role, "theme.write")}
      />
    </>
  );
}
