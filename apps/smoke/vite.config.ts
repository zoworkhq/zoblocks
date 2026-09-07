/**
 * One Vite build, five framework compilers.
 *
 * Separate scaffolds per framework would be more conventional and would rot
 * five times as fast. What matters is that each page passes through the real
 * compiler for its framework — `@vitejs/plugin-vue` runs Vue's SFC compiler,
 * `@angular/compiler` runs Angular's template compiler at runtime, and so on.
 * A page that only *looks* like Vue proves nothing.
 */

import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const page = (name: string) => fileURLToPath(new URL(`./${name}/index.html`, import.meta.url));

export default defineConfig({
  // Built output is served from a static file server in CI, and the pages link
  // to each other by relative path, so absolute asset URLs would break.
  base: "./",

  plugins: [
    react({ include: /react\/.*\.[jt]sx?$/ }),
    vue({
      template: {
        compilerOptions: {
          // Without this Vue resolves <zb-pulse-loader> as a component, fails,
          // and warns at runtime. This one line is the whole Vue integration
          // story, and the reason the page asserts on console warnings.
          isCustomElement: (tag) => tag.startsWith("zb-"),
        },
      },
    }),
    svelte(),
  ],

  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    // No minification: when a smoke test fails in CI the stack trace should
    // point at something a person can read.
    minify: false,
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        html: page("html"),
        react: page("react"),
        vue: page("vue"),
        svelte: page("svelte"),
        angular: page("angular"),
      },
    },
  },

  server: { port: 6010, strictPort: true },
  preview: { port: 6010, strictPort: true },
});
