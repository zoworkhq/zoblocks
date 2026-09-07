import Link from "next/link";
import { baseTokens } from "@/lib/base-tokens";
import { buildEditorModel } from "@/lib/token-editor";
import { FrameworkSpecimen } from "./FrameworkSpecimen";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { can, whyNot } from "@/lib/roles";
import { exportThemeAs } from "@/lib/themes";
import {
  Callout,
  CopyButton,
  DownloadButton,
  PageHeader,
  Panel,
  StatusChip,
} from "@/components/ui";
import { ImportForm } from "./ImportForm";

export const metadata = { title: "Import and export" };

const FORMATS = [
  {
    id: "dtcg" as const,
    name: "DTCG JSON",
    body: "The portable form. Commit it as a built-in brand, or open it in Tokens Studio.",
  },
  {
    id: "css" as const,
    name: "CSS custom properties",
    body: "A drop-in block for any stack. No build step.",
  },
  { id: "tailwind" as const, name: "Tailwind @theme", body: "For Tailwind v4 consumers." },
  {
    id: "antd" as const,
    name: "antd ConfigProvider",
    body: "Theme your own antd components with this brand — not only ZoBlocks's.",
    /*
      Offered only to an organisation that runs it.
      
      Handing somebody a theme file for a library they do not use is not a
      harmless extra: it is five downloads where three are relevant, and it
      quietly suggests the product knows less about them than it does. The
      Frameworks screen is where that is declared, and until now nothing read
      it.
    */
    framework: "antd" as const,
  },
  {
    id: "mui" as const,
    name: "MUI createTheme",
    body: "The same, for Material UI.",
    framework: "mui" as const,
  },
];

/**
 * The media type for a generated file.
 *
 * Set from the extension the exporter chose rather than defaulting everything
 * to `text/plain`: a browser given the right type offers the right application
 * when the file is opened, and a `.css` saved as plain text is a small papercut
 * on every single download.
 */
function mimeFor(filename: string): string {
  if (filename.endsWith(".json")) return "application/json";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".ts")) return "text/typescript";
  return "text/plain";
}

/**
 * Getting a theme out, and getting one in.
 *
 * The two framework exports are the commercially interesting ones: they are the
 * bridge mapping tables run backwards, so a customer can theme their *own*
 * components from the brand they configured here. That is a materially better
 * story than having themed our components only, and it costs almost nothing
 * because the correspondence already exists.
 */
export default async function TransferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await requireMember();
  const data = scoped(member.orgId);

  const theme = await data.themes.findOne({ slug });
  if (!theme) notFound();

  /*
   * `theme.export` is a real gate, and it was not being applied.
   *
   * Three roles hold it and a viewer does not — yet this screen only ever
   * checked `theme.write`, for the import half. So a viewer could download the
   * full DTCG source, the CSS, and the antd and MUI mapping tables: the
   * capability existed in the grants table, was never consulted, and the least
   * privileged role had the export a paying customer's design system.
   *
   * Nothing is even computed unless the role may have it. Rendering the panels
   * and hiding the buttons would still have put every byte in the page source.
   */
  const canExport = can(member.role, "theme.export");
  const auth = { member, data };

  const org = await data.organisation.get();
  const enabled = org?.frameworks ?? [];
  const offered = FORMATS.filter((f) => !f.framework || enabled.includes(f.framework));
  const withheld = FORMATS.filter((f) => f.framework && !enabled.includes(f.framework));

  const exports = canExport
    ? await Promise.all(
        offered.map(async (format) => ({
          ...format,
          result: await exportThemeAs(auth, theme._id, format.id),
        })),
      )
    : [];

  /*
   * The same resolved tokens the framework exports were built from.
   *
   * Computed once here rather than per card, and deliberately the same value —
   * a specimen drawn from a second resolution could disagree with the file
   * beside it, which is the whole failure this screen now exists to rule out.
   */
  const resolved = canExport
    ? buildEditorModel(await baseTokens(), theme.slug, theme.tokens, "light").resolved
    : {};

  return (
    <>
      <PageHeader
        eyebrowHref={`/themes/${slug}`}
        eyebrow={`${theme.name}${theme.liveVersion ? ` · v${theme.liveVersion}` : " · draft"}`}
        title="Import and export"
        lede="Every way out this organisation can use, and one way in."
      />

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 font-display text-[0.9375rem] font-semibold tracking-[-0.008em]">
            Export
          </h2>
          {!canExport && (
            <Callout tone="info" title="Your role cannot export this theme">
              {whyNot(member.role, "theme.export") ??
                "Exporting needs a developer, a designer or an admin."}
            </Callout>
          )}
          {/*
            What is missing, and why — rather than a shorter list.
            
            A format that silently disappears reads as a product that lost a
            feature. Naming the setting that removed it makes the Frameworks
            screen legible from the place its effect is felt, which is the only
            place anybody would look for it.
          */}
          {canExport && withheld.length > 0 && (
            <Callout tone="info" title="Two more formats are available" className="mb-3">
              {withheld.map((f) => f.name).join(" and ")} {withheld.length === 1 ? "is" : "are"}{" "}
              hidden because this organisation does not list{" "}
              {withheld.length === 1 ? "that framework" : "those frameworks"} on the{" "}
              <Link href="/frameworks" className="link">
                frameworks screen
              </Link>
              .
            </Callout>
          )}

          <ul className="grid gap-3 sm:grid-cols-2">
            {exports.map(({ id, name, body, result, framework }) => (
              <li key={id}>
                <Panel
                  title={name}
                  description={body}
                  actions={
                    <div className="flex items-center gap-1.5">
                      <CopyButton value={result.body} variant="ghost" />
                      <DownloadButton
                        filename={result.filename}
                        contents={result.body}
                        type={mimeFor(result.filename)}
                      >
                        Save
                      </DownloadButton>
                    </div>
                  }
                  className="h-full"
                >
                  <p className="tabular font-mono text-[0.6875rem] text-graphite-soft">
                    {result.filename}
                  </p>

                  {/*
                    The file, rendered — in the framework's own components.
                    
                    A download is a claim that a brand survived translation into
                    somebody else's vocabulary, and the only way to settle that
                    is to look at their Button rather than at a hex in a JSON
                    file.
                  */}
                  {framework && (
                    <div className="mt-3">
                      <p className="eyebrow mb-1.5 text-[0.5625rem] text-graphite-soft">
                        {framework === "antd" ? "Ant Design" : "Material UI"} components, under this
                        file
                      </p>
                      <FrameworkSpecimen framework={framework} resolved={resolved} />
                    </div>
                  )}

                  {result.caveat && (
                    <p className="mt-2 flex gap-1.5 text-[0.75rem] leading-relaxed text-warn">
                      <AlertTriangle
                        aria-hidden="true"
                        strokeWidth={2}
                        className="mt-0.5 size-3.5 shrink-0"
                      />
                      <span>{result.caveat}</span>
                    </p>
                  )}

                  {/*
                    An instrument, not a document: this is rendering generated
                    output rather than presenting prose, so it takes the dark
                    panel in both themes.
                  */}
                  <details className="mt-3">
                    <summary className="flex min-h-6 cursor-pointer items-center text-[0.75rem] text-brand-deep">
                      Preview
                    </summary>
                    <pre className="instrument mt-2 max-h-48 overflow-auto p-3 font-mono text-[0.625rem] leading-relaxed">
                      {result.body.slice(0, 900)}
                    </pre>
                  </details>
                </Panel>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-[0.9375rem] font-semibold tracking-[-0.008em]">
            Import
          </h2>

          {can(member.role, "theme.write") ? (
            <ImportForm themeId={theme._id.toHexString()} />
          ) : (
            <Callout tone="info" title="Your role can export but not import">
              Importing changes the draft, which needs a designer or an admin.
            </Callout>
          )}
        </section>

        <p className="body-sm flex flex-wrap items-center gap-2 text-graphite">
          <StatusChip tone="neutral">note</StatusChip>
          Importing writes to the draft. Nothing reaches an application until the theme is
          published.
        </p>
      </div>
    </>
  );
}
