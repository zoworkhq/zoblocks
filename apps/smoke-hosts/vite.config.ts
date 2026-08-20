/**
 * Three hosts, one application.
 *
 * Each page mounts the *same* `<Application />` — literally the same module,
 * not a copy — inside a different framework provider. That is the whole point:
 * if the pages had their own copies of the component tree, they could drift
 * into agreeing, and the test would prove nothing.
 */

import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

const page = (name: string) => fileURLToPath(new URL(`./${name}/index.html`, import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    rollupOptions: { input: { antd: page("antd"), mui: page("mui"), none: page("none") } },
  },
  server: { port: 6012, strictPort: true },
  preview: { port: 6012, strictPort: true },
});
