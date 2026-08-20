import Link from "next/link";
import { THEME_NAMES, type ThemeName } from "@oxygenui-design/theme";
import { currentMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { baseTokens } from "@/lib/base-tokens";
import { buildEditorModel } from "@/lib/token-editor";
import { EmptyState, PageHeader } from "@/components/ui";
import { Playground, type PlaygroundTheme } from "./Playground";

export const metadata = { title: "Playground" };

/**
 * Every theme this organisation has, across every axis, over real components.
 *
 * The screen a customer shows their design lead. It is also the fastest way to
 * catch the thing no contrast ratio catches — a palette that passes every pair
 * and still looks wrong at clinical density in dark mode.
 */
export default async function PlaygroundPage() {
  const member = (await currentMember())!;
  const data = scoped(member.orgId);
  const themes = await data.themes.find().sort({ updatedAt: -1 }).toArray();
  const source = await baseTokens();

  const models: PlaygroundTheme[] = themes.map((theme) => {
    const resolved = {} as Record<ThemeName, Record<string, string>>;
    let dependents: Record<string, string[]> = {};

    for (const name of THEME_NAMES) {
      const model = buildEditorModel(source, theme.slug, theme.tokens, name);
      resolved[name] = model.resolved;
      // Identical for every theme — it is derived from the manifest, not from
      // values — so the last one wins and that is fine.
      dependents = model.dependents;
    }

    return {
      slug: theme.slug,
      name: theme.name,
      liveVersion: theme.liveVersion,
      resolved,
      dependents,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow={`${themes.length} theme${themes.length === 1 ? "" : "s"}`}
        title="Playground"
        lede="Brand, mode, density and colour vision, over real components."
      />

      {models.length === 0 ? (
        <EmptyState
          title="No themes to preview"
          body="The playground renders your own themes across every axis. Create one and it appears here."
          actions={
            <Link href="/themes/new" className="text-[0.8125rem] link">
              Create a theme →
            </Link>
          }
        />
      ) : (
        <Playground themes={models} />
      )}
    </>
  );
}
