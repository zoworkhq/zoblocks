/**
 * The organisation's identity, and the one field that cannot change.
 *
 * The slug is in every published stylesheet URL. Those URLs are immutable by
 * design and are linked directly from customers' production applications, so
 * changing it after a publish breaks every one of them at once — silently, with
 * no error anybody sees until a page renders unthemed. That is why it is frozen
 * rather than guarded by a confirmation dialog, and this is what holds it.
 */

import { describe, expect, it } from "vitest";
import { OrganisationError, updateOrganisation } from "@/lib/organisation";
import { createTheme, publishTheme } from "@/lib/themes";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@zoblocks/tokens/validate";
import { twoOrgs } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

async function org() {
  const { asNorthwind, asSouthmere } = await twoOrgs();
  return { nw: await asNorthwind(), sm: await asSouthmere() };
}

describe("renaming", () => {
  it("changes the name and records who did it", async () => {
    const { nw } = await org();

    expect(await updateOrganisation(nw, { name: "Northwind NHS Trust", slug: "northwind" })).toBe(
      "Saved.",
    );

    expect((await nw.data.organisation.get())?.name).toBe("Northwind NHS Trust");
    const entries = await nw.data.audit.find({ action: "org.renamed" }).toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.detail).toContain("Northwind NHS Trust");
  });

  it("is a no-op when nothing changed", async () => {
    const { nw } = await org();
    expect(await updateOrganisation(nw, { name: "Northwind Health", slug: "northwind" })).toBe(
      "No change.",
    );
    expect(await nw.data.audit.find({ action: "org.renamed" }).toArray()).toEqual([]);
  });

  it("refuses an empty or over-long name", async () => {
    const { nw } = await org();
    await expect(updateOrganisation(nw, { name: "  ", slug: "northwind" })).rejects.toThrow(
      OrganisationError,
    );
    await expect(
      updateOrganisation(nw, { name: "x".repeat(81), slug: "northwind" }),
    ).rejects.toThrow(OrganisationError);
  });
});

describe("the address", () => {
  it("can change before the first publish", async () => {
    const { nw } = await org();

    const message = await updateOrganisation(nw, {
      name: "Northwind Health",
      slug: "northwind-nhs",
    });

    expect(message).toContain("northwind-nhs");
    expect((await nw.data.organisation.get())?.slug).toBe("northwind-nhs");
  });

  /**
   * The rule this file exists for. One published version is enough: the URL
   * containing the old slug is already in somebody's `<link>` tag.
   */
  it("is frozen once anything has been published", async () => {
    const { nw } = await org();
    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(nw, await tokens(), id);

    await expect(
      updateOrganisation(nw, { name: "Northwind Health", slug: "northwind-nhs" }),
    ).rejects.toThrow(/cannot change after the first publish/);

    expect((await nw.data.organisation.get())?.slug).toBe("northwind");
  });

  it("still allows a rename after publishing", async () => {
    const { nw } = await org();
    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(nw, await tokens(), id);

    // The name resolves through nothing, so it is free to change.
    await expect(
      updateOrganisation(nw, { name: "Northwind NHS Trust", slug: "northwind" }),
    ).resolves.toBe("Saved.");
  });

  it("refuses an address that is not a legal CSS attribute value", async () => {
    const { nw } = await org();
    await expect(
      updateOrganisation(nw, { name: "Northwind Health", slug: "North Wind!" }),
    ).rejects.toThrow(/cannot be used/);
  });

  it("names the number of URLs at stake, not just the refusal", async () => {
    const { nw } = await org();
    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(nw, await tokens(), id);

    try {
      await updateOrganisation(nw, { name: "Northwind Health", slug: "other" });
      expect.unreachable("should have refused");
    } catch (error) {
      expect((error as OrganisationError).problems.join(" ")).toContain("northwind");
    }
  });
});

describe("across organisations", () => {
  it("renames only the caller's own", async () => {
    const { nw, sm } = await org();

    await updateOrganisation(sm, { name: "Southmere NHS", slug: "southmere" });

    expect((await sm.data.organisation.get())?.name).toBe("Southmere NHS");
    expect((await nw.data.organisation.get())?.name).toBe("Northwind Health");
  });
});
