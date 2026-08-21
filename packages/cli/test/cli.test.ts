/**
 * The CLI's tests run the real commands against a temporary directory and a
 * stub registry. Nothing here spawns a process or touches the network, which
 * is what makes it reasonable to assert on the files that land on disk.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { run } from "../src/cli.js";
import {
  expandHeaders,
  readConfig,
  resolveTarget,
  ConfigError,
  DEFAULT_ROOT,
} from "../src/config.js";
import { collectItems, resolveSpecifier, RegistryError } from "../src/registry.js";
import {
  parseRegistryIndex,
  parseRegistryItem,
  RegistryFormatError,
  assertSafeTarget,
  type RegistryItem,
} from "../src/schema.js";
import { bareName, missingDependencies, detectPackageManager, installCommand } from "../src/pm.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "oxygen-cli-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

/** A registry item, with only the fields a test cares about spelled out. */
function item(overrides: Record<string, unknown> = {}) {
  return {
    $schema: "https://oxygenui.design/schema/registry-item.json",
    name: "vitals-panel",
    type: "oxygen:component",
    title: "Vitals panel",
    description: "A panel.",
    files: [
      {
        path: "registry/oxygen/vitals-panel/vitals-panel.tsx",
        type: "oxygen:component",
        target: "components/oxygen/vitals-panel.tsx",
        content: "export const VitalsPanel = () => null;\n",
      },
    ],
    ...overrides,
  };
}

/** A fetch that serves a fixed map of url → body, and 404s everything else. */
function stubFetch(
  routes: Record<string, unknown>,
  seen?: Array<{ url: string; headers: Headers }>,
) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    seen?.push({ url, headers: new Headers(init?.headers) });
    if (!(url in routes)) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify(routes[url]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

function capture() {
  const lines: string[] = [];
  return { lines, write: (line: string) => lines.push(line), text: () => lines.join("\n") };
}

describe("oxygen init", () => {
  it("writes a config and picks src/ when the project has one", async () => {
    await mkdir(path.join(dir, "src"));
    const out = capture();

    const code = await run({
      argv: ["init"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });

    expect(code).toBe(0);
    const config = JSON.parse(await readFile(path.join(dir, "oxygen.json"), "utf8"));
    expect(config.root).toBe("src");
  });

  it("omits the src prefix when there is no src directory", async () => {
    const out = capture();
    await run({
      argv: ["init"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });
    const config = JSON.parse(await readFile(path.join(dir, "oxygen.json"), "utf8"));
    expect(config.root).toBe(".");
  });

  it("refuses to clobber an existing config without --force", async () => {
    await writeFile(path.join(dir, "oxygen.json"), '{"marker":true}');
    const out = capture();

    const code = await run({
      argv: ["init"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });

    expect(code).toBe(1);
    expect(await readFile(path.join(dir, "oxygen.json"), "utf8")).toContain("marker");
  });
});

describe("oxygen add", () => {
  async function project() {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ root: ".", registries: {} }));
  }

  it("writes a component beneath the configured root", async () => {
    await project();
    const out = capture();

    const code = await run({
      argv: ["add", "vitals-panel", "--no-deps"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: stubFetch({ "https://oxygenui.design/r/vitals-panel.json": item() }),
    });

    expect(code).toBe(0);
    const written = await readFile(path.join(dir, "components/oxygen/vitals-panel.tsx"), "utf8");
    expect(written).toContain("VitalsPanel");
  });

  it("follows registryDependencies and writes each to the path its source imports it by", async () => {
    await project();
    const out = capture();

    const code = await run({
      argv: ["add", "vitals-panel", "--no-deps"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: stubFetch({
        "https://oxygenui.design/r/vitals-panel.json": item({
          registryDependencies: ["https://oxygenui.design/r/utils.json"],
        }),
        "https://oxygenui.design/r/utils.json": {
          name: "utils",
          type: "oxygen:lib",
          title: "Utils",
          description: "",
          files: [
            {
              path: "registry/oxygen/lib/utils.ts",
              type: "oxygen:lib",
              target: "lib/utils.ts",
              content: "export const cn = () => {};\n",
            },
          ],
        },
      }),
    });

    expect(code).toBe(0);
    expect(existsSync(path.join(dir, "lib/utils.ts"))).toBe(true);
    expect(existsSync(path.join(dir, "components/oxygen/vitals-panel.tsx"))).toBe(true);
    expect(out.text()).toContain("pulled in as dependencies");
  });

  it("leaves an existing file alone, and replaces it with --overwrite", async () => {
    await project();
    await mkdir(path.join(dir, "components/oxygen"), { recursive: true });
    const target = path.join(dir, "components/oxygen/vitals-panel.tsx");
    await writeFile(target, "// mine\n");

    const registry = stubFetch({ "https://oxygenui.design/r/vitals-panel.json": item() });
    const first = capture();

    await run({
      argv: ["add", "vitals-panel", "--no-deps"],
      cwd: dir,
      env: {},
      out: first.write,
      err: first.write,
      version: "0.0.0",
      fetchImpl: registry,
    });

    expect(await readFile(target, "utf8")).toBe("// mine\n");
    expect(first.text()).toContain("already exists");

    const second = capture();
    await run({
      argv: ["add", "vitals-panel", "--overwrite", "--no-deps"],
      cwd: dir,
      env: {},
      out: second.write,
      err: second.write,
      version: "0.0.0",
      fetchImpl: registry,
    });

    expect(await readFile(target, "utf8")).toContain("VitalsPanel");
  });

  it("writes nothing on --dry-run", async () => {
    await project();
    const out = capture();

    const code = await run({
      argv: ["add", "vitals-panel", "--dry-run"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: stubFetch({ "https://oxygenui.design/r/vitals-panel.json": item() }),
    });

    expect(code).toBe(0);
    expect(existsSync(path.join(dir, "components/oxygen/vitals-panel.tsx"))).toBe(false);
    expect(out.text()).toContain("Dry run");
  });

  it("sends the expanded bearer token to a namespaced registry", async () => {
    await writeFile(
      path.join(dir, "oxygen.json"),
      JSON.stringify({
        root: ".",
        registries: {
          "@oxygen-pro": {
            url: "https://app.oxygenui.design/r/pro/{name}.json",
            headers: { Authorization: "Bearer ${OXYGEN_TOKEN}" },
          },
        },
      }),
    );

    const seen: Array<{ url: string; headers: Headers }> = [];
    const out = capture();

    const code = await run({
      argv: ["add", "@oxygen-pro/vitals-flowsheet", "--no-deps"],
      cwd: dir,
      env: { OXYGEN_TOKEN: "oxy_live_secret" },
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: stubFetch(
        {
          "https://app.oxygenui.design/r/pro/vitals-flowsheet.json": item({
            name: "vitals-flowsheet",
            files: [
              {
                path: "vitals-flowsheet.tsx",
                type: "oxygen:component",
                target: "vitals-flowsheet.tsx",
                content: "export const VitalsFlowsheet = () => null;\n",
              },
            ],
          }),
        },
        seen,
      ),
    });

    expect(code).toBe(0);
    expect(seen[0]?.headers.get("authorization")).toBe("Bearer oxy_live_secret");
  });

  it("explains a missing config instead of failing obscurely", async () => {
    const out = capture();
    const code = await run({
      argv: ["add", "vitals-panel"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });

    expect(code).toBe(1);
    expect(out.text()).toContain("oxygen init");
  });

  it("names the unconfigured registry rather than 404ing", async () => {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ root: ".", registries: {} }));
    const out = capture();

    const code = await run({
      argv: ["add", "@oxygen-pro/x"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: stubFetch({}),
    });

    expect(code).toBe(1);
    expect(out.text()).toContain('Registry "@oxygen-pro" is not configured');
  });
});

describe("config", () => {
  it("refuses a literal token so it cannot be committed", () => {
    expect(() =>
      expandHeaders({ Authorization: "Bearer oxy_live_abc123" }, {}, "@oxygen-pro"),
    ).toThrowError(ConfigError);
  });

  it("names the missing environment variable", () => {
    expect(() =>
      expandHeaders({ Authorization: "Bearer ${NOPE}" }, {}, "@oxygen-pro"),
    ).toThrowError(/NOPE/);
  });

  it("expands from the environment", () => {
    expect(expandHeaders({ Authorization: "Bearer ${T}" }, { T: "v" }, "@x")).toEqual({
      Authorization: "Bearer v",
    });
  });

  it("writes each target verbatim beneath the configured root", () => {
    const config = { root: "src", registries: {} };
    expect(
      resolveTarget(config, { path: "r/o/timeline.tsx", target: "components/oxygen/timeline.tsx" }),
    ).toBe("src/components/oxygen/timeline.tsx");
    expect(resolveTarget(config, { path: "r/o/lib/utils.ts", target: "lib/utils.ts" })).toBe(
      "src/lib/utils.ts",
    );
    /*
     * The kind does not route. accordion-core is declared a hook and still
     * belongs in lib/, because `@/lib/oxygen-accordion` is what the copied
     * source imports it by.
     */
    expect(
      resolveTarget(config, {
        path: "r/o/lib/accordion-core.tsx",
        target: "lib/oxygen-accordion.tsx",
      }),
    ).toBe("src/lib/oxygen-accordion.tsx");
  });

  it("falls back to the basename for an item that states no target", () => {
    expect(resolveTarget({ root: ".", registries: {} }, { path: "a/b/c.tsx" })).toBe("c.tsx");
  });

  it("defaults the root when the file omits it", async () => {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ registries: {} }));
    expect((await readConfig(dir)).root).toBe(DEFAULT_ROOT);
  });

  it("rejects a registry url with no {name} placeholder", async () => {
    await writeFile(
      path.join(dir, "oxygen.json"),
      JSON.stringify({ registries: { "@x": { url: "https://example.com/fixed.json" } } }),
    );
    await expect(readConfig(dir)).rejects.toThrowError(/\{name\}/);
  });
});

describe("schema", () => {
  it("refuses a target that escapes the project", () => {
    expect(() => assertSafeTarget("../../etc/passwd", "x")).toThrowError(RegistryFormatError);
    expect(() => assertSafeTarget("/etc/passwd", "x")).toThrowError(RegistryFormatError);
  });

  it("refuses an item whose file arrived empty", () => {
    expect(() =>
      parseRegistryItem(
        item({ files: [{ path: "a.tsx", type: "oxygen:component", content: "  " }] }),
        "x",
      ),
    ).toThrowError(/empty file/);
  });

  it("refuses a file kind it does not understand", () => {
    expect(() =>
      parseRegistryItem(
        item({ files: [{ path: "a", type: "registry:component", content: "x" }] }),
        "x",
      ),
    ).toThrowError(/does not understand/);
  });

  it("keeps unknown top-level fields from being fatal", () => {
    const parsed = parseRegistryItem(item({ somethingNew: 42 }), "x");
    expect(parsed.name).toBe("vitals-panel");
  });
});

describe("registry resolution", () => {
  const config = { root: ".", registries: {} };

  it("treats a bare name as the public catalog", () => {
    expect(resolveSpecifier("vitals-panel", config, {}).url).toBe(
      "https://oxygenui.design/r/vitals-panel.json",
    );
  });

  it("takes an absolute url literally", () => {
    const resolved = resolveSpecifier("https://example.com/x.json", config, {});
    expect(resolved.url).toBe("https://example.com/x.json");
    expect(resolved.name).toBe("x");
  });

  it("rejects a namespace with no component", () => {
    expect(() => resolveSpecifier("@oxygen-pro", config, {})).toThrowError(RegistryError);
  });

  it("orders a shared dependency before both of its dependents", async () => {
    const shared = {
      name: "core",
      type: "oxygen:lib",
      title: "Core",
      description: "",
      files: [{ path: "core.ts", type: "oxygen:lib", target: "core.ts", content: "x\n" }],
    };
    const dependent = (name: string) => ({
      name,
      type: "oxygen:component",
      title: name,
      description: "",
      registryDependencies: ["https://oxygenui.design/r/core.json"],
      files: [
        { path: `${name}.tsx`, type: "oxygen:component", target: `${name}.tsx`, content: "x\n" },
      ],
    });

    const items = await collectItems(["timeline", "care-timeline"], config, {
      env: {},
      fetchImpl: stubFetch({
        "https://oxygenui.design/r/timeline.json": dependent("timeline"),
        "https://oxygenui.design/r/care-timeline.json": dependent("care-timeline"),
        "https://oxygenui.design/r/core.json": shared,
      }),
    });

    const order = items.map((i) => i.name);
    expect(order.indexOf("core")).toBeLessThan(order.indexOf("timeline"));
    expect(order.indexOf("core")).toBeLessThan(order.indexOf("care-timeline"));
  });
});

describe("package manager", () => {
  it("strips a version range from a specifier", () => {
    expect(bareName("@oxygenui-design/fhir@^1.2.3")).toBe("@oxygenui-design/fhir");
    expect(bareName("clsx")).toBe("clsx");
    expect(bareName("@scope/pkg")).toBe("@scope/pkg");
  });

  it("skips dependencies the project already has, in any section", () => {
    const missing = missingDependencies(["clsx", "react", "tailwind-merge"], {
      dependencies: { clsx: "^2" },
      peerDependencies: { react: "^18" },
    });
    expect(missing).toEqual(["tailwind-merge"]);
  });

  it("finds the lockfile above the target directory", async () => {
    await writeFile(path.join(dir, "pnpm-lock.yaml"), "");
    await mkdir(path.join(dir, "apps/web"), { recursive: true });
    expect(detectPackageManager(path.join(dir, "apps/web"))).toBe("pnpm");
  });

  it("maps each manager to its add command", () => {
    expect(installCommand("npm", ["clsx"])).toEqual({ command: "npm", args: ["install", "clsx"] });
    expect(installCommand("pnpm", ["clsx"])).toEqual({ command: "pnpm", args: ["add", "clsx"] });
  });
});

describe("oxygen list", () => {
  const index = {
    $schema: "https://oxygenui.design/schema/registry.json",
    name: "oxygenui",
    homepage: "https://oxygenui.design",
    items: [
      {
        name: "vitals-panel",
        type: "oxygen:component",
        title: "Vitals panel",
        description: "A panel.",
        categories: ["clinical"],
        url: "https://oxygenui.design/r/vitals-panel.json",
      },
    ],
  };

  it("prints the catalog", async () => {
    const out = capture();
    const code = await run({
      argv: ["list"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: stubFetch({ "https://oxygenui.design/r/index.json": index }),
    });

    expect(code).toBe(0);
    expect(out.text()).toContain("vitals-panel");
    expect(out.text()).toContain("A panel.");
  });

  it("reports a catalog it cannot read", async () => {
    const out = capture();
    const code = await run({
      argv: ["list"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: stubFetch({}),
    });

    expect(code).toBe(1);
    expect(out.text()).toContain("Could not read the catalog");
  });

  it("rejects an index whose entry has no url", () => {
    expect(() =>
      parseRegistryIndex(
        { name: "x", items: [{ name: "a", type: "oxygen:lib", title: "A" }] },
        "x",
      ),
    ).toThrowError(RegistryFormatError);
  });
});

describe("registry errors are translated for the reader", () => {
  const config = { root: ".", registries: {} };

  function failing(status: number, body = "nope") {
    return (async () => new Response(body, { status })) as unknown as typeof fetch;
  }

  it("explains a 401 as a credential problem, naming the scope", async () => {
    await expect(
      collectItems(["x"], config, { env: {}, fetchImpl: failing(401) }),
    ).rejects.toThrowError(/registry" scope/);
  });

  it("tells a public 404 apart from an entitlement 404", async () => {
    await expect(
      collectItems(["x"], config, { env: {}, fetchImpl: failing(404) }),
    ).rejects.toThrowError(/not in the Oxygen catalog/);

    const withRegistry = {
      root: ".",
      registries: { "@oxygen-pro": { url: "https://app.oxygenui.design/r/pro/{name}.json" } },
    };
    await expect(
      collectItems(["@oxygen-pro/x"], withRegistry, { env: {}, fetchImpl: failing(404) }),
    ).rejects.toThrowError(/nobody has purchased it yet/);
  });

  it("reports an unexpected status with the url", async () => {
    await expect(
      collectItems(["x"], config, { env: {}, fetchImpl: failing(500) }),
    ).rejects.toThrowError(/returned 500/);
  });

  it("reports a body that is not JSON", async () => {
    const notJson = (async () =>
      new Response("<html>", { status: 200 })) as unknown as typeof fetch;
    await expect(collectItems(["x"], config, { env: {}, fetchImpl: notJson })).rejects.toThrowError(
      /not JSON/,
    );
  });

  it("reports a network failure with the url and the cause", async () => {
    const boom = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    await expect(collectItems(["x"], config, { env: {}, fetchImpl: boom })).rejects.toThrowError(
      /Could not reach the registry.*ECONNREFUSED/s,
    );
  });
});

describe("argument handling", () => {
  it("exits 1 with help when given no command", async () => {
    const out = capture();
    const code = await run({
      argv: [],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });
    expect(code).toBe(1);
    expect(out.text()).toContain("Usage");
  });

  it("exits 0 with help on --help", async () => {
    const out = capture();
    const code = await run({
      argv: ["add", "--help"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });
    expect(code).toBe(0);
  });

  it("names an unknown command", async () => {
    const out = capture();
    const code = await run({
      argv: ["frobnicate"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });
    expect(code).toBe(1);
    expect(out.text()).toContain('Unknown command "frobnicate"');
  });

  it("rejects an unknown flag rather than ignoring it", async () => {
    const out = capture();
    const code = await run({
      argv: ["add", "x", "--wat"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });
    expect(code).toBe(1);
  });

  it("prints the version", async () => {
    const out = capture();
    const code = await run({
      argv: ["--version"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "9.9.9",
    });
    expect(code).toBe(0);
    expect(out.text()).toBe("9.9.9");
  });

  it("refuses to add nothing", async () => {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ registries: {} }));
    const out = capture();
    const code = await run({
      argv: ["add"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });
    expect(code).toBe(1);
    expect(out.text()).toContain("Nothing to add");
  });

  it("honours --cwd", async () => {
    const nested = path.join(dir, "nested");
    await mkdir(nested);
    const out = capture();
    await run({
      argv: ["init", "--cwd", nested],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
    });
    expect(existsSync(path.join(nested, "oxygen.json"))).toBe(true);
    expect(existsSync(path.join(dir, "oxygen.json"))).toBe(false);
  });
});

describe("npm dependencies", () => {
  async function projectWith(packageJson: unknown) {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ registries: {} }));
    await writeFile(path.join(dir, "package.json"), JSON.stringify(packageJson));
  }

  const withDeps = stubFetch({
    "https://oxygenui.design/r/vitals-panel.json": item({
      dependencies: ["clsx", "tailwind-merge"],
    }),
  });

  it("prints the install command instead of running it without --yes", async () => {
    await projectWith({ name: "app", dependencies: {} });
    await writeFile(path.join(dir, "package-lock.json"), "{}");
    const out = capture();

    const code = await run({
      argv: ["add", "vitals-panel"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: withDeps,
    });

    expect(code).toBe(0);
    expect(out.text()).toContain("npm install clsx tailwind-merge");
    expect(out.text()).toContain("--yes");
  });

  it("says nothing when the project already has every dependency", async () => {
    await projectWith({ name: "app", dependencies: { clsx: "^2", "tailwind-merge": "^2" } });
    const out = capture();

    await run({
      argv: ["add", "vitals-panel"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: withDeps,
    });

    expect(out.text()).not.toContain("install");
  });

  it("does not try to install when there is no package.json", async () => {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ registries: {} }));
    const out = capture();

    const code = await run({
      argv: ["add", "vitals-panel"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: withDeps,
    });

    expect(code).toBe(0);
    expect(out.text()).toContain("No package.json here");
  });

  it("lists what it did not install under --no-deps", async () => {
    await projectWith({ name: "app" });
    const out = capture();

    await run({
      argv: ["add", "vitals-panel", "--no-deps"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: withDeps,
    });

    expect(out.text()).toContain("not installed: clsx, tailwind-merge");
  });

  it("survives a package.json that is not valid JSON", async () => {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ registries: {} }));
    await writeFile(path.join(dir, "package.json"), "{ broken");
    const out = capture();

    const code = await run({
      argv: ["add", "vitals-panel"],
      cwd: dir,
      env: {},
      out: out.write,
      err: out.write,
      version: "0.0.0",
      fetchImpl: withDeps,
    });

    expect(code).toBe(0);
    expect(out.text()).toContain("not valid JSON");
  });
});

describe("writing", () => {
  it("reports a file that is already byte-identical rather than rewriting it", async () => {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ registries: {} }));
    const registry = stubFetch({ "https://oxygenui.design/r/vitals-panel.json": item() });

    const first = capture();
    await run({
      argv: ["add", "vitals-panel", "--no-deps"],
      cwd: dir,
      env: {},
      out: first.write,
      err: first.write,
      version: "0.0.0",
      fetchImpl: registry,
    });

    const second = capture();
    await run({
      argv: ["add", "vitals-panel", "--no-deps"],
      cwd: dir,
      env: {},
      out: second.write,
      err: second.write,
      version: "0.0.0",
      fetchImpl: registry,
    });

    expect(second.text()).toContain("already up to date");
  });

  it("refuses two items that claim the same path", async () => {
    await writeFile(path.join(dir, "oxygen.json"), JSON.stringify({ registries: {} }));
    const out = capture();

    const collide = (name: string) => ({
      name,
      type: "oxygen:component",
      title: name,
      description: "",
      files: [
        { path: `${name}.tsx`, type: "oxygen:component", target: "same.tsx", content: "x\n" },
      ],
    });

    await expect(
      run({
        argv: ["add", "a", "b", "--no-deps"],
        cwd: dir,
        env: {},
        out: out.write,
        err: out.write,
        version: "0.0.0",
        fetchImpl: stubFetch({
          "https://oxygenui.design/r/a.json": collide("a"),
          "https://oxygenui.design/r/b.json": collide("b"),
        }),
      }),
    ).rejects.toThrowError(/want to write .*same\.tsx/);
  });
});

describe("forward compatibility", () => {
  /*
   * The asymmetry is deliberate: an item document becomes files in someone's
   * repository, a listing does not. See parseRegistryIndex.
   */
  it("lists a catalog containing kinds this version has not heard of", () => {
    const index = parseRegistryIndex(
      {
        name: "oxygenui",
        homepage: "https://oxygenui.design",
        items: [
          { name: "a", type: "oxygen:lib", title: "A", url: "https://x/a.json" },
          { name: "b", type: "oxygen:something-new", title: "B", url: "https://x/b.json" },
        ],
      },
      "x",
    );
    expect(index.items.map((i) => i.name)).toEqual(["a", "b"]);
  });

  it("still refuses to install an item whose file kind it does not understand", () => {
    expect(() =>
      parseRegistryItem(
        item({ files: [{ path: "a", type: "oxygen:something-new", content: "x" }] }),
        "x",
      ),
    ).toThrowError(/does not understand/);
  });

  it("reports what was pulled in from the roots, not by matching names", async () => {
    /*
     * A registry serving an item under a slug that differs from its `name`.
     * Guessing from the specifier reported the requested item as a dependency
     * of itself.
     */
    const config = { root: ".", registries: {} };
    const roots = new Set<RegistryItem>();
    const items = await collectItems(["thing"], config, {
      env: {},
      roots,
      fetchImpl: stubFetch({
        "https://oxygenui.design/r/thing.json": {
          name: "actually-called-something-else",
          type: "oxygen:component",
          title: "Thing",
          description: "",
          registryDependencies: ["https://oxygenui.design/r/dep.json"],
          files: [{ path: "t.tsx", type: "oxygen:component", target: "t.tsx", content: "x\n" }],
        },
        "https://oxygenui.design/r/dep.json": {
          name: "dep",
          type: "oxygen:lib",
          title: "Dep",
          description: "",
          files: [{ path: "d.ts", type: "oxygen:lib", target: "d.ts", content: "x\n" }],
        },
      }),
    });

    expect(roots.size).toBe(1);
    expect([...roots][0]?.name).toBe("actually-called-something-else");
    expect(items.filter((i) => !roots.has(i)).map((i) => i.name)).toEqual(["dep"]);
  });
});
