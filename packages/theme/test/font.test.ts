/**
 * Accepting a font from a customer.
 *
 * The rejection tests are the point. An upload endpoint that trusts a filename
 * serves whatever was renamed to `.woff2`, and the interesting cases are all
 * files that look right and are not.
 */

import { describe, expect, it } from "vitest";
import { MAX_FONT_BYTES, checkFont, fontHeaders } from "../src/index";

/** A minimal file with a given four-byte signature. */
function signed(signature: string, extra = 64): Uint8Array {
  const bytes = new Uint8Array(4 + extra);
  for (let i = 0; i < 4; i++) bytes[i] = signature.charCodeAt(i);
  return bytes;
}

/** A TrueType sfnt with a real table directory, optionally carrying GSUB/tnum. */
function sfnt(options: { gsub?: boolean; tnum?: boolean } = {}): Uint8Array {
  const tables = options.gsub ? 1 : 0;
  const gsubBody = new TextEncoder().encode(
    options.tnum ? "....tnum....padding" : "....liga....padding",
  );
  const directoryEnd = 12 + tables * 16;
  const total = directoryEnd + (options.gsub ? gsubBody.length : 0);

  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, 0x00010000); // TrueType signature
  view.setUint16(4, tables);

  if (options.gsub) {
    const entry = 12;
    bytes.set(new TextEncoder().encode("GSUB"), entry);
    view.setUint32(entry + 8, directoryEnd);
    view.setUint32(entry + 12, gsubBody.length);
    bytes.set(gsubBody, directoryEnd);
  }
  return bytes;
}

describe("what is refused", () => {
  it("refuses an empty file", async () => {
    expect(await checkFont(new Uint8Array(0))).toMatchObject({ ok: false, reason: /empty/ });
  });

  /**
   * The one that matters. A PNG renamed to `.woff2` is the shape of every
   * upload attack, and an extension check accepts it.
   */
  it("refuses a file that is not a font, whatever it is called", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);
    const result = await checkFont(png, "brand.woff2");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("not a font");
      expect(result.detail).toContain("never by their extension");
    }
  });

  it("refuses an HTML file dressed as a font", async () => {
    const html = new TextEncoder().encode("<!doctype html><script>alert(1)</script>");
    expect((await checkFont(html, "x.ttf")).ok).toBe(false);
  });

  it("refuses anything over the cap, and says the size", async () => {
    const huge = signed("wOF2", MAX_FONT_BYTES);
    const result = await checkFont(huge, "big.woff2");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("The limit is 2 MB");
      expect(result.detail).toContain("Subset it");
    }
  });

  it("checks the size before doing any parsing work", async () => {
    // A file that is both oversized and not a font reports the size, because
    // work on an attacker-supplied length is the cheapest denial of service.
    const huge = new Uint8Array(MAX_FONT_BYTES + 1);
    const result = await checkFont(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("2 MB");
  });
});

describe("what is accepted", () => {
  it("recognises woff2 by signature", async () => {
    expect(await checkFont(signed("wOF2"), "a.woff2")).toMatchObject({ ok: true, format: "woff2" });
  });

  it("recognises woff, OpenType and TrueType", async () => {
    expect(await checkFont(signed("wOFF"))).toMatchObject({ format: "woff" });
    expect(await checkFont(signed("OTTO"))).toMatchObject({ format: "opentype" });
    expect(await checkFont(sfnt())).toMatchObject({ format: "truetype" });
  });

  it("accepts a real font whose extension is wrong", async () => {
    // Valid bytes, misleading name. Refusing it would be pedantry.
    expect(await checkFont(signed("wOF2"), "brand.ttf")).toMatchObject({ ok: true });
  });

  it("records a digest of exactly the bytes accepted", async () => {
    const result = await checkFont(signed("wOF2"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
      // Same bytes, same digest — that is what makes it verifiable later.
      const again = await checkFont(signed("wOF2"));
      if (again.ok) expect(again.sha256).toBe(result.sha256);
    }
  });

  it("gives different bytes a different digest", async () => {
    const a = await checkFont(signed("wOF2", 64));
    const b = await checkFont(signed("wOF2", 65));
    if (a.ok && b.ok) expect(a.sha256).not.toBe(b.sha256);
  });
});

describe("tabular figures", () => {
  /**
   * A face without `tnum` makes every numeric column ragged. In a flowsheet
   * that is a real problem and it is invisible in a heading, so the customer
   * is told at upload rather than discovering it in a vitals table.
   */
  it("finds the feature when the face carries it", async () => {
    const result = await checkFont(sfnt({ gsub: true, tnum: true }));
    expect(result.ok && result.tabularNumerals).toBe(true);
  });

  it("reports its absence when the face has features but not that one", async () => {
    const result = await checkFont(sfnt({ gsub: true, tnum: false }));
    expect(result.ok && result.tabularNumerals).toBe(false);
  });

  it("reports absence for a face with no OpenType features at all", async () => {
    const result = await checkFont(sfnt());
    expect(result.ok && result.tabularNumerals).toBe(false);
  });

  /**
   * Unknown is reported as unknown. woff2 is Brotli-compressed, and a face
   * reported as lacking a feature it has would push a customer away from a
   * font that was fine.
   */
  it("says undefined rather than false for a compressed container", async () => {
    const woff2 = await checkFont(signed("wOF2"));
    const woff = await checkFont(signed("wOFF"));
    expect(woff2.ok && woff2.tabularNumerals).toBeUndefined();
    expect(woff.ok && woff.tabularNumerals).toBeUndefined();
  });
});

describe("serving", () => {
  it("pins the type and refuses sniffing", () => {
    const headers = fontHeaders("woff2");
    expect(headers["Content-Type"]).toBe("font/woff2");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("types every format it accepts", () => {
    for (const [format, type] of [
      ["woff2", "font/woff2"],
      ["woff", "font/woff"],
      ["truetype", "font/ttf"],
      ["opentype", "font/otf"],
    ] as const) {
      expect(fontHeaders(format)["Content-Type"]).toBe(type);
    }
  });

  it("caches immutably, since the URL carries the digest", () => {
    expect(fontHeaders("woff2")["Cache-Control"]).toContain("immutable");
  });
});
