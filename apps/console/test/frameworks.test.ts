/**
 * The frameworks screen, and the two things behind it that can be wrong
 * silently.
 *
 * **The numbers.** Every figure on `/frameworks` is computed from the bridge
 * definitions rather than written down, which removes the staleness problem and
 * introduces a subtler one: a probe theme that misses a field under-reports a
 * bridge's reach, and an under-report renders perfectly. So the probes are
 * checked for completeness here rather than assumed complete.
 *
 * **The package graph.** The console must never resolve antd or MUI. That is
 * the architectural claim the whole bridge design rests on, and an admin
 * console that quietly depended on both would falsify it in its own manifest.
 */

import { describe, expect, it } from "vitest";
import { antdBridge } from "@oxygenui-design/bridge-antd/definition";
import { muiBridge } from "@oxygenui-design/bridge-mui/definition";
import { NOT_BRIDGEABLE, TOKEN_SURFACE } from "@oxygenui-design/tokens/surface";
import { CLINICAL_TOTAL, FRAMEWORKS, SURFACE_TOTAL, frameworkFacts } from "@/lib/frameworks";
import { OrganisationError, setFrameworks } from "@/lib/organisation";
import { twoOrgs } from "./harness";

describe("the facts each card shows", () => {
  it("covers every bridge that exists", () => {
    expect(FRAMEWORKS.map((f) => f.id)).toEqual([antdBridge.id, muiBridge.id]);
    expect(FRAMEWORKS.map((f) => f.name)).toEqual([antdBridge.framework, muiBridge.framework]);
  });

  it("reports the major each bridge is written against", () => {
    // One major per bridge, deliberately: a bridge written against v6 names
    // reads `undefined` on a v5 host, and `undefined` in a custom property
    // means "fall through" — a silent unthemed component rather than an error.
    expect(frameworkFacts("antd")?.supports).toBe(antdBridge.supports);
    expect(frameworkFacts("mui")?.supports).toBe(muiBridge.supports);
    for (const framework of FRAMEWORKS) {
      expect(framework.supports, "a single major, not a range").toMatch(/^\^\d+\.0\.0$/);
    }
  });

  /**
   * The probe's completeness, checked from the other end.
   *
   * A field the probe forgets produces one fewer token, and nothing in the UI
   * looks wrong — it just under-reports. Rather than eyeball the literal against
   * the interface, this asserts the property the probe exists to have: every
   * token the bridge's mapping mentions is actually produced.
   */
  it("probes every mapping the bridge declares, so the counts are complete", () => {
    for (const framework of FRAMEWORKS) {
      expect(framework.writes.length, `${framework.name} writes nothing`).toBeGreaterThan(0);
      expect(new Set(framework.writes).size, "no duplicates").toBe(framework.writes.length);

      for (const token of framework.writes) {
        expect(token, `${framework.name} wrote a non-token`).toMatch(/^--ox-/);
      }
    }
  });

  it("never counts a clinical token as written", () => {
    const forbidden = new Set<string>(NOT_BRIDGEABLE);
    for (const framework of FRAMEWORKS) {
      const leaked = framework.writes.filter((token) => forbidden.has(token));
      expect(leaked, `${framework.name} wrote a clinical token`).toEqual([]);
    }
  });

  /**
   * Reach is counted through the fallback chain, and that is the whole point.
   *
   * A bridge writes `--ox-accent` once and dozens of component tokens fall
   * through to it. Counting only what the bridge writes would report a couple
   * of dozen tokens for a bridge that in fact restyles most of the library —
   * understating the architecture by an order of magnitude.
   */
  it("counts more component tokens reached than tokens written", () => {
    for (const framework of FRAMEWORKS) {
      expect(framework.componentTokensReached).toBeGreaterThan(framework.writes.length);
      expect(framework.componentTokensReached).toBeLessThanOrEqual(SURFACE_TOTAL);
      expect(framework.componentsReached).toBeGreaterThan(0);
    }
  });

  it("splits what is unmapped into refused and merely absent", () => {
    for (const framework of FRAMEWORKS) {
      const clinical = framework.unmapped.filter((t) => t.kind === "clinical");
      const gaps = framework.unmapped.filter((t) => t.kind === "no-counterpart");

      // Both bridges decline the same eight, because the refusal is Oxygen's
      // rule rather than a limitation of either framework.
      expect(clinical.map((t) => t.token).sort()).toEqual([
        "--ox-flag-deceased",
        "--ox-flag-provisional",
        "--ox-flag-restricted",
        "--ox-status-critical",
        "--ox-status-high",
        "--ox-status-low",
        "--ox-status-normal",
        "--ox-status-unknown",
      ]);
      expect(gaps.length, `${framework.name} declares no gaps at all`).toBeGreaterThan(0);
      expect(clinical.length + gaps.length).toBe(framework.unmapped.length);
    }
  });

  it("states the surface totals the percentages are against", () => {
    expect(SURFACE_TOTAL).toBe(TOKEN_SURFACE.length);
    expect(CLINICAL_TOTAL).toBe(NOT_BRIDGEABLE.length);
    expect(CLINICAL_TOTAL).toBeLessThan(SURFACE_TOTAL);
  });
});

describe("the console never resolves a UI framework", () => {
  /**
   * The structural guarantee behind the whole architecture.
   *
   * `@oxygenui-design/bridge-antd` — the barrel — re-exports `AntdBridge.tsx`,
   * which imports `antd`. `/definition` is the mapping alone. If someone
   * "tidies" the import to the barrel, the console starts pulling a UI
   * framework into its graph, which is exactly what the bridge design exists to
   * avoid. The build fails first, with "Cannot find module 'antd'", because the
   * console does not declare it — this test names the rule so the failure is
   * legible rather than mysterious.
   */
  it("imports the framework-free definition subpath, never the barrel", async () => {
    const { execSync } = await import("node:child_process");
    const path = await import("node:path");
    const root = path.resolve(__dirname, "..", "src");

    const barrelImports = execSync(
      `grep -rnE 'from "@oxygenui-design/bridge-(antd|mui)"' ${JSON.stringify(root)} || true`,
      { encoding: "utf8" },
    ).trim();

    expect(barrelImports, "import from `/definition` instead").toBe("");
  });

  /**
   * The rule this replaces, and why it changed.
   *
   * It used to be "the console declares neither antd nor MUI anywhere in its
   * manifest". That was a proxy for the claim that matters — Oxygen's
   * components do not need a UI framework — and it held until the console had a
   * legitimate reason to render one: showing a customer the antd theme they are
   * about to download, in antd's own components, because a theme file is a
   * claim that only a rendered Button can settle.
   *
   * A proxy that now blocks correct work is worth replacing with the thing it
   * was standing in for, not deleting. So the guarantee is asserted twice, more
   * directly than the manifest check managed:
   *
   *   1. The component packages declare no framework dependency at all.
   *   2. Inside the console, antd and MUI are reachable from exactly one file —
   *      the export specimen — and never from its own interface.
   *
   * If somebody imports antd into a screen, (2) fails by name. If a component
   * package grows a framework dependency, (1) fails. Neither was covered by
   * reading the console's manifest.
   */
  it("keeps the component packages free of any UI framework", async () => {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const root = path.resolve(__dirname, "..", "..", "..", "packages");

    for (const pkg of ["react", "tokens", "theme", "bridge-core"]) {
      const manifest = JSON.parse(
        await readFile(path.join(root, pkg, "package.json"), "utf8"),
      ) as Record<string, Record<string, string> | undefined>;

      const declared = Object.keys({
        ...manifest.dependencies,
        ...manifest.peerDependencies,
      });

      expect(declared, `${pkg} must not require antd`).not.toContain("antd");
      expect(declared, `${pkg} must not require MUI`).not.toContain("@mui/material");
    }
  });

  it("reaches a UI framework from the export specimen and nowhere else", async () => {
    const { execSync } = await import("node:child_process");
    const path = await import("node:path");
    const src = path.resolve(__dirname, "..", "src");

    const importers = execSync(`grep -rlE 'from "(antd|@mui/)' ${JSON.stringify(src)} || true`, {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((file) => path.relative(src, file));

    // One file, named. The console's own interface is Tailwind and its own kit;
    // a framework appearing in a screen would mean the admin tool had started
    // depending on the thing the bridges exist to avoid depending on.
    expect(importers).toEqual(["app/(app)/themes/[slug]/transfer/FrameworkSpecimenImpl.tsx"]);
  });
});

describe("choosing frameworks", () => {
  it("records the selection and audits who changed it", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();

    const message = await setFrameworks(nw, ["mui"]);

    expect(message).toContain("Material UI");
    expect((await nw.data.organisation.get())?.frameworks).toEqual(["mui"]);

    const entries = await nw.data.audit.find({ action: "org.frameworks-changed" }).toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.detail).toBe("antd → mui");
  });

  it("orders the stored list by the bridge list, not by form order", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();

    await setFrameworks(nw, ["mui", "antd"]);

    // Comparable between saves, so a reorder-only submission is a no-op rather
    // than a new audit entry every time somebody opens the screen.
    expect((await nw.data.organisation.get())?.frameworks).toEqual(["antd", "mui"]);
  });

  it("treats an unchanged selection as a no-op and writes no audit entry", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();

    expect(await setFrameworks(nw, ["antd"])).toBe("No change.");
    expect(await nw.data.audit.find({ action: "org.frameworks-changed" }).toArray()).toEqual([]);
  });

  it("accepts none — a customer on neither framework is a real customer", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();

    const message = await setFrameworks(nw, []);

    expect(message).toContain("own tokens");
    expect((await nw.data.organisation.get())?.frameworks).toEqual([]);
  });

  it("refuses a framework no bridge exists for", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();

    await expect(setFrameworks(nw, ["bootstrap"])).rejects.toThrow(OrganisationError);
    expect((await nw.data.organisation.get())?.frameworks).toEqual(["antd"]);
  });

  it("cannot change another organisation's selection", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    await setFrameworks(sm, ["mui"]);

    // The scoped view resolves `organisation` by the caller's own id, so there
    // is no parameter through which one customer could reach the other.
    expect((await sm.data.organisation.get())?.frameworks).toEqual(["mui"]);
    expect((await nw.data.organisation.get())?.frameworks).toEqual(["antd"]);
  });
});
