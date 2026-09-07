/**
 * Create → validate → publish → roll back, against a real database and the
 * real accessibility gate.
 *
 * The assertion that matters most is the negative one: a theme with a failing
 * contrast pair cannot be published by *any* role, including admin. An
 * accessibility floor with an exception is a default, and the only way to know
 * there is no exception is to try every role.
 */

import { describe, expect, it } from "vitest";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@zoblocks/tokens/validate";
import {
  ThemeError,
  checkTheme,
  createTheme,
  publishTheme,
  rollbackTheme,
  saveDraft,
  versionCss,
} from "@/lib/themes";
import { actingAs, seedOrg, storedTokens } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

/** Pale enough that white-on-it fails, so the gate has something to refuse. */
const UNREADABLE = { ref: { brand: { "600": "#cfeee6", "700": "#d6f2ea", "800": "#e0f5ef" } } };

describe("create", () => {
  it("derives a slug and a full ramp from one colour", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id, slug } = await createTheme(auth, {
      name: "Northwind Clinical",
      brandColour: "#1d63c9",
    });

    expect(slug).toBe("northwind-clinical");
    const theme = await auth.data.themes.findOne({ _id: id });
    expect(theme?.status).toBe("draft");
    expect(theme?.liveVersion).toBeNull();
    expect(Object.keys(storedTokens(theme).ref.brand!)).toHaveLength(11);
    expect(storedTokens(theme).ref.brand!["600"]).toBe("#1d63c9");
  });

  it("refuses a colour that is not one", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    await expect(createTheme(auth, { name: "X", brandColour: "teal" })).rejects.toThrow(
      "is not a colour",
    );
  });

  it("refuses a name that reduces to nothing usable", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    await expect(createTheme(auth, { name: "***", brandColour: "#1d63c9" })).rejects.toThrow(
      "does not reduce to a usable name",
    );
  });

  it("records who created it", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    const entries = await auth.data.audit.find().toArray();
    expect(entries[0]).toMatchObject({ action: "theme.created", subject: "clinical" });
  });
});

describe("publish", () => {
  it("writes an immutable version and moves the pointer", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });

    const { version, href } = await publishTheme(auth, await tokens(), id);
    expect(version).toBe(1);
    expect(href).toBe("/t/northwind/clinical@1.css");

    const theme = await auth.data.themes.findOne({ _id: id });
    expect(theme?.status).toBe("published");
    expect(theme?.liveVersion).toBe(1);

    const stored = await auth.data.versions.findOne({ themeId: id, version: 1 });
    expect(stored?.validation.contrastPairs.failed).toBe(0);
  });

  it("increments rather than overwriting", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });

    await publishTheme(auth, await tokens(), id);
    await saveDraft(auth, id, { ref: { brand: { "600": "#b91c1c", "700": "#991b1b" } } });
    const second = await publishTheme(auth, await tokens(), id);

    expect(second.version).toBe(2);
    expect(await auth.data.versions.countDocuments({ themeId: id })).toBe(2);

    // Version 1 is untouched — that is what makes rollback a pointer move and
    // "what was live on the 14th" answerable.
    const first = await auth.data.versions.findOne({ themeId: id, version: 1 });
    expect(storedTokens(first).ref.brand?.["600"]).toBe("#1d63c9");
  });

  /**
   * The load-bearing negative. Tried against every role that can publish at
   * all, because a floor with an exception is a default.
   */
  it("refuses a failing theme, whatever the role", async () => {
    const orgId = await seedOrg("Northwind", "northwind");
    const setup = await actingAs(orgId, "admin");
    const { id } = await createTheme(setup, { name: "Pale", brandColour: "#1d63c9" });
    await saveDraft(setup, id, UNREADABLE);

    for (const role of ["admin", "designer", "developer", "viewer"] as const) {
      const auth = await actingAs(orgId, role);
      await expect(publishTheme(auth, await tokens(), id), role).rejects.toThrow(
        "cannot be published",
      );
    }

    const theme = await setup.data.themes.findOne({ _id: id });
    expect(theme?.status).toBe("draft");
    expect(theme?.liveVersion).toBeNull();
    expect(await setup.data.versions.countDocuments({ themeId: id })).toBe(0);
  });

  it("names the failures, so the message is actionable", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Pale", brandColour: "#1d63c9" });
    await saveDraft(auth, id, UNREADABLE);

    try {
      await publishTheme(auth, await tokens(), id);
      expect.unreachable("should have refused");
    } catch (error) {
      const problems = (error as ThemeError).problems;
      expect(problems.length).toBeGreaterThan(0);
      expect(problems.join("\n")).toMatch(/below the [\d.]+:1 floor/);
    }
  });

  /**
   * Re-validated at publish rather than trusting a stored verdict. A client can
   * be stale, a draft can be edited in another tab, and a validator can be
   * tightened between the check and the publish.
   */
  it("re-validates rather than trusting an earlier pass", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });

    expect((await checkTheme(auth, await tokens(), id)).ok).toBe(true);

    // The draft changes after the check said yes.
    await saveDraft(auth, id, UNREADABLE);
    await expect(publishTheme(auth, await tokens(), id)).rejects.toThrow("cannot be published");
  });
});

describe("rollback", () => {
  it("restores an earlier palette as a new version", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    await saveDraft(auth, id, { ref: { brand: { "600": "#b91c1c", "700": "#991b1b" } } });
    await publishTheme(auth, await tokens(), id);

    const { version } = await rollbackTheme(
      auth,
      await tokens(),
      id,
      1,
      "dark theme surfaces too low contrast in ward lighting",
    );

    // A new version, not a move backwards — the trail stays append-only.
    expect(version).toBe(3);
    const live = await auth.data.versions.findOne({ themeId: id, version: 3 });
    expect(live?.rolledBackFrom).toBe(1);
    expect(storedTokens(live).ref.brand?.["600"]).toBe("#1d63c9");
  });

  it("requires a reason of real length", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    await expect(rollbackTheme(auth, await tokens(), id, 1, "fix")).rejects.toThrow(
      "at least 10 characters",
    );
  });

  it("refuses a version that does not exist", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    await expect(
      rollbackTheme(auth, await tokens(), id, 9, "restoring the palette we had before"),
    ).rejects.toThrow("No version 9");
  });
});

describe("the served stylesheet", () => {
  it("is emitted for a published version", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    const css = await versionCss(auth, id, 1);
    expect(css).toContain("--zb-ref-brand-600: #1d63c9;");
    expect(css).toContain("clinical@1");
  });

  /** Only the palette. A theme cannot redefine what critical means. */
  it("carries no clinical token", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    const css = (await versionCss(auth, id, 1))!;
    expect(css).not.toContain("--zb-status-");
    expect(css).not.toContain("--zb-flag-");
  });

  it("returns nothing for a version that was never published", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    expect(await versionCss(auth, id, 1)).toBeUndefined();
  });
});
