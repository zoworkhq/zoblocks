import { notFound } from "next/navigation";
import { currentMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { baseTokens } from "@/lib/base-tokens";
import { can, whyNot } from "@/lib/roles";
import { buildEditorModel } from "@/lib/token-editor";
import { PageHeader } from "@/components/ui";
import { BrandEditor } from "./BrandEditor";
import { BrandAssets } from "./BrandAssets";
import { DeriveFavicon } from "./DeriveFavicon";

export const metadata = { title: "Brand" };

/**
 * The primitive tier — the customer's own palette.
 *
 * Separate from the token editor because it is a different question. The token
 * editor asks "what should this *mean*"; this asks "what are your colours". A
 * ramp is also the one tier a built-in brand file can carry, so what is edited
 * here is exactly what a customer could commit to the repository instead.
 */
export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = (await currentMember())!;
  const data = scoped(member.orgId);
  const theme = await data.themes.findOne({ slug });
  if (!theme) notFound();

  const source = await baseTokens();

  /*
   * The status colours as this theme actually resolves them, in light.
   *
   * Read through the same model the token editor uses rather than from the raw
   * source, so what the simulation shows is what this customer's application
   * will draw — including any semantic overrides they have made elsewhere.
   */
  const model = buildEditorModel(source, theme.slug, theme.tokens, "light");
  const status = Object.fromEntries(
    (model.groups.find((group) => group.name === "status")?.tokens ?? [])
      .filter((token) => token.isColour && !token.path.endsWith("-bg"))
      .map((token) => [token.path, token.resolved]),
  );

  return (
    <>
      <PageHeader
        eyebrowHref={`/themes/${slug}`}
        eyebrow={`${theme.name}${theme.liveVersion ? ` · v${theme.liveVersion} live` : " · draft"}`}
        title="Brand"
        lede="Your palette. Every semantic token resolves through these steps."
      />

      <BrandEditor
        themeId={theme._id.toHexString()}
        ramp={theme.tokens.ref?.brand ?? {}}
        status={status}
        canWrite={can(member.role, "theme.write")}
        reason={whyNot(member.role, "theme.write")}
      />

      <div className="mt-6">
        <BrandAssets
          themeId={theme._id.toHexString()}
          assets={theme.assets?.brand ?? []}
          canWrite={can(member.role, "theme.write")}
          reason={whyNot(member.role, "theme.write")}
        />
      </div>

      <div className="mt-6">
        <DeriveFavicon
          themeId={theme._id.toHexString()}
          source={(theme.assets?.brand ?? []).find((a) => a.role === "mark-light")}
          canWrite={can(member.role, "theme.write")}
          reason={whyNot(member.role, "theme.write")}
        />
      </div>
    </>
  );
}
