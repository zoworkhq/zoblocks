/**
 * How ZoBlocks is set up in a project — per framework, per UI style.
 *
 * The one statement of it. The docs page at /docs renders these snippets and
 * notes, and `pnpm gen` writes the same objects into the agent manifest the
 * MCP server serves (ADR 0017), so a reader and a coding agent can never be
 * told two different things. They were two copies for exactly as long as the
 * docs were the only reader.
 *
 * Everything here was built before it was written — see the page's own header
 * comment for what was run, and `apps/docs/src/app/docs/ui-library-setup.tsx`
 * for what the build checks found (the Pages Router `transpilePackages` line
 * and the MUI `"use client"` are both findings, not guesses).
 *
 * Notes are plain text with `backticks` around code, so both readers can use
 * them: the docs render each backticked span as inline code, and the manifest
 * passes the string through unchanged.
 */

/** The React frameworks with full support: every component, from the CLI. */
export const REACT_FRAMEWORKS = ["next-app", "next-pages", "vite"] as const;
export type ReactFramework = (typeof REACT_FRAMEWORKS)[number];

/** Frameworks that get the loaders and the switch, as web components. */
export const WEB_COMPONENT_FRAMEWORKS = ["vue", "angular", "svelte", "html"] as const;
export type WebComponentFramework = (typeof WEB_COMPONENT_FRAMEWORKS)[number];

export type Framework = ReactFramework | WebComponentFramework;

export const FRAMEWORK_LABEL: Record<Framework, string> = {
  "next-app": "Next.js App Router",
  "next-pages": "Next.js Pages Router",
  vite: "Vite",
  vue: "Vue",
  angular: "Angular",
  svelte: "Svelte",
  html: "HTML",
};

export const UI_STYLES = ["zoblocks", "antd", "mui"] as const;
export type UiStyle = (typeof UI_STYLES)[number];

/** A file to create or change. `file` is project-relative. */
export interface Snippet {
  file: string;
  language: string;
  code: string;
}

/* ------------------------------------------------------------------ */
/* Rules for generated code                                           */
/* ------------------------------------------------------------------ */

/**
 * The rules that matter when generating code with these components. Written
 * into `llms.txt` and the agent manifest from here, so the two cannot differ.
 * One sentence per line; the emitters wrap them.
 */
export const CODING_RULES: readonly string[] = [
  "A missing value renders as explicitly missing. Never substitute an empty string or a dash.",
  'An uninterpreted result reads "Not interpreted", never "Normal".',
  "Status is never conveyed by colour alone; every severity carries an icon and a text label.",
  "Never build a Tailwind class name from a variable. Tailwind resolves classes by scanning source text, so a template literal produces no CSS and the severity styling silently disappears.",
];

/**
 * What ZoBlocks deliberately does not ship. An agent's most common mistake is
 * inventing the missing piece — `@/components/zoblocks/button` — because the
 * catalog cannot list an absence. Primitives follow Ant Design's API (ADR
 * 0010) and the chrome around a clinical component comes from the host app.
 */
export const SCOPE_NOTE =
  "ZoBlocks ships clinical components, loaders and a few controls — not a general UI kit. There is no ZoBlocks Button, Input, Select or Modal: use the app's own UI library for those (Ant Design, Material UI, or plain elements), and never invent a ZoBlocks import that is not in the catalog.";

/* ------------------------------------------------------------------ */
/* Base setup: alias, stylesheet, first component                     */
/* ------------------------------------------------------------------ */

/** Step 1 — the `@/` alias the components import each other through. */
export const ALIAS_SETUP: { next: readonly Snippet[]; vite: readonly Snippet[] } = {
  next: [
    {
      file: "tsconfig.json",
      language: "json",
      code: `{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}`,
    },
  ],
  vite: [
    {
      file: "vite.config.ts",
      language: "ts",
      code: `import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});`,
    },
    {
      file: "tsconfig.app.json and tsconfig.json",
      language: "jsonc",
      code: `{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
    // …keep the options already here
  }
}`,
    },
  ],
};

/**
 * Step 4 — the global stylesheet, per framework, for the first component the
 * docs install (the Pulse Loader, whose sheet is `zoblocks-loader.css`).
 *
 * The Pages Router's stylesheet sits in styles/, beside the ones `add` writes,
 * which is why its imports are `./` and the other two are not.
 */
export const GLOBAL_STYLESHEET: Record<ReactFramework, Snippet> = {
  "next-app": {
    file: "src/app/globals.css",
    language: "css",
    code: `@import "tailwindcss";

/* ZoBlocks */
@import "../styles/zoblocks-tokens.css";
@import "../styles/zoblocks-loader.css";
@source "../components/zoblocks";`,
  },
  "next-pages": {
    file: "src/styles/globals.css",
    language: "css",
    code: `@import "tailwindcss";

/* ZoBlocks */
@import "./zoblocks-tokens.css";
@import "./zoblocks-loader.css";
@source "../components/zoblocks";`,
  },
  vite: {
    file: "src/index.css",
    language: "css",
    code: `@import "tailwindcss";

/* ZoBlocks */
@import "./styles/zoblocks-tokens.css";
@import "./styles/zoblocks-loader.css";
@source "./components/zoblocks";`,
  },
};

/** Step 5 — the first component, used anywhere. */
export const FIRST_COMPONENT_USAGE = `import { PulseLoader } from "@/components/zoblocks/pulse-loader";

export default function Page() {
  return <PulseLoader label="Loading your records" showLabel />;
}`;

/* ------------------------------------------------------------------ */
/* Server Components (Next.js App Router)                             */
/* ------------------------------------------------------------------ */

/*
 * Both built in a fresh Next.js 16 App Router app on 28 Sep 2026. ResultValue
 * has no "use client" of its own — it is pure presentation — so it renders on
 * the server as-is; given `onOpenReport` from a Server Component the build
 * fails ("Event handlers cannot be passed to Client Component props"), and the
 * wrapper below is the fix.
 */
export const SERVER_COMPONENTS = {
  page: {
    file: "src/app/page.tsx — a Server Component",
    language: "tsx",
    code: `import { ResultValue, fromObservation } from "@/components/zoblocks/result-value";

export default async function Page() {
  const observation = await getObservation(); // your FHIR Observation

  // Works. No "use client" needed on the page.
  return <ResultValue value={fromObservation(observation)} now={new Date().toISOString()} />;
}`,
  },
  clientWrapper: {
    file: "src/app/result-row.tsx",
    language: "tsx",
    code: `"use client";

import { ResultValue, type ResultValueData } from "@/components/zoblocks/result-value";

export function ResultRow({ value, now }: { value: ResultValueData; now: string }) {
  return <ResultValue value={value} now={now} onOpenReport={(v) => openReport(v.id)} />;
}`,
  },
} as const satisfies Record<string, Snippet>;

/* ------------------------------------------------------------------ */
/* UI styles: ZoBlocks, Ant Design, Material UI                       */
/* ------------------------------------------------------------------ */

export interface FrameworkStyleSetup {
  /** Packages to add, space-separated — rendered for the reader's package manager. */
  packages: string;
  files: readonly Snippet[];
  note?: string;
}

export interface BridgedStyle {
  label: string;
  /** The library's own Next.js guide, which these setups follow. */
  guideUrl: string;
  summary: string;
  frameworks: Record<ReactFramework, FrameworkStyleSetup>;
}

export const ZOBLOCKS_STYLE_SUMMARY =
  "The default look, with nothing to install or wrap. The `zoblocks-tokens.css` import from step 4 is all it needs, and it works the same in Next.js and Vite. Use this when your app has no other component library, or when you want ZoBlocks’s own design.";

/** Said once per bridged style, because it is the one thing a bridge will not do. */
export const CLINICAL_COLOURS_NOTE =
  "Clinical status colours — critical, high, low — always stay ZoBlocks’s, whatever your theme says, because they are tested for contrast and colour blindness.";

const MUI_CORE = "@mui/material @emotion/react @emotion/styled @zoblocks/bridge-mui";

export const BRIDGED_STYLES: Record<Exclude<UiStyle, "zoblocks">, BridgedStyle> = {
  antd: {
    label: "Ant Design",
    guideUrl: "https://ant.design/docs/react/use-with-next",
    summary:
      "For an app that already uses Ant Design. `AntdBridge` reads your `ConfigProvider` theme and hands its primary colour, radius and font to ZoBlocks.",
    frameworks: {
      "next-app": {
        packages: "antd @ant-design/nextjs-registry @zoblocks/bridge-antd",
        files: [
          {
            file: "src/app/providers.tsx",
            language: "tsx",
            code: `"use client";

import { ConfigProvider } from "antd";
import { AntdBridge } from "@zoblocks/bridge-antd";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#7c3aed", borderRadius: 10 } }}>
      <AntdBridge>{children}</AntdBridge>
    </ConfigProvider>
  );
}`,
          },
          {
            file: "src/app/layout.tsx",
            language: "tsx",
            code: `import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Providers } from "./providers";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}`,
          },
        ],
        note: "`AntdRegistry` puts antd’s styles into the server-rendered page, so it does not flash unstyled. Keep your existing fonts and metadata in the layout.",
      },
      "next-pages": {
        packages: "antd @ant-design/cssinjs @zoblocks/bridge-antd",
        files: [
          {
            file: "next.config.ts",
            language: "ts",
            code: `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["antd", "@ant-design/cssinjs", "@zoblocks/bridge-antd"],
};

export default nextConfig;`,
          },
          {
            file: "src/pages/_document.tsx",
            language: "tsx",
            code: `import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import Document, { Head, Html, Main, NextScript } from "next/document";
import type { DocumentContext } from "next/document";

const MyDocument = () => (
  <Html lang="en">
    <Head />
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
);

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const cache = createCache();
  const originalRenderPage = ctx.renderPage;
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => (
        <StyleProvider cache={cache}>
          <App {...props} />
        </StyleProvider>
      ),
    });

  const initialProps = await Document.getInitialProps(ctx);
  const style = extractStyle(cache, true);
  return {
    ...initialProps,
    styles: (
      <>
        {initialProps.styles}
        <style dangerouslySetInnerHTML={{ __html: style }} />
      </>
    ),
  };
};

export default MyDocument;`,
          },
          {
            file: "src/pages/_app.tsx",
            language: "tsx",
            code: `import type { AppProps } from "next/app";
import { ConfigProvider } from "antd";
import { AntdBridge } from "@zoblocks/bridge-antd";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#7c3aed", borderRadius: 10 } }}>
      <AntdBridge>
        <Component {...pageProps} />
      </AntdBridge>
    </ConfigProvider>
  );
}`,
          },
        ],
        note: "`transpilePackages` is required on the Pages Router. Without it the server renders antd unstyled and ZoBlocks with antd’s default theme instead of yours.",
      },
      vite: {
        packages: "antd @zoblocks/bridge-antd",
        files: [
          {
            file: "src/main.tsx",
            language: "tsx",
            code: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import { AntdBridge } from "@zoblocks/bridge-antd";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider theme={{ token: { colorPrimary: "#7c3aed", borderRadius: 10 } }}>
      <AntdBridge>
        <App />
      </AntdBridge>
    </ConfigProvider>
  </StrictMode>,
);`,
          },
        ],
      },
    },
  },
  mui: {
    label: "Material UI",
    guideUrl: "https://mui.com/material-ui/integrations/nextjs/",
    summary:
      "For an app that already uses Material UI. `MuiBridge` reads your `ThemeProvider` theme and hands its primary colour, radius and font to ZoBlocks.",
    frameworks: {
      "next-app": {
        packages: `${MUI_CORE} @mui/material-nextjs @emotion/cache`,
        files: [
          {
            file: "src/theme.ts",
            language: "ts",
            code: `"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: { primary: { main: "#7c3aed" } },
  shape: { borderRadius: 10 },
});

export default theme;`,
          },
          {
            file: "src/app/layout.tsx",
            language: "tsx",
            code: `import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { MuiBridge } from "@zoblocks/bridge-mui";
import theme from "../theme";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <MuiBridge>{children}</MuiBridge>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}`,
          },
        ],
        note: "`AppRouterCacheProvider` puts MUI’s styles into the server-rendered page. `enableCssLayer` lets your Tailwind classes override MUI’s. On Next.js 15, import from `v15-appRouter`.",
      },
      "next-pages": {
        packages: `${MUI_CORE} @mui/material-nextjs @emotion/cache @emotion/server`,
        files: [
          {
            file: "next.config.ts",
            language: "ts",
            code: `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zoblocks/bridge-mui"],
};

export default nextConfig;`,
          },
          {
            file: "src/pages/_document.tsx",
            language: "tsx",
            code: `import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentContext, DocumentProps } from "next/document";
import {
  DocumentHeadTags,
  documentGetInitialProps,
  type DocumentHeadTagsProps,
} from "@mui/material-nextjs/v16-pagesRouter";

export default function MyDocument(props: DocumentProps & DocumentHeadTagsProps) {
  return (
    <Html lang="en">
      <Head>
        <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  return documentGetInitialProps(ctx);
};`,
          },
          {
            file: "src/pages/_app.tsx",
            language: "tsx",
            code: `import type { AppProps } from "next/app";
import { AppCacheProvider } from "@mui/material-nextjs/v16-pagesRouter";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MuiBridge } from "@zoblocks/bridge-mui";
import "@/styles/globals.css";

const theme = createTheme({
  palette: { primary: { main: "#7c3aed" } },
  shape: { borderRadius: 10 },
});

export default function App(props: AppProps) {
  const { Component, pageProps } = props;
  return (
    <AppCacheProvider {...props}>
      <ThemeProvider theme={theme}>
        <MuiBridge>
          <Component {...pageProps} />
        </MuiBridge>
      </ThemeProvider>
    </AppCacheProvider>
  );
}`,
          },
        ],
        note: "`transpilePackages` is required on the Pages Router, or the server renders ZoBlocks with MUI’s default theme instead of yours. On Next.js 15, import from `v15-pagesRouter`.",
      },
      vite: {
        packages: MUI_CORE,
        files: [
          {
            file: "src/main.tsx",
            language: "tsx",
            code: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MuiBridge } from "@zoblocks/bridge-mui";
import App from "./App";
import "./index.css";

const theme = createTheme({
  palette: { primary: { main: "#7c3aed" } },
  shape: { borderRadius: 10 },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <MuiBridge>
        <App />
      </MuiBridge>
    </ThemeProvider>
  </StrictMode>,
);`,
          },
        ],
      },
    },
  },
};

/* ------------------------------------------------------------------ */
/* Web components: Vue, Angular, Svelte, HTML                         */
/* ------------------------------------------------------------------ */

/**
 * Outside React only the loaders and the switch exist, as dependency-free
 * custom elements. These are the snippets `apps/smoke` builds and drives in
 * three engines on every CI run.
 */
export const WEB_COMPONENTS: {
  packages: string;
  elements: readonly string[];
  frameworks: Record<WebComponentFramework, Snippet>;
} = {
  packages: "@zoblocks/loaders @zoblocks/elements",
  elements: [
    "zb-pulse-loader",
    "zb-rhythm-loader",
    "zb-breath-loader",
    "zb-helix-loader",
    "zb-infusion-loader",
    "zb-switch",
  ],
  frameworks: {
    vue: {
      file: "main.ts, vite.config.ts and a .vue template",
      language: "vue",
      code: `// main.ts
import "@zoblocks/loaders/pulse";

// vite.config.ts — tell Vue these tags are web components
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("zb-") } } })

<!-- any .vue template -->
<zb-pulse-loader label="Loading your records"></zb-pulse-loader>`,
    },
    angular: {
      file: "main.ts and the component that uses it",
      language: "ts",
      code: `// main.ts
import "@zoblocks/loaders/pulse";

// the component that uses it
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<zb-pulse-loader label="Loading your records"></zb-pulse-loader>\`,
})`,
    },
    svelte: {
      file: "any .svelte component",
      language: "svelte",
      code: `<script>
  import "@zoblocks/loaders/pulse";
</script>

<zb-pulse-loader label="Loading your records"></zb-pulse-loader>`,
    },
    html: {
      file: "index.html",
      language: "html",
      code: `<!-- index.html, served by Vite or any bundler -->
<script type="module">
  import "@zoblocks/loaders/pulse";
  import "@zoblocks/elements/switch";
</script>

<zb-pulse-loader label="Loading your records"></zb-pulse-loader>
<zb-switch label="Contact precautions" value="unknown"></zb-switch>`,
    },
  },
};
