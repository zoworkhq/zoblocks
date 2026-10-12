/**
 * One command, written four ways.
 *
 * The docs describe a command once — "run the CLI's `add`", "install these
 * packages", "create a Vite app" — and this turns it into the line a reader
 * types for their own package manager. Writing each line out four times by
 * hand is how two of the four drift: a flag added to the npm line and not to
 * the bun one.
 *
 * Every form below was run against a fresh project on 28 Sep 2026 — Vite and
 * Next.js, each created, `init`, `add --yes`, built — with npm 11, pnpm 9,
 * Yarn 1.22 and Bun 1.3. Two choices came out of that run:
 *
 *   - **Yarn runs the CLI with `npx`.** `yarn dlx` exists only in Yarn 2+, and
 *     Yarn 1 is still the most installed Yarn. `npx` works beside either, and
 *     the CLI still installs dependencies with Yarn because it reads the
 *     lockfile, not the runner.
 *   - **Bun runs scripts with `bun run`.** A bare `bun dev` works too, but
 *     `bun <name>` also executes files, and `bun run` is never ambiguous.
 */

export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/** The flags every Next.js path in the docs creates its app with. */
const NEXT_FLAGS = '--ts --tailwind --eslint --app --src-dir --import-alias "@/*" --yes';

export type Command =
  /** Run a package without installing it: `npx @zoblocks/cli init`. */
  | { dlx: string }
  /** Add dependencies: `npm install antd`. */
  | { add: string }
  /** Install what package.json already lists. */
  | { install: true }
  /** Run a package.json script: `npm run dev`. */
  | { run: string }
  /** A new Vite + React + TypeScript app in a folder of this name. */
  | { createVite: string }
  /** A new Next.js app, with TypeScript, Tailwind and `src/`. */
  | { createNext: string }
  /** The same for every package manager: `cd my-app`. */
  | { raw: string };

export function toCommand(pm: PackageManager, command: Command): string {
  if ("raw" in command) return command.raw;

  if ("dlx" in command) {
    const runner = { npm: "npx", pnpm: "pnpm dlx", yarn: "npx", bun: "bunx" }[pm];
    return `${runner} ${command.dlx}`;
  }

  if ("add" in command) {
    const verb = { npm: "npm install", pnpm: "pnpm add", yarn: "yarn add", bun: "bun add" }[pm];
    return `${verb} ${command.add}`;
  }

  if ("install" in command) {
    return { npm: "npm install", pnpm: "pnpm install", yarn: "yarn", bun: "bun install" }[pm];
  }

  if ("run" in command) {
    const verb = { npm: "npm run", pnpm: "pnpm", yarn: "yarn", bun: "bun run" }[pm];
    return `${verb} ${command.run}`;
  }

  if ("createVite" in command) {
    const name = command.createVite;
    return pm === "npm"
      ? `npm create vite@latest ${name} -- --template react-ts`
      : `${pm} create vite ${name} --template react-ts`;
  }

  const name = command.createNext;
  const create = {
    npm: "npx create-next-app@latest",
    pnpm: "pnpm create next-app@latest",
    yarn: "yarn create next-app",
    bun: "bun create next-app@latest",
  }[pm];
  return `${create} ${name} ${NEXT_FLAGS} --use-${pm}`;
}
