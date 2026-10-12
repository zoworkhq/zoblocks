/**
 * Ant Design and Material UI setup, per React framework.
 *
 * Each follows that library's own Next.js guide — antd's
 * (ant.design/docs/react/use-with-next) and MUI's
 * (mui.com/material-ui/integrations/nextjs) — and adds one thing, the
 * ZoBlocks bridge, inside the library's theme provider. The libraries' SSR
 * setup is not optional decoration: without it Next.js sends the first
 * screen with no antd or MUI styles and the page flickers.
 *
 * Every variant was built on 28 Sep 2026 (Next.js 16.3, antd 6.6, MUI 9.4)
 * and its server-rendered HTML checked for two things: the library's CSS in
 * the page, and the bridge's `--zb-accent` equal to the app's own primary
 * colour rather than the library default. That check found the one line
 * neither guide mentions: on the **Pages Router**, Next.js leaves packages
 * external during SSR, the ESM-only bridge then loads a second copy of
 * antd/MUI, and it reads the default theme — while antd's own style
 * extraction comes back empty for the same reason. `transpilePackages`
 * bundles them into one copy and fixes both.
 *
 * The snippets and notes themselves live in `@zoblocks/component-meta`
 * (`integration.ts`), which the agent manifest reads too (ADR 0017). This file
 * only lays them out.
 */

import {
  BRIDGED_STYLES,
  CLINICAL_COLOURS_NOTE,
  FRAMEWORK_LABEL,
  REACT_FRAMEWORKS,
  ZOBLOCKS_STYLE_SUMMARY,
  type BridgedStyle,
} from "@zoblocks/component-meta";
import { CodeBlock } from "@/components/site/code-block";
import { DocTabs } from "@/components/site/doc-tabs";
import { PmCommand } from "@/components/site/pm-command";
import { Callout, Prose } from "@/components/site/docs-shell";

const note = "text-sm leading-relaxed text-graphite";
const link = "text-ink underline underline-offset-2";

/** Tab ids on the page, kept from before the data moved so links still land. */
const TAB_ID = { "next-app": "app", "next-pages": "pages", vite: "vite" } as const;

/** Said once per bridged style, because it is the one thing a bridge will not do. */
function ClinicalColours() {
  return <Callout>{CLINICAL_COLOURS_NOTE}</Callout>;
}

export function ZoBlocksStyle() {
  return (
    <p className={note}>
      <Prose text={ZOBLOCKS_STYLE_SUMMARY} />
    </p>
  );
}

function BridgedStyleSetup({ style }: { style: BridgedStyle }) {
  return (
    <div className="space-y-4">
      <p className={note}>
        <Prose text={style.summary} /> The Next.js setup follows{" "}
        <a href={style.guideUrl} rel="noopener" className={link}>
          {style.label}&rsquo;s own guide
        </a>
        , with the bridge added. Pick your framework:
      </p>
      <DocTabs
        label="React framework"
        tabs={REACT_FRAMEWORKS.map((framework) => {
          const setup = style.frameworks[framework];
          return {
            id: TAB_ID[framework],
            label: FRAMEWORK_LABEL[framework],
            content: (
              <div className="space-y-3">
                <PmCommand commands={[{ add: setup.packages }]} />
                {setup.files.map((file) => (
                  <CodeBlock
                    key={file.file}
                    title={file.file}
                    language={file.language}
                    code={file.code}
                  />
                ))}
                {setup.note ? (
                  <p className={note}>
                    <Prose text={setup.note} />
                  </p>
                ) : null}
              </div>
            ),
          };
        })}
      />
      <ClinicalColours />
    </div>
  );
}

export function AntdSetup() {
  return <BridgedStyleSetup style={BRIDGED_STYLES.antd} />;
}

export function MuiSetup() {
  return <BridgedStyleSetup style={BRIDGED_STYLES.mui} />;
}
