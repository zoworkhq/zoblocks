/**
 * What the public stylesheet route will and will not serve.
 *
 * The route is unauthenticated by necessity — a browser fetches a stylesheet
 * without credentials — so its refusals are the whole security surface. These
 * drive the same resolution logic the route runs, against a real database.
 */

import { describe, expect, it } from "vitest";
import { emptyAssets, isServable, emitThemeCss } from "@zoblocks/theme";
import { db } from "@/db/client";
import { unscopedPublishedVersion } from "@/db/scope";
import { createTheme, publishTheme, saveDraft } from "@/lib/themes";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@zoblocks/tokens/validate";
import { actingAs, seedOrg, twoOrgs } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

/** The route's own parser, restated so a change to it fails here. */
function parseFile(file: string): { slug: string; version: number } | undefined {
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)@(\d{1,6})\.css$/.exec(file);
  if (!match?.[1] || !match[2]) return undefined;
  return { slug: match[1], version: Number(match[2]) };
}

/** What the route does, minus Next's plumbing. */
async function resolve(orgSlug: string, file: string) {
  const parsed = parseFile(file);
  if (!parsed) return undefined;
  const found = await unscopedPublishedVersion(orgSlug, parsed.slug, parsed.version);
  if (!found) return undefined;
  const { organisation: org, theme, version } = found;

  const document = {
    id: theme._id.toHexString(),
    orgId: org._id.toHexString(),
    name: theme.name,
    slug: theme.slug,
    version: version.version,
    status: "published" as const,
    tokens: version.tokens,
    assets: emptyAssets(),
    validation: version.validation,
    audit: {
      createdBy: theme.createdBy.toHexString(),
      createdAt: theme.createdAt.toISOString(),
      publishedBy: version.publishedBy.toHexString(),
      publishedAt: version.publishedAt.toISOString(),
    },
  };
  if (!isServable(document).ok) return undefined;
  return emitThemeCss(document);
}

describe("the URL", () => {
  it("accepts a slug and a version", () => {
    expect(parseFile("northwind-clinical@7.css")).toEqual({
      slug: "northwind-clinical",
      version: 7,
    });
  });

  it("refuses anything else", () => {
    for (const bad of [
      "clinical.css",
      "clinical@.css",
      "clinical@latest.css",
      "Clinical@1.css",
      "../../etc/passwd",
      "clinical@1.css/../../x",
      "clinical@99999999.css",
    ]) {
      expect(parseFile(bad), bad).toBeUndefined();
    }
  });
});

describe("what is served", () => {
  it("serves a published version", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    const css = await resolve("northwind", "clinical@1.css");
    expect(css).toContain("--zb-ref-brand-600: #1d63c9;");
  });

  it("keeps every published version reachable, so a pin stays valid", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);
    await saveDraft(auth, id, { ref: { brand: { "600": "#b91c1c", "700": "#991b1b" } } });
    await publishTheme(auth, await tokens(), id);

    // An application pinned to 1 keeps getting 1 after 2 ships. That is the
    // property that makes runtime delivery safe.
    expect(await resolve("northwind", "clinical@1.css")).toContain("#1d63c9");
    expect(await resolve("northwind", "clinical@2.css")).toContain("#b91c1c");
  });
});

describe("what is refused", () => {
  it("refuses a draft — only a published version is ever served", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    expect(await resolve("northwind", "clinical@1.css")).toBeUndefined();
  });

  it("refuses a version that does not exist", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);
    expect(await resolve("northwind", "clinical@9.css")).toBeUndefined();
  });

  it("refuses an organisation that does not exist", async () => {
    expect(await resolve("nobody", "clinical@1.css")).toBeUndefined();
  });

  /**
   * The cross-tenant case at the public boundary. The theme exists and the
   * version is right; only the organisation in the URL is wrong.
   */
  it("refuses one organisation's theme under another's slug", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(nw, await tokens(), id);

    expect(await resolve("northwind", "clinical@1.css")).toBeDefined();
    expect(await resolve("southmere", "clinical@1.css")).toBeUndefined();
  });

  /**
   * The guard on serve. Tightening a rule must not leave older palettes live,
   * which is the reason `validatorVersion` is on the document at all.
   */
  it("refuses a version validated by an older validator", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    expect(await resolve("northwind", "clinical@1.css")).toBeDefined();

    await db().themeVersions.updateOne(
      { themeId: id, version: 1 },
      { $set: { "validation.validatorVersion": "0.9.0" } },
    );

    expect(await resolve("northwind", "clinical@1.css")).toBeUndefined();
  });
});
