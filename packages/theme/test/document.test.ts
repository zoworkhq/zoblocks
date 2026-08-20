/**
 * The stored document, and the invariants a database cannot enforce.
 */

import { describe, expect, it } from "vitest";
import { hexSchema, slugSchema, themeDocumentSchema } from "../src/index";
import { publishedTheme } from "./fixture";

const parse = (t: unknown) => themeDocumentSchema.safeParse(t);
const errors = (t: unknown) =>
  parse(t)
    .error?.issues.map((i) => i.message)
    .join("\n") ?? "";

describe("hex values", () => {
  it("accepts six and three digits", () => {
    expect(hexSchema.safeParse("#1d63c9").success).toBe(true);
    expect(hexSchema.safeParse("#abc").success).toBe(true);
  });

  /**
   * The same refusal the token gate makes, for the same reason: a ratio
   * against an unknown backdrop is not a number we can honestly compute.
   */
  it("refuses eight digits rather than dropping the alpha channel", () => {
    const result = hexSchema.safeParse("#1d63c980");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("Eight digits carry alpha");
  });

  it("refuses anything that is not a hex colour", () => {
    for (const bad of ["red", "rgb(0,0,0)", "var(--x)", "#12345"]) {
      expect(hexSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe("slugs", () => {
  it("accepts kebab-case", () => {
    expect(slugSchema.safeParse("northwind-clinical").success).toBe(true);
  });

  /** It becomes a CSS attribute selector and part of a URL. */
  it("refuses anything that is not", () => {
    for (const bad of ["Northwind", "north wind", "north_wind", "north--wind", "-nw", ""]) {
      expect(slugSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe("the document", () => {
  it("accepts a well-formed published theme", () => {
    expect(parse(publishedTheme()).success).toBe(true);
  });

  /**
   * A published theme with no validation record is a theme nothing ever
   * checked, which is the failure this whole system exists to prevent.
   */
  it("refuses a published theme with no validation record", () => {
    const theme = publishedTheme();
    delete (theme as { validation?: unknown }).validation;
    expect(errors(theme)).toContain("must carry the validation record");
  });

  it("refuses a published theme with a failing pair", () => {
    const theme = publishedTheme();
    theme.validation!.contrastPairs.failed = 2;
    expect(errors(theme)).toContain("cannot publish with 2 failing contrast pair(s)");
  });

  it("allows a draft to be unvalidated — that is what a draft is", () => {
    const theme = publishedTheme({ status: "draft" });
    delete (theme as { validation?: unknown }).validation;
    expect(parse(theme).success).toBe(true);
  });

  it("requires a publish to be attributable", () => {
    const theme = publishedTheme();
    delete theme.audit.publishedBy;
    expect(errors(theme)).toContain("attributable");
  });

  /** A rollback with no reason is unreadable a year later. */
  it("requires a rollback reason of real length", () => {
    const theme = publishedTheme();
    theme.audit.reason = "fix";
    expect(parse(theme).success).toBe(false);
  });

  it("accepts a real rollback reason", () => {
    const theme = publishedTheme();
    theme.audit.reason = "dark theme surfaces too low contrast in ward lighting";
    expect(parse(theme).success).toBe(true);
  });

  it("refuses a version below one", () => {
    expect(parse(publishedTheme({ version: 0 })).success).toBe(false);
  });

  it("refuses a token value that is not a colour", () => {
    const theme = publishedTheme();
    theme.tokens.ref.brand = { "600": "red; }" };
    expect(parse(theme).success).toBe(false);
  });
});
