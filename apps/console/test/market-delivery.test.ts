/**
 * Getting the bytes out — the zip, the tokens, and installing into a theme.
 *
 * The zip is written by hand, so "it opens" is a property to assert rather
 * than assume: a wrong offset in the central directory produces an archive
 * that some readers open and others reject, which is the worst way to find out.
 */

import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { scoped } from "@/db/scope";
import { crc32, zip } from "@/lib/market/zip";
import { MAX_TOKENS, hashToken, listTokens, mintToken, revokeToken } from "@/lib/market/tokens";
import { unscopedRegistryToken, unscopedTouchRegistryToken } from "@/db/scope";
import { install } from "@/lib/market/install";
import { grant } from "@/lib/market/entitlements";
import { createTheme } from "@/lib/themes";
import { actingAs, twoOrgs } from "./harness";
import { seedItem } from "./market-harness";

/* -------------------------------------------------------------------------
 * The archive
 * ---------------------------------------------------------------------- */

/** A minimal reader, so the test parses the format rather than trusting it. */
function readZip(archive: Uint8Array) {
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);

  // End of central directory is the last 22 bytes when there is no comment.
  const eocd = archive.length - 22;
  expect(view.getUint32(eocd, true)).toBe(0x06054b50);

  const count = view.getUint16(eocd + 8, true);
  const centralSize = view.getUint32(eocd + 12, true);
  let cursor = view.getUint32(eocd + 16, true);

  // The directory must start exactly where the local entries end.
  expect(cursor + centralSize).toBe(eocd);

  const decoder = new TextDecoder();
  const entries: { path: string; text: string; crc: number }[] = [];

  for (let i = 0; i < count; i += 1) {
    expect(view.getUint32(cursor, true)).toBe(0x02014b50);
    const crc = view.getUint32(cursor + 16, true);
    const size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const offset = view.getUint32(cursor + 42, true);
    const path = decoder.decode(archive.subarray(cursor + 46, cursor + 46 + nameLength));

    // Follow the offset into the local header and read the stored bytes.
    expect(view.getUint32(offset, true)).toBe(0x04034b50);
    const localNameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const start = offset + 30 + localNameLength + extraLength;
    entries.push({ path, text: decoder.decode(archive.subarray(start, start + size)), crc });

    cursor += 46 + nameLength;
  }

  return entries;
}

describe("the pack archive", () => {
  const at = new Date("2026-08-14T09:12:03Z");
  const bytes = (text: string) => new TextEncoder().encode(text);

  it("round-trips every entry through its own central directory offset", () => {
    const archive = zip(
      [
        { path: "art/one.svg", bytes: bytes("<svg>one</svg>") },
        { path: "art/two.svg", bytes: bytes("<svg>two</svg>") },
        { path: "meanings.json", bytes: bytes('{"a":1}') },
      ],
      at,
    );

    expect(readZip(archive).map((e) => [e.path, e.text])).toEqual([
      ["art/one.svg", "<svg>one</svg>"],
      ["art/two.svg", "<svg>two</svg>"],
      ["meanings.json", '{"a":1}'],
    ]);
  });

  it("stores a CRC a reader can verify", () => {
    const archive = zip([{ path: "a.txt", bytes: bytes("hello") }], at);
    // The well-known CRC-32 of "hello", so this checks the table rather than
    // agreeing with itself.
    expect(crc32(bytes("hello"))).toBe(0x3610a686);
    expect(readZip(archive)[0]?.crc).toBe(0x3610a686);
  });

  it("is deterministic, so two downloads of one version are one file", () => {
    const entries = [{ path: "a.txt", bytes: bytes("x") }];
    expect(zip(entries, at)).toEqual(zip(entries, at));
  });

  it("handles an empty archive without corrupting the directory", () => {
    expect(readZip(zip([], at))).toEqual([]);
  });

  it("writes UTF-8 filenames", () => {
    const archive = zip([{ path: "art/ré-sumé.svg", bytes: bytes("x") }], at);
    expect(readZip(archive)[0]?.path).toBe("art/ré-sumé.svg");
  });
});

/* -------------------------------------------------------------------------
 * CLI credentials
 * ---------------------------------------------------------------------- */

describe("registry tokens", () => {
  it("stores only a digest, and returns the value once", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");

    const { token } = await mintToken(auth, "Ada's laptop");

    expect(token.startsWith("oxy_live_")).toBe(true);
    const [stored] = await scoped(northwind).registryTokens.find().toArray();
    // The row must contain nothing that could be used to install.
    expect(stored?._id).toBe(hashToken(token));
    expect(JSON.stringify(stored)).not.toContain(token);
  });

  it("resolves an organisation from the token and nothing else", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");
    const { token } = await mintToken(auth, "CI");

    const resolved = await unscopedRegistryToken(hashToken(token));
    expect(resolved?.orgId.toHexString()).toBe(northwind.toHexString());
    expect(await unscopedRegistryToken(hashToken("oxy_live_wrong"))).toBeUndefined();
  });

  it("stops resolving the moment it is revoked", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");
    const { token } = await mintToken(auth, "CI");

    await revokeToken(auth, hashToken(token));

    expect(await unscopedRegistryToken(hashToken(token))).toBeUndefined();
    // The row stays, so "when did this stop working" is answerable.
    expect(await scoped(northwind).registryTokens.countDocuments()).toBe(1);
  });

  it("refuses an expired token rather than waiting for the TTL sweep", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");
    const { token } = await mintToken(auth, "CI");

    // A TTL monitor runs about once a minute, so a token is briefly readable
    // after it expires — and "briefly" is not a word that belongs in an
    // authorisation check.
    await scoped(northwind).registryTokens.updateOne(
      { _id: hashToken(token) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    expect(await unscopedRegistryToken(hashToken(token))).toBeUndefined();
  });

  it("stamps last use", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");
    const { token } = await mintToken(auth, "CI");

    await unscopedTouchRegistryToken(hashToken(token));
    expect((await listTokens(auth))[0]?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("insists on a label", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");

    await expect(mintToken(auth, "   ")).rejects.toThrow("Give the token a label");
    await expect(mintToken(auth, "x".repeat(61))).rejects.toThrow("too long");
  });

  it("caps how many can be live at once", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");

    for (let i = 0; i < MAX_TOKENS; i += 1) await mintToken(auth, `machine ${i}`);
    await expect(mintToken(auth, "one more")).rejects.toThrow("live tokens");
  });

  it("refuses to revoke another organisation's token", async () => {
    const { northwind, southmere } = await twoOrgs();
    const nw = await actingAs(northwind, "developer");
    const sm = await actingAs(southmere, "developer");
    const { token } = await mintToken(nw, "Ada's laptop");

    await expect(revokeToken(sm, hashToken(token))).rejects.toThrow("No such token");
    expect(await unscopedRegistryToken(hashToken(token))).toBeDefined();
  });
});

/* -------------------------------------------------------------------------
 * Installing
 * ---------------------------------------------------------------------- */

describe("installing", () => {
  it("refuses to install something the organisation has not bought", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem();

    await expect(install(auth, item.slug)).rejects.toThrow("has not bought");
  });

  it("puts glyphs into a theme's draft and leaves it unpublished", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({
      slug: "clinical-icons",
      kind: "icons",
      files: [
        {
          path: "icons/alert.svg",
          text: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M1 1"/></svg>',
          slot: "alert",
        },
        {
          path: "icons/lock.svg",
          text: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M2 2"/></svg>',
          slot: "lock",
        },
      ],
    });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    const theme = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    const result = await install(auth, item.slug, theme.id);

    expect(result.message).toContain("2 glyphs");

    const stored = await scoped(northwind).themes.findOne({ _id: theme.id });
    expect(stored?.assets?.icons?.map((i) => i.slot).sort()).toEqual(["alert", "lock"]);
    // The whole point: a purchase must not be a back door around publishing.
    expect(stored?.liveVersion).toBeNull();
    expect(await scoped(northwind).versions.countDocuments()).toBe(0);
  });

  it("asks which theme rather than guessing", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({ slug: "clinical-icons", kind: "icons" });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    await expect(install(auth, item.slug)).rejects.toThrow("Choose which theme");
  });

  it("refuses an icon pack with nothing mapped to a slot", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({ slug: "clinical-icons", kind: "icons" });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });
    const theme = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });

    await expect(install(auth, item.slug, theme.id)).rejects.toThrow("no glyphs mapped");
  });

  it("creates a draft theme from a theme pack", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({
      slug: "severity-ramp",
      kind: "theme",
      tokens: { ref: { brand: { "600": "#0f766e" } } },
    });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    const result = await install(auth, item.slug);

    expect(result.message).toContain("Nothing is live");
    const created = await scoped(northwind).themes.findOne({});
    expect(created?.liveVersion).toBeNull();
    expect(created?.status).not.toBe("published");
  });

  it("says so rather than overwriting a theme somebody is working on", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({
      slug: "severity-ramp",
      kind: "theme",
      tokens: { ref: { brand: { "600": "#0f766e" } } },
    });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    await install(auth, item.slug);
    await expect(install(auth, item.slug)).rejects.toThrow("already exists");
  });

  it("points components at the CLI and packs at the download", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");

    const component = await seedItem({ slug: "vitals-flowsheet", kind: "component" });
    await grant(northwind, component._id, { via: "cs_1", versionLine: 1 });
    expect((await install(auth, component.slug)).href).toBe("/market/tokens");

    const fixtures = await seedItem({ slug: "messy-fixtures", kind: "fixtures" });
    await grant(northwind, fixtures._id, { via: "cs_2", versionLine: 1 });
    expect((await install(auth, fixtures.slug)).message).toContain("Download the pack");
  });

  it("refuses a theme pack with no token document", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({ slug: "broken-theme", kind: "theme" });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    await expect(install(auth, item.slug)).rejects.toThrow("no token document");
  });

  it("cannot install into another organisation's theme", async () => {
    const { northwind, southmere } = await twoOrgs();
    const nw = await actingAs(northwind, "admin");
    const sm = await actingAs(southmere, "admin");

    const item = await seedItem({
      slug: "clinical-icons",
      kind: "icons",
      files: [
        {
          path: "icons/alert.svg",
          text: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M1 1"/></svg>',
          slot: "alert",
        },
      ],
    });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });
    await grant(southmere, item._id, { via: "cs_2", versionLine: 1 });

    const theirs = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    // Southmere owns the pack and knows the theme id, and still cannot reach it.
    await expect(install(sm, item.slug, theirs.id)).rejects.toThrow("No such theme");
  });

  it("ignores a file whose bytes have gone missing rather than failing the install", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({
      slug: "clinical-icons",
      kind: "icons",
      files: [
        {
          path: "icons/alert.svg",
          text: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M1 1"/></svg>',
          slot: "alert",
        },
      ],
    });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });
    await scoped(northwind); // no-op, keeps the shape of the other tests

    const version = await scoped(northwind).orders.countDocuments();
    expect(version).toBe(0);

    // Drop the bytes, keep the manifest entry.
    const { db } = await import("@/db/client");
    await db().marketAssets.deleteMany({});

    const theme = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    const result = await install(auth, item.slug, theme.id);
    expect(result.message).toContain("Installed 0 glyphs");
  });

  it("refuses an item the catalogue does not have", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    await expect(install(auth, "ghost", new ObjectId())).rejects.toThrow("No such item");
  });
});
