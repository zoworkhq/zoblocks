/**
 * Storing brand artwork and glyphs, at the layer the browser tests cannot see.
 *
 * The end-to-end sweeps prove somebody can upload a file and that a hostile one
 * is refused. What they cannot show is what the *document* looks like
 * afterwards — whether a second upload replaced the first or appended beside
 * it, whether two writers racing each other both survive, whether removing one
 * asset takes a neighbour with it. Those are the failures that leave a theme
 * looking correct on screen and wrong in the database.
 */

import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { actingAs, seedOrg } from "./harness";
import { createTheme } from "@/lib/themes";
import { uploadBrandAsset, removeBrandAsset } from "@/lib/brand-assets";
import { uploadIcons, removeIcon, MAX_ICON_BYTES } from "@/lib/icons";

const enc = (s: string) => new Uint8Array(new TextEncoder().encode(s));

const svg = (body = '<circle cx="12" cy="12" r="10"/>') =>
  enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body}</svg>`);

/** A real PNG header, so the dimension reader runs rather than being mocked. */
function png(width: number, height: number): Uint8Array {
  const b = new Uint8Array(64);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  b.set([0, 0, 0, 13], 8);
  b.set([0x49, 0x48, 0x44, 0x52], 12);
  const be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  b.set(be(width), 16);
  b.set(be(height), 20);
  return b;
}

async function theme() {
  const auth = await actingAs(await seedOrg("Northwind", "northwind"));
  const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
  return { auth, id };
}

const assetsOf = async (auth: Awaited<ReturnType<typeof theme>>["auth"], id: ObjectId) =>
  (await auth.data.themes.findOne({ _id: id }))?.assets;

describe("one asset per role", () => {
  it("replaces rather than appends when the same role is uploaded twice", async () => {
    const { auth, id } = await theme();

    await uploadBrandAsset(auth, id, {
      bytes: svg(),
      filename: "a.svg",
      role: "mark-light",
      alt: "First",
    });
    await uploadBrandAsset(auth, id, {
      bytes: svg('<rect width="24" height="24"/>'),
      filename: "b.svg",
      role: "mark-light",
      alt: "Second",
    });

    const brand = (await assetsOf(auth, id))?.brand ?? [];
    expect(brand.filter((a) => a.role === "mark-light")).toHaveLength(1);
    expect(brand[0]?.alt).toBe("Second");
  });

  /**
   * The reason the writes use array operators rather than rebuilding `assets`.
   *
   * Two people saving two *different* assets at the same moment each read the
   * document, each append their own, and whichever saves second erases the
   * other. It surfaced as a browser test timing out on a Remove button that
   * never appeared — which is what that failure looks like from outside: not an
   * error, just an upload that quietly did not happen.
   */
  it("keeps both when two roles are written at the same time", async () => {
    const { auth, id } = await theme();

    await Promise.all([
      uploadBrandAsset(auth, id, {
        bytes: svg(),
        filename: "light.svg",
        role: "mark-light",
        alt: "Light",
      }),
      uploadBrandAsset(auth, id, {
        bytes: svg('<rect width="24" height="24"/>'),
        filename: "mono.svg",
        role: "mark-mono",
        alt: "Mono",
      }),
    ]);

    const roles = ((await assetsOf(auth, id))?.brand ?? []).map((a) => a.role).sort();
    expect(roles).toEqual(["mark-light", "mark-mono"]);
  });

  it("removes one role and leaves the others alone", async () => {
    const { auth, id } = await theme();

    for (const role of ["mark-light", "mark-mono"] as const) {
      await uploadBrandAsset(auth, id, { bytes: svg(), filename: `${role}.svg`, role, alt: role });
    }
    await removeBrandAsset(auth, id, "mark-light");

    const roles = ((await assetsOf(auth, id))?.brand ?? []).map((a) => a.role);
    expect(roles).toEqual(["mark-mono"]);
  });

  it("records the measured size, so a host can reserve the space", async () => {
    const { auth, id } = await theme();
    const { asset } = await uploadBrandAsset(auth, id, {
      bytes: png(180, 180),
      filename: "icon.png",
      role: "app-icon",
      alt: "",
    });

    expect(asset.width).toBe(180);
    expect(asset.height).toBe(180);
    // Content-addressed, and the URL is the digest — which is what makes it
    // safe to serve immutably.
    expect(asset.src).toMatch(/^\/f\/northwind\/[0-9a-f]{64}\.png$/);
  });
});

describe("what the store refuses", () => {
  it("refuses a role that does not exist", async () => {
    const { auth, id } = await theme();
    await expect(
      uploadBrandAsset(auth, id, { bytes: svg(), filename: "x.svg", role: "bus-livery", alt: "" }),
    ).rejects.toThrow(/Unknown asset role/);
  });

  it("refuses artwork that can execute, at this layer too", async () => {
    const { auth, id } = await theme();
    await expect(
      uploadBrandAsset(auth, id, {
        bytes: svg("<script>alert(1)</script>"),
        filename: "x.svg",
        role: "mark-light",
        alt: "",
      }),
    ).rejects.toThrow(/cannot be hosted/);
  });

  /**
   * Whitespace is not a decision.
   *
   * The empty string means *deliberately decorative* and is allowed. A space is
   * somebody who meant to type a name, and accepting it stores an announcement
   * of nothing while looking like a choice was made.
   */
  it("refuses alternative text that is only spaces", async () => {
    const { auth, id } = await theme();
    await expect(
      uploadBrandAsset(auth, id, {
        bytes: svg(),
        filename: "x.svg",
        role: "mark-light",
        alt: "   ",
      }),
    ).rejects.toThrow(/only spaces/);
  });

  it("accepts an empty alt, because decorative is a real answer", async () => {
    const { auth, id } = await theme();
    const { asset } = await uploadBrandAsset(auth, id, {
      bytes: svg(),
      filename: "x.svg",
      role: "mark-light",
      alt: "",
    });
    expect(asset.alt).toBe("");
  });

  it("refuses a home-screen icon that is not the size the platform fixes", async () => {
    const { auth, id } = await theme();
    await expect(
      uploadBrandAsset(auth, id, {
        bytes: png(192, 192),
        filename: "icon.png",
        role: "app-icon",
        alt: "",
      }),
    ).rejects.toThrow(/192×192/);
  });

  it("warns about a shape it will still store", async () => {
    const { auth, id } = await theme();
    const { warnings } = await uploadBrandAsset(auth, id, {
      bytes: png(1200, 1200),
      filename: "card.png",
      role: "social",
      alt: "",
    });
    expect(warnings.join(" ")).toContain("cropped");
  });
});

describe("glyphs", () => {
  it("takes a whole set and names what it could not place", async () => {
    const { auth, id } = await theme();

    const { saved, skipped } = await uploadIcons(auth, id, [
      { slot: "send", name: "send.svg", bytes: svg() },
      { slot: "close", name: "close.svg", bytes: svg() },
      { slot: "arrow-right", name: "arrow-right.svg", bytes: svg() },
    ]);

    expect([...saved].sort()).toEqual(["close", "send"]);
    expect(skipped).toEqual([{ name: "arrow-right.svg", reason: "no slot with that name" }]);
  });

  /**
   * One bad glyph does not fail the other twenty-eight.
   *
   * A designer dropping a whole set has one file the exporter mangled. Refusing
   * the batch means they fix it and re-upload everything, and the second attempt
   * has a different glyph wrong.
   */
  it("stores the good files in a batch that contains a bad one", async () => {
    const { auth, id } = await theme();

    const { saved, skipped } = await uploadIcons(auth, id, [
      { slot: "send", name: "send.svg", bytes: svg() },
      { slot: "stop", name: "stop.svg", bytes: svg("<script>alert(1)</script>") },
    ]);

    expect(saved).toEqual(["send"]);
    expect(skipped[0]?.reason).toMatch(/cannot be hosted/);
  });

  it("refuses a locked mark by name, with the reason attached", async () => {
    const { auth, id } = await theme();
    const { saved, skipped } = await uploadIcons(auth, id, [
      { slot: "switch-unknown", name: "switch-unknown.svg", bytes: svg() },
    ]);

    expect(saved).toEqual([]);
    // Not "unknown slot" — it exists, and the refusal has to say why rather
    // than implying somebody mistyped it.
    expect(skipped[0]?.reason).toBe("no slot with that name");
  });

  it("refuses a raster glyph, because a mask uses its alpha", async () => {
    const { auth, id } = await theme();
    const { skipped } = await uploadIcons(auth, id, [
      { slot: "send", name: "send.png", bytes: png(24, 24) },
    ]);
    expect(skipped[0]?.reason).toMatch(/has to be an SVG/);
  });

  it("refuses a glyph larger than a glyph could be", async () => {
    const { auth, id } = await theme();
    const huge = new Uint8Array(MAX_ICON_BYTES + 1);
    huge.set(svg());

    const { skipped } = await uploadIcons(auth, id, [
      { slot: "send", name: "send.svg", bytes: huge },
    ]);
    expect(skipped[0]?.reason).toMatch(/the limit is/);
  });

  it("replaces a slot rather than accumulating, and reverts cleanly", async () => {
    const { auth, id } = await theme();

    await uploadIcons(auth, id, [{ slot: "send", name: "send.svg", bytes: svg() }]);
    await uploadIcons(auth, id, [
      { slot: "send", name: "send.svg", bytes: svg('<rect width="24" height="24"/>') },
    ]);

    let icons = (await assetsOf(auth, id))?.icons ?? [];
    expect(icons.filter((i) => i.slot === "send")).toHaveLength(1);

    await removeIcon(auth, id, "send");
    icons = (await assetsOf(auth, id))?.icons ?? [];
    expect(icons).toHaveLength(0);
  });
});
