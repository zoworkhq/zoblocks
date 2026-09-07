/**
 * Accepting a customer's font, all the way to the bytes a browser fetches.
 *
 * `packages/theme` already tests `checkFont` against a PNG renamed to `.woff2`.
 * What is tested here is the part that has a database: that the digest is the
 * key, that a published version keeps the face it was published with, and that
 * one customer cannot read another's uploads.
 */

import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { unscopedFontAsset } from "@/db/scope";
import { ThemeError, createTheme, publishTheme, versionCss } from "@/lib/themes";
import { fontHref, removeFont, uploadFont } from "@/lib/fonts";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@zoblocks/tokens/validate";
import { twoOrgs } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

/** A minimal woff2: the magic number is what identifies it, so that is what matters. */
function woff2(marker = 0): Uint8Array {
  const bytes = new Uint8Array(2048);
  bytes.set([0x77, 0x4f, 0x46, 0x32]); // "wOF2"
  bytes[100] = marker;
  return bytes;
}

async function aTheme() {
  const { asNorthwind, asSouthmere } = await twoOrgs();
  const nw = await asNorthwind();
  const sm = await asSouthmere();
  const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
  return { nw, sm, id };
}

describe("uploading a face", () => {
  it("stores the bytes and attaches a @font-face to the theme", async () => {
    const { nw, id } = await aTheme();

    const { face } = await uploadFont(nw, id, {
      bytes: woff2(),
      filename: "northwind.woff2",
      family: "Northwind Sans",
    });

    expect(face.family).toBe("Northwind Sans");
    expect(face.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(face.src).toContain(face.sha256);

    const theme = await nw.data.themes.findOne({ _id: id });
    expect(theme?.assets?.fonts).toHaveLength(1);
    expect(await nw.data.fontAssets.countDocuments()).toBe(1);
  });

  /**
   * The digest is the key, so the same bytes twice are one document. That is
   * what makes a re-upload idempotent and two themes able to share one copy.
   */
  it("stores identical bytes once", async () => {
    const { nw, id } = await aTheme();

    const first = await uploadFont(nw, id, {
      bytes: woff2(),
      filename: "a.woff2",
      family: "One",
    });
    const second = await uploadFont(nw, id, {
      bytes: woff2(),
      filename: "b.woff2",
      family: "Two",
    });

    expect(second.reused).toBe(true);
    expect(second.face.sha256).toBe(first.face.sha256);
    expect(await nw.data.fontAssets.countDocuments()).toBe(1);
    // Two families, one stored file.
    expect((await nw.data.themes.findOne({ _id: id }))?.assets?.fonts).toHaveLength(2);
  });

  it("replaces rather than stacks when a family is re-uploaded", async () => {
    const { nw, id } = await aTheme();

    await uploadFont(nw, id, { bytes: woff2(1), filename: "v1.woff2", family: "Northwind Sans" });
    await uploadFont(nw, id, { bytes: woff2(2), filename: "v2.woff2", family: "Northwind Sans" });

    const fonts = (await nw.data.themes.findOne({ _id: id }))?.assets?.fonts ?? [];
    expect(fonts).toHaveLength(1);
    // Both sets of bytes are kept; only the reference moved.
    expect(await nw.data.fontAssets.countDocuments()).toBe(2);
  });

  it("refuses a file that is not a font, whatever it is called", async () => {
    const { nw, id } = await aTheme();
    const png = new Uint8Array([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      ...new Array(64).fill(0),
    ]);

    await expect(
      uploadFont(nw, id, { bytes: png, filename: "sneaky.woff2", family: "Nope" }),
    ).rejects.toThrow(ThemeError);
    expect(await nw.data.fontAssets.countDocuments()).toBe(0);
  });

  it("refuses an unnamed family", async () => {
    const { nw, id } = await aTheme();
    await expect(
      uploadFont(nw, id, { bytes: woff2(), filename: "a.woff2", family: "   " }),
    ).rejects.toThrow(/name/);
  });

  it("records who uploaded it", async () => {
    const { nw, id } = await aTheme();
    await uploadFont(nw, id, { bytes: woff2(), filename: "a.woff2", family: "Northwind Sans" });

    const entries = await nw.data.audit.find({ action: "theme.font-uploaded" }).toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.detail).toContain("Northwind Sans");
  });

  it("detaches a family without deleting bytes another theme may share", async () => {
    const { nw, id } = await aTheme();
    await uploadFont(nw, id, { bytes: woff2(), filename: "a.woff2", family: "Northwind Sans" });

    await removeFont(nw, id, "Northwind Sans");

    expect((await nw.data.themes.findOne({ _id: id }))?.assets?.fonts).toEqual([]);
    expect(await nw.data.fontAssets.countDocuments()).toBe(1);
  });
});

describe("serving a face", () => {
  it("is reachable by org slug and digest", async () => {
    const { nw, id } = await aTheme();
    const { face } = await uploadFont(nw, id, {
      bytes: woff2(),
      filename: "a.woff2",
      family: "Northwind Sans",
    });

    const asset = await unscopedFontAsset("northwind", face.sha256!);
    expect(asset?.format).toBe("woff2");
    expect(fontHref("northwind", face.sha256!, "woff2")).toBe(`/f/northwind/${face.sha256}.woff2`);
  });

  /**
   * The route is public — a `@font-face` src carries no session — so the org
   * slug has to be part of what decides reachability, not just the digest.
   */
  it("is not reachable under another organisation's slug", async () => {
    const { nw, id } = await aTheme();
    const { face } = await uploadFont(nw, id, {
      bytes: woff2(),
      filename: "a.woff2",
      family: "Northwind Sans",
    });

    expect(await unscopedFontAsset("southmere", face.sha256!)).toBeUndefined();
  });

  it("cannot be listed by another organisation", async () => {
    const { nw, sm, id } = await aTheme();
    await uploadFont(nw, id, { bytes: woff2(), filename: "a.woff2", family: "Northwind Sans" });

    expect(await sm.data.fontAssets.countDocuments()).toBe(0);
  });

  it("cannot be attached to another organisation's theme", async () => {
    const { sm, id } = await aTheme();
    await expect(
      uploadFont(sm, id, { bytes: woff2(), filename: "a.woff2", family: "X" }),
    ).rejects.toThrow("No such theme");
  });
});

describe("a published version keeps the face it was published with", () => {
  /**
   * Immutability, which is the whole reason a version exists. Reading fonts
   * from the live theme document would mean uploading a new face silently
   * changed every stylesheet already in production.
   */
  it("does not follow a later upload", async () => {
    const { nw, id } = await aTheme();
    await uploadFont(nw, id, { bytes: woff2(1), filename: "v1.woff2", family: "Northwind Sans" });

    const { version } = await publishTheme(nw, await tokens(), id);
    const published = await versionCss(nw, id, version);

    // A different family uploaded after the publish.
    await uploadFont(nw, id, { bytes: woff2(2), filename: "v2.woff2", family: "Later Sans" });

    expect(published).toContain('font-family: "Northwind Sans"');
    expect(await versionCss(nw, id, version)).toBe(published);
    expect(published).not.toContain("Later Sans");
  });

  it("emits the @font-face with swap, so a slow font never blanks a value", async () => {
    const { nw, id } = await aTheme();
    await uploadFont(nw, id, { bytes: woff2(), filename: "a.woff2", family: "Northwind Sans" });
    const { version } = await publishTheme(nw, await tokens(), id);

    const css = await versionCss(nw, id, version);
    expect(css).toContain("@font-face");
    expect(css).toContain("font-display: swap");
    expect(css).toContain("--zb-font-sans:");
  });

  it("serves nothing extra for a theme with no fonts", async () => {
    const { nw, id } = await aTheme();
    const { version } = await publishTheme(nw, await tokens(), id);

    expect(await versionCss(nw, id, version)).not.toContain("@font-face");
  });
});

describe("ObjectId sanity", () => {
  it("uses a real id in the audit actor", async () => {
    const { nw, id } = await aTheme();
    await uploadFont(nw, id, { bytes: woff2(), filename: "a.woff2", family: "Northwind Sans" });
    const entry = await nw.data.audit.find({ action: "theme.font-uploaded" }).toArray();
    expect(ObjectId.isValid(entry[0]!.actorId)).toBe(true);
  });
});
