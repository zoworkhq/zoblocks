/**
 * Brand artwork, and the reason it is checked at all.
 *
 * Almost every assertion here is about one thing: an SVG is a document, not a
 * picture. Hosting a customer's SVG on the app's own origin means whatever
 * that file contains runs with the app's privileges — so a logo upload is
 * a stored-XSS vector wearing a file picker, and the refusals below are the
 * only thing between the two.
 *
 * The size limit and the format sniffing are ordinary. The `DANGEROUS` list is
 * the part that has to be right, and it is tested per rule rather than in
 * aggregate, so a regression names which door was left open.
 */

import { describe, expect, it } from "vitest";
import { MAX_LOGO_BYTES, checkLogo, logoHeaders } from "../src/logo";

const enc = (s: string) => new TextEncoder().encode(s);

const PLAIN_SVG = enc(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
);

/** Real magic numbers, so the sniffing is exercised rather than mocked. */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

describe("what is accepted", () => {
  it("takes plain vector artwork and content-addresses it", () => {
    const result = checkLogo(PLAIN_SVG);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.format).toBe("svg");
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.bytes).toBe(PLAIN_SVG.byteLength);
  });

  it("identifies raster formats by their bytes, not their name", () => {
    expect(checkLogo(PNG)).toMatchObject({ ok: true, format: "png" });
    expect(checkLogo(JPEG)).toMatchObject({ ok: true, format: "jpeg" });
  });

  it("gives identical bytes an identical address", () => {
    const a = checkLogo(PLAIN_SVG);
    const b = checkLogo(new Uint8Array(PLAIN_SVG));
    expect(a.ok && b.ok && a.sha256 === b.sha256).toBe(true);
  });
});

describe("what is refused, and why it must be", () => {
  /**
   * One case per rule. In aggregate these would pass with a single rule doing
   * all the work, and the failure mode of a security list is exactly that:
   * somebody narrows one pattern and the suite stays green.
   */
  const attacks: readonly [name: string, svg: string][] = [
    ["a script element", '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    [
      "a cased script element",
      '<svg xmlns="http://www.w3.org/2000/svg"><ScRiPt>alert(1)</ScRiPt></svg>',
    ],
    ["an onload handler", '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'],
    [
      "an onerror handler",
      '<svg xmlns="http://www.w3.org/2000/svg"><image onerror="alert(1)"/></svg>',
    ],
    [
      "a foreignObject",
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body>hi</body></foreignObject></svg>',
    ],
    ["an iframe", '<svg xmlns="http://www.w3.org/2000/svg"><iframe src="/"></iframe></svg>'],
    [
      "a javascript: link",
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect/></a></svg>',
    ],
    [
      "a remote use reference",
      '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://evil.example/x.svg#a"/></svg>',
    ],
    [
      "an entity declaration",
      '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg">&x;</svg>',
    ],
  ];

  for (const [what, svg] of attacks) {
    it(`refuses an SVG carrying ${what}`, () => {
      const result = checkLogo(enc(svg));
      expect(result.ok, what).toBe(false);
      // The refusal names what was found: "invalid file" sends a designer
      // back to the same export settings that produced it.
      if (!result.ok) expect(result.reason).toMatch(/cannot be hosted/);
    });
  }

  it("refuses a file that is not artwork at all", () => {
    const result = checkLogo(enc("just some text"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toMatch(/renaming it will not help/);
  });

  it("refuses an empty file", () => {
    expect(checkLogo(new Uint8Array(0))).toMatchObject({ ok: false });
  });

  it("refuses anything over the size limit", () => {
    const huge = new Uint8Array(MAX_LOGO_BYTES + 1);
    huge.set(PNG);
    expect(checkLogo(huge)).toMatchObject({ ok: false });
  });
});

describe("how it is served", () => {
  /**
   * Belt and braces over the refusal. A single check that has to be right
   * forever is a check that will eventually be wrong, so the browser is also
   * told this document may not execute or fetch anything.
   */
  it("serves artwork sandboxed and unable to reach the network", () => {
    const headers = logoHeaders("svg");
    expect(headers["Content-Security-Policy"]).toContain("default-src 'none'");
    expect(headers["Content-Security-Policy"]).toContain("sandbox");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("is immutable, because the URL carries the digest", () => {
    expect(logoHeaders("png")["Cache-Control"]).toContain("immutable");
    expect(logoHeaders("png")["Content-Type"]).toBe("image/png");
  });
});
