/**
 * The manifest, which carries everything a stylesheet cannot.
 *
 * Its whole reason to exist is the four things CSS drops: the alternative text
 * for a mark a host renders as a real `<img>`, the assets CSS never draws, URLs
 * that survive being pasted into an email, and the measured size that stops the
 * header reflowing. Each of those is a separate way for this to be quietly
 * useless, so each gets an assertion.
 */

import { describe, expect, it } from "vitest";
import { brandManifest } from "../src/manifest";
import { publishedTheme } from "./fixture";

const WHERE = { origin: "https://app.zoblocks.design", orgSlug: "northwind" };

const asset = (role: string, over: Record<string, unknown> = {}) => ({
  role,
  sha256: "a".repeat(64),
  format: "svg" as const,
  src: `/f/northwind/${"a".repeat(64)}.svg`,
  alt: "Northwind Health",
  uploadedAt: "2026-08-20T00:00:00.000Z",
  ...over,
});

function withAssets(brand: ReturnType<typeof asset>[]) {
  const theme = publishedTheme();
  theme.assets.brand = brand as typeof theme.assets.brand;
  return theme;
}

describe("what a host is given", () => {
  it("names the stylesheet it belongs with, at the same version", () => {
    const manifest = brandManifest(publishedTheme(), WHERE);
    expect(manifest.stylesheet).toBe(
      `https://app.zoblocks.design/t/northwind/northwind-clinical@${manifest.version}.css`,
    );
  });

  /**
   * Absolute, always.
   *
   * A relative `/f/…` resolves against the *host's* origin, which is not where
   * the artwork lives. It is fine inside the app and useless in an email
   * that Outlook renders three days later — and the failure is a broken image
   * where a hospital's name should be.
   */
  it("makes every URL absolute", () => {
    const manifest = brandManifest(withAssets([asset("mark-light")]), WHERE);
    expect(manifest.assets[0]?.href).toBe(
      `https://app.zoblocks.design/f/northwind/${"a".repeat(64)}.svg`,
    );
  });

  it("does not double the slash when the origin carries one", () => {
    const manifest = brandManifest(withAssets([asset("mark-light")]), {
      ...WHERE,
      origin: "https://app.zoblocks.design/",
    });
    expect(manifest.assets[0]?.href).not.toContain("//f/");
  });

  it("leaves an already-absolute source alone", () => {
    const manifest = brandManifest(
      withAssets([asset("mark-light", { src: "https://cdn.example.test/mark.svg" })]),
      WHERE,
    );
    expect(manifest.assets[0]?.href).toBe("https://cdn.example.test/mark.svg");
  });

  /**
   * The alternative text is the reason this file exists rather than the
   * stylesheet being enough. A mark placed with `background-image` announces
   * nothing, so a host rendering a real `<img>` has to get the words from
   * somewhere, and the somewhere has to be the theme — or the alt text stops
   * being reviewed alongside the artwork it describes.
   */
  it("carries the alternative text, empty included", () => {
    const manifest = brandManifest(
      withAssets([asset("mark-light", { alt: "" }), asset("favicon", { alt: "Northwind" })]),
      WHERE,
    );
    expect(manifest.assets.map((a) => a.alt)).toEqual(["", "Northwind"]);
  });

  it("carries the measured size when there is one, and omits it when there is not", () => {
    const manifest = brandManifest(
      withAssets([asset("mark-light", { width: 320, height: 80 }), asset("favicon")]),
      WHERE,
    );
    expect(manifest.assets[0]).toMatchObject({ width: 320, height: 80 });
    expect(manifest.assets[1]).not.toHaveProperty("width");
  });

  it("says where each asset is meant to go", () => {
    const manifest = brandManifest(withAssets([asset("favicon")]), WHERE);
    expect(manifest.assets[0]?.usage).toContain("link rel=icon");
  });
});

describe("the shape is stable", () => {
  /**
   * Registry order, not upload order.
   *
   * Two publishes of the same theme must produce the same file, or a diff of
   * two manifests is a diff in whichever order somebody happened to drag files
   * in rather than a diff in content.
   */
  it("orders by the registry rather than by when things were uploaded", () => {
    const manifest = brandManifest(
      withAssets([asset("email"), asset("favicon"), asset("mark-light")]),
      WHERE,
    );
    expect(manifest.assets.map((a) => a.role)).toEqual(["mark-light", "favicon", "email"]);
  });

  it("is empty rather than absent when a theme carries no artwork", () => {
    const manifest = brandManifest(publishedTheme(), WHERE);
    expect(manifest.assets).toEqual([]);
  });

  it("identifies the theme it describes", () => {
    const manifest = brandManifest(publishedTheme(), WHERE);
    expect(manifest.slug).toBe("northwind-clinical");
    expect(manifest.name).toBe("Northwind Clinical");
  });
});
