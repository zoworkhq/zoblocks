<!--
  GENERATED FILE — DO NOT EDIT.
  Produced by `pnpm gen` from the component catalog and
  packages/component-meta/src/integration.ts. CI fails if it is stale.
-->

# Setting up ZoBlocks, per framework

React (Next.js App Router, Next.js Pages Router, Vite) gets every component, installed by the CLI. Vue, Angular, Svelte and plain HTML get only the loaders and the switch, as web components.

## Next.js App Router

### The @ alias

`tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Global stylesheet

One `@import` per `zoblocks-*.css` that `add` writes — tokens first. This one is for the Pulse Loader.

`src/app/globals.css`

```css
@import "tailwindcss";

/* ZoBlocks */
@import "../styles/zoblocks-tokens.css";
@import "../styles/zoblocks-loader.css";
@source "../components/zoblocks";
```

### Styles

- **ZoBlocks:** The default look, with nothing to install or wrap. The `zoblocks-tokens.css` import from step 4 is all it needs, and it works the same in Next.js and Vite. Use this when your app has no other component library, or when you want ZoBlocks’s own design.

#### Ant Design (guide: https://ant.design/docs/react/use-with-next)

Install: `antd @ant-design/nextjs-registry @zoblocks/bridge-antd`

`src/app/providers.tsx`

```tsx
"use client";

import { ConfigProvider } from "antd";
import { AntdBridge } from "@zoblocks/bridge-antd";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#7c3aed", borderRadius: 10 } }}>
      <AntdBridge>{children}</AntdBridge>
    </ConfigProvider>
  );
}
```

`src/app/layout.tsx`

```tsx
import { AntdRegistry } from "@ant-design/nextjs-registry";
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
}
```

`AntdRegistry` puts antd’s styles into the server-rendered page, so it does not flash unstyled. Keep your existing fonts and metadata in the layout.

#### Material UI (guide: https://mui.com/material-ui/integrations/nextjs/)

Install: `@mui/material @emotion/react @emotion/styled @zoblocks/bridge-mui @mui/material-nextjs @emotion/cache`

`src/theme.ts`

```ts
"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: { primary: { main: "#7c3aed" } },
  shape: { borderRadius: 10 },
});

export default theme;
```

`src/app/layout.tsx`

```tsx
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
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
}
```

`AppRouterCacheProvider` puts MUI’s styles into the server-rendered page. `enableCssLayer` lets your Tailwind classes override MUI’s. On Next.js 15, import from `v15-appRouter`.

Clinical status colours — critical, high, low — always stay ZoBlocks’s, whatever your theme says, because they are tested for contrast and colour blindness.

## Next.js Pages Router

### The @ alias

`tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Global stylesheet

One `@import` per `zoblocks-*.css` that `add` writes — tokens first. This one is for the Pulse Loader.

`src/styles/globals.css`

```css
@import "tailwindcss";

/* ZoBlocks */
@import "./zoblocks-tokens.css";
@import "./zoblocks-loader.css";
@source "../components/zoblocks";
```

### Styles

- **ZoBlocks:** The default look, with nothing to install or wrap. The `zoblocks-tokens.css` import from step 4 is all it needs, and it works the same in Next.js and Vite. Use this when your app has no other component library, or when you want ZoBlocks’s own design.

#### Ant Design (guide: https://ant.design/docs/react/use-with-next)

Install: `antd @ant-design/cssinjs @zoblocks/bridge-antd`

`next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["antd", "@ant-design/cssinjs", "@zoblocks/bridge-antd"],
};

export default nextConfig;
```

`src/pages/_document.tsx`

```tsx
import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
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

export default MyDocument;
```

`src/pages/_app.tsx`

```tsx
import type { AppProps } from "next/app";
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
}
```

`transpilePackages` is required on the Pages Router. Without it the server renders antd unstyled and ZoBlocks with antd’s default theme instead of yours.

#### Material UI (guide: https://mui.com/material-ui/integrations/nextjs/)

Install: `@mui/material @emotion/react @emotion/styled @zoblocks/bridge-mui @mui/material-nextjs @emotion/cache @emotion/server`

`next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zoblocks/bridge-mui"],
};

export default nextConfig;
```

`src/pages/_document.tsx`

```tsx
import { Html, Head, Main, NextScript } from "next/document";
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
};
```

`src/pages/_app.tsx`

```tsx
import type { AppProps } from "next/app";
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
}
```

`transpilePackages` is required on the Pages Router, or the server renders ZoBlocks with MUI’s default theme instead of yours. On Next.js 15, import from `v15-pagesRouter`.

Clinical status colours — critical, high, low — always stay ZoBlocks’s, whatever your theme says, because they are tested for contrast and colour blindness.

## Vite

### The @ alias

`vite.config.ts`

```ts
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

`tsconfig.app.json and tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
    // …keep the options already here
  }
}
```

### Global stylesheet

One `@import` per `zoblocks-*.css` that `add` writes — tokens first. This one is for the Pulse Loader.

`src/index.css`

```css
@import "tailwindcss";

/* ZoBlocks */
@import "./styles/zoblocks-tokens.css";
@import "./styles/zoblocks-loader.css";
@source "./components/zoblocks";
```

### Styles

- **ZoBlocks:** The default look, with nothing to install or wrap. The `zoblocks-tokens.css` import from step 4 is all it needs, and it works the same in Next.js and Vite. Use this when your app has no other component library, or when you want ZoBlocks’s own design.

#### Ant Design (guide: https://ant.design/docs/react/use-with-next)

Install: `antd @zoblocks/bridge-antd`

`src/main.tsx`

```tsx
import { StrictMode } from "react";
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
);
```

#### Material UI (guide: https://mui.com/material-ui/integrations/nextjs/)

Install: `@mui/material @emotion/react @emotion/styled @zoblocks/bridge-mui`

`src/main.tsx`

```tsx
import { StrictMode } from "react";
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
);
```

Clinical status colours — critical, high, low — always stay ZoBlocks’s, whatever your theme says, because they are tested for contrast and colour blindness.

## Server Components (Next.js App Router only)

Components that need the browser declare their own `"use client"`; the rest render on the server. A page does not need `"use client"` to use them — but passing a function (`onOpenReport`, any `on…` prop) needs a Client Component.

`src/app/page.tsx — a Server Component`

```tsx
import { ResultValue, fromObservation } from "@/components/zoblocks/result-value";

export default async function Page() {
  const observation = await getObservation(); // your FHIR Observation

  // Works. No "use client" needed on the page.
  return <ResultValue value={fromObservation(observation)} now={new Date().toISOString()} />;
}
```

`src/app/result-row.tsx`

```tsx
"use client";

import { ResultValue, type ResultValueData } from "@/components/zoblocks/result-value";

export function ResultRow({ value, now }: { value: ResultValueData; now: string }) {
  return <ResultValue value={value} now={now} onOpenReport={(v) => openReport(v.id)} />;
}
```

## Vue, Angular, Svelte and HTML

Install: `@zoblocks/loaders @zoblocks/elements`. Elements: `<zb-pulse-loader>`, `<zb-rhythm-loader>`, `<zb-breath-loader>`, `<zb-helix-loader>`, `<zb-infusion-loader>`, `<zb-switch>`.

### Vue

`main.ts, vite.config.ts and a .vue template`

```vue
// main.ts
import "@zoblocks/loaders/pulse";

// vite.config.ts — tell Vue these tags are web components
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("zb-") } } })

<!-- any .vue template -->
<zb-pulse-loader label="Loading your records"></zb-pulse-loader>
```

### Angular

`main.ts and the component that uses it`

```ts
// main.ts
import "@zoblocks/loaders/pulse";

// the component that uses it
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<zb-pulse-loader label="Loading your records"></zb-pulse-loader>`,
})
```

### Svelte

`any .svelte component`

```svelte
<script>
  import "@zoblocks/loaders/pulse";
</script>

<zb-pulse-loader label="Loading your records"></zb-pulse-loader>
```

### HTML

`index.html`

```html
<!-- index.html, served by Vite or any bundler -->
<script type="module">
  import "@zoblocks/loaders/pulse";
  import "@zoblocks/elements/switch";
</script>

<zb-pulse-loader label="Loading your records"></zb-pulse-loader>
<zb-switch label="Contact precautions" value="unknown"></zb-switch>
```
