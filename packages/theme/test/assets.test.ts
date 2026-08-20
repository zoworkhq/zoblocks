/**
 * What each slot accepts, and how big the file actually is.
 *
 * The security rules live in `logo.test.ts`; these are the *fitness* rules, and
 * they fail differently on purpose. A script in an SVG is a refusal because no
 * correct version of that file exists. A social card that is square is a
 * warning because the file is fine and only its shape is wrong, and blocking
 * somebody at four in the afternoon over the only artwork they have is not a
 * safety measure — it is a design system being precious.
 */

import { describe, expect, it } from "vitest";
import { BRAND_ASSETS, brandAsset } from "../src/assets";
import { brandAssetSchema } from "../src/document";
import { checkBrandAsset } from "../src/logo";
import { imageSize } from "../src/dimensions";

const enc = (s: string) => new TextEncoder().encode(s);

/** A real PNG header, so the dimension reader is exercised rather than mocked. */
function png(width: number, height: number): Uint8Array {
  const b = new Uint8Array(64);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  b.set([0, 0, 0, 13], 8);
  b.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  const be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  b.set(be(width), 16);
  b.set(be(height), 20);
  return b;
}

const svg = (attrs: string) =>
  enc(`<svg xmlns="http://www.w3.org/2000/svg" ${attrs}><circle cx="1" cy="1" r="1"/></svg>`);

describe("reading a size out of the file itself", () => {
  it("reads PNG dimensions from IHDR", () => {
    expect(imageSize(png(180, 180), "png")).toEqual({ width: 180, height: 180, scalable: false });
  });

  it("prefers an SVG's own width and height", () => {
    expect(imageSize(svg('width="120" height="32" viewBox="0 0 999 999"'), "svg")).toMatchObject({
      width: 120,
      height: 32,
      scalable: true,
    });
  });

  it("falls back to the viewBox, which is the common export", () => {
    expect(imageSize(svg('viewBox="0 0 1200 630"'), "svg")).toMatchObject({
      width: 1200,
      height: 630,
    });
  });

  it("returns nothing for artwork that states no size, rather than guessing", () => {
    expect(imageSize(svg(""), "svg")).toBeUndefined();
  });

  it("walks JPEG segments to the frame header", () => {
    // SOI, then an APP0 segment to be stepped over, then SOF0.
    const b = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x76,
      0x04, 0xb0, 0x03, 0, 0, 0, 0, 0, 0,
    ]);
    expect(imageSize(b, "jpeg")).toMatchObject({ width: 1200, height: 630 });
  });

  /**
   * WebP states its size three different ways, and only one of them is common.
   *
   * A design tool emits VP8L for lossless and VP8X whenever there is an alpha
   * channel — which a logo always has. Reading only the lossy VP8 header would
   * work on whatever file happened to be tested and silently return nothing for
   * the ones a customer actually exports.
   */
  it("reads a lossy VP8 header", () => {
    const b = new Uint8Array(32);
    b.set([0x52, 0x49, 0x46, 0x46]); // "RIFF"
    b.set([0x57, 0x45, 0x42, 0x50], 8); // "WEBP"
    b.set([0x56, 0x50, 0x38, 0x20], 12); // "VP8 "
    b[26] = 320 & 0xff;
    b[27] = (320 >> 8) & 0x3f;
    b[28] = 80 & 0xff;
    b[29] = (80 >> 8) & 0x3f;
    expect(imageSize(b, "webp")).toMatchObject({ width: 320, height: 80 });
  });

  it("reads an extended VP8X header, which is what a logo with alpha becomes", () => {
    const b = new Uint8Array(40);
    b.set([0x52, 0x49, 0x46, 0x46]);
    b.set([0x57, 0x45, 0x42, 0x50], 8);
    b.set([0x56, 0x50, 0x38, 0x58], 12); // "VP8X"
    // Both dimensions are stored minus one, little-endian, over three bytes.
    const le24 = (n: number, at: number) => {
      b[at] = n & 0xff;
      b[at + 1] = (n >> 8) & 0xff;
      b[at + 2] = (n >> 16) & 0xff;
    };
    le24(1199, 24);
    le24(629, 27);
    expect(imageSize(b, "webp")).toMatchObject({ width: 1200, height: 630 });
  });

  it("reads a lossless VP8L header", () => {
    const b = new Uint8Array(32);
    b.set([0x52, 0x49, 0x46, 0x46]);
    b.set([0x57, 0x45, 0x42, 0x50], 8);
    b.set([0x56, 0x50, 0x38, 0x4c], 12); // "VP8L"
    // 14 bits of width-1, then 14 bits of height-1, little-endian.
    const bits = (32 - 1) | ((32 - 1) << 14);
    b[21] = bits & 0xff;
    b[22] = (bits >> 8) & 0xff;
    b[23] = (bits >> 16) & 0xff;
    b[24] = (bits >> 24) & 0xff;
    expect(imageSize(b, "webp")).toMatchObject({ width: 32, height: 32 });
  });

  it("returns nothing for a WebP container it does not recognise", () => {
    const b = new Uint8Array(32);
    b.set([0x52, 0x49, 0x46, 0x46]);
    b.set([0x57, 0x45, 0x42, 0x50], 8);
    b.set([0x58, 0x58, 0x58, 0x58], 12);
    expect(imageSize(b, "webp")).toBeUndefined();
  });

  it("returns nothing for a format it was never taught", () => {
    expect(imageSize(png(10, 10), "avif")).toBeUndefined();
  });

  it("does not run off the end of a truncated file", () => {
    expect(() => imageSize(new Uint8Array([0xff, 0xd8, 0xff]), "jpeg")).not.toThrow();
    expect(() => imageSize(new Uint8Array(4), "png")).not.toThrow();
    expect(() => imageSize(new Uint8Array(6), "webp")).not.toThrow();
    expect(imageSize(new Uint8Array(0), "png")).toBeUndefined();
  });
});

describe("each slot only takes what it can deliver", () => {
  it("refuses an SVG for the home-screen icon, and says why", () => {
    const result = checkBrandAsset(svg('width="180" height="180"'), "app-icon");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("does not take SVG");
      // The refusal names the destination, which is the fact that makes the
      // rule make sense rather than look arbitrary.
      expect(result.detail).toContain("apple-touch-icon");
    }
  });

  it("refuses a home-screen icon that is not exactly 180×180", () => {
    const result = checkBrandAsset(png(192, 192), "app-icon");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("192×192");
  });

  it("takes the exact size the platform fixes", () => {
    expect(checkBrandAsset(png(180, 180), "app-icon").ok).toBe(true);
  });
});

describe("shape problems are warnings, not refusals", () => {
  it("accepts a square link-preview card and says it will be cropped", () => {
    const result = checkBrandAsset(png(1200, 1200), "social");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings?.join(" ")).toContain("cropped");
    }
  });

  it("accepts artwork smaller than the slot renders at, and says it will be soft", () => {
    const result = checkBrandAsset(png(120, 30), "email");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings?.join(" ")).toContain("upscaled");
  });

  it("says nothing when the artwork fits", () => {
    const result = checkBrandAsset(png(1200, 630), "social");
    expect(result.ok && result.warnings).toBeUndefined();
  });

  /**
   * A vector favicon is exempt from the size floor and not from the ratio.
   *
   * "Below 32×32" is meaningless for artwork that scales, and warning about it
   * would train people to ignore the warnings — which is the actual cost of a
   * check that fires when nothing is wrong.
   */
  it("does not tell a vector it is too small", () => {
    const result = checkBrandAsset(svg('width="16" height="16"'), "favicon");
    expect(result.ok && result.warnings).toBeUndefined();
  });

  it("still tells a vector it is not square", () => {
    const result = checkBrandAsset(svg('viewBox="0 0 120 32"'), "favicon");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings?.join(" ")).toContain("not square");
  });
});

describe("illustrations, which are one file on two grounds", () => {
  it("previews on both grounds, because nobody ships two drawings", () => {
    for (const spec of BRAND_ASSETS.filter((a) => a.group === "illustration")) {
      expect(spec.ground, spec.role).toBe("both");
    }
  });

  it("takes vector and raster, but never a photograph format", () => {
    // JPEG has no transparency, and an illustration with a baked white
    // rectangle is the exact failure the two-ground preview exists to catch.
    for (const spec of BRAND_ASSETS.filter((a) => a.group === "illustration")) {
      expect(spec.formats, spec.role).not.toContain("jpeg");
    }
  });

  it("warns rather than refuses when a drawing is small", () => {
    const result = checkBrandAsset(png(160, 110), "illustration-empty");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings?.join(" ")).toContain("upscaled");
  });

  /**
   * Four states, not one drawing reused.
   *
   * "Nothing here yet" and "not yours to see" are different messages and staff
   * act on the difference — an empty room and a locked door look nothing alike
   * and should not be illustrated as though they do.
   */
  it("separates empty, no-match, denied and error", () => {
    const roles = BRAND_ASSETS.filter((a) => a.group === "illustration").map((a) => a.role);
    expect(roles).toEqual([
      "illustration-empty",
      "illustration-search",
      "illustration-denied",
      "illustration-error",
    ]);
  });
});

describe("what gets printed", () => {
  /**
   * Paper has one ground.
   *
   * A customer working in the dark theme still prints on white, so these are
   * declared once at the root and never switched per theme — a letterhead that
   * followed the screen theme would come out reversed on the page.
   */
  it("judges print artwork on paper, whatever theme the console is in", () => {
    for (const spec of BRAND_ASSETS.filter((a) => a.group === "print")) {
      expect(spec.ground, spec.role).toBe("light");
    }
  });

  it("takes only formats that survive toner", () => {
    // No JPEG and no WebP: a letterhead needs transparency behind it, and a
    // fax machine is not going to negotiate a modern container.
    for (const spec of BRAND_ASSETS.filter((a) => a.group === "print")) {
      expect(spec.formats, spec.role).toEqual(["svg", "png"]);
    }
  });

  it("wants a square watermark, because it is laid across a page", () => {
    const result = checkBrandAsset(png(600, 200), "watermark-draft");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warnings?.join(" ")).toContain("not square");
  });
});

describe("the registry itself", () => {
  it("has no duplicate roles, because one role is one slot", () => {
    const roles = BRAND_ASSETS.map((a) => a.role);
    expect(new Set(roles).size).toBe(roles.length);
  });

  it("says where every asset is delivered", () => {
    for (const spec of BRAND_ASSETS) {
      expect(spec.delivery.length, spec.role).toBeGreaterThan(0);
      expect(spec.formats.length, spec.role).toBeGreaterThan(0);
    }
  });

  /**
   * The schema is not allowed to have its own opinion about which roles exist.
   *
   * Restated as a literal, it drifted within an hour of the registry gaining
   * four roles: the schema said seven and the screen offered eleven. Only the
   * compiler noticed, and it only noticed because the two were different types.
   */
  it("is the only place a role is named", () => {
    const accepted = BRAND_ASSETS.map((spec) =>
      brandAssetSchema.safeParse({
        role: spec.role,
        sha256: "a".repeat(64),
        format: spec.formats[0],
        src: "/f/x/" + "a".repeat(64) + ".svg",
        alt: "",
        uploadedAt: "2026-08-20T00:00:00.000Z",
      }),
    );
    expect(accepted.every((r) => r.success)).toBe(true);
  });

  it("refuses to look up a role that does not exist", () => {
    // @ts-expect-error — the point is what happens when a string arrives from
    // a form and TypeScript is no longer in the room.
    expect(() => brandAsset("bus-livery")).toThrow(/Unknown brand asset role/);
  });
});
