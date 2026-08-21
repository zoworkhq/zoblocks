import Link from "next/link";
import { notFound } from "next/navigation";
import { SURFACE_COMPONENTS, surfaceFor } from "@oxygenui-design/tokens/surface";
import { THEME_NAMES, withTierDefaults, type ThemeName } from "@oxygenui-design/theme";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { baseTokens } from "@/lib/base-tokens";
import { can, whyNot } from "@/lib/roles";
import { buildEditorModel } from "@/lib/token-editor";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ComponentEditor, type ComponentToken } from "./ComponentEditor";

export const metadata = { title: "Components" };

/**
 * The component tier.
 *
 * These are the tokens a customer may set to restyle one component without
 * touching the others — the override point that exists so "customise the badge"
 * never means "edit the copied file". An edited file can never receive an
 * upstream fix, and every fork is a component that silently stops being
 * maintained.
 *
 * The list is read from the generated surface manifest rather than hand-written
 * here, so it cannot drift from the stylesheets. What each row inherits, and
 * whether it is clinical, both come from the same place.
 */
export default async function ComponentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { slug } = await params;
  const { c } = await searchParams;
  const member = await requireMember();

  const theme = await scoped(member.orgId).themes.findOne({ slug });
  if (!theme) notFound();

  const selected = SURFACE_COMPONENTS.includes(c ?? "") ? (c as string) : "switch";
  const entries = surfaceFor(selected);
  const source = await baseTokens();
  const stored = withTierDefaults(theme.tokens);

  /*
   * A row per token per theme, with the value it *currently* resolves to.
   *
   * Resolved through the same model the token editor uses, so the placeholder a
   * customer sees is the value their application will draw — including any
   * semantic override they made on the other screen. Showing the raw
   * `var(--ox-…)` chain instead would be accurate and useless.
   */
  // Built once per theme and used twice: for the rows, and for the preview's
  // semantic ground. Rebuilding it below would be the same work with a chance
  // of the two disagreeing.
  const models = Object.fromEntries(
    THEME_NAMES.map((name) => [name, buildEditorModel(source, theme.slug, theme.tokens, name)]),
  ) as Record<ThemeName, ReturnType<typeof buildEditorModel>>;

  const resolved = Object.fromEntries(
    THEME_NAMES.map((name) => [name, models[name].resolved]),
  ) as Record<ThemeName, Record<string, string>>;

  const tokens = Object.fromEntries(
    THEME_NAMES.map((name) => {
      const model = models[name];
      return [
        name,
        entries.map((entry): ComponentToken => ({
          name: entry.name,
          kind: entry.kind,
          ...(entry.semantic ? { semantic: entry.semantic } : {}),
          ...(entry.semantic && model.resolved[entry.semantic]
            ? { base: model.resolved[entry.semantic] }
            : {}),
          editable: entry.bridgeable,
        })),
      ];
    }),
  ) as Record<ThemeName, ComponentToken[]>;

  const locked = entries.filter((entry) => !entry.bridgeable).length;

  return (
    <>
      <PageHeader
        eyebrowHref={`/themes/${slug}`}
        eyebrow={`${theme.name}${theme.liveVersion ? ` · v${theme.liveVersion} live` : " · draft"}`}
        title="Components"
        lede="Set only what has to differ — the rest falls through to the semantic tier."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,11rem)_1fr] lg:items-start">
        <nav aria-label="Components">
          <ul className="space-y-0.5">
            {SURFACE_COMPONENTS.map((name) => {
              const count = surfaceFor(name).length;
              const active = name === selected;
              return (
                <li key={name}>
                  <Link
                    href={`/themes/${slug}/components?c=${name}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5",
                      "text-[0.8125rem] transition-colors duration-200",
                      active
                        ? "bg-accent-wash font-medium text-oxygen-deep"
                        : "text-graphite hover:bg-paper-sunk hover:text-ink",
                    )}
                  >
                    <span className="truncate">{name}</span>
                    <span className="tabular text-[0.6875rem] text-graphite-soft">{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-[1.0625rem] font-semibold tracking-[-0.015em]">
              {selected}
            </h2>
            <p className="tabular text-[0.8125rem] text-graphite">
              {entries.length} token{entries.length === 1 ? "" : "s"}
              {locked > 0 && ` · ${locked} locked`}
            </p>
          </div>

          <ComponentEditor
            themeId={theme._id.toHexString()}
            component={selected}
            tokens={tokens}
            savedOverrides={stored.component}
            resolved={resolved}
            canWrite={can(member.role, "theme.write")}
            reason={whyNot(member.role, "theme.write")}
          />
        </div>
      </div>
    </>
  );
}
