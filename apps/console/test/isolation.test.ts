/**
 * One customer cannot reach another's data.
 *
 * The severe risk in a multi-tenant theme console, and the one that never
 * arrives as a decision: it arrives as `find({ slug })` written in a hurry,
 * which succeeds, returns a document, and reads correctly in review. Mongo has
 * no foreign keys and no row-level security to catch it.
 *
 * So the scoped view is built so that an unscoped query *cannot be expressed*,
 * and these are the tests that hold that true. Every one of them seeds two
 * organisations — a single-tenant fixture cannot fail an isolation test.
 */

import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { scoped } from "@/db/scope";
import { createTheme, publishTheme, saveDraft } from "@/lib/themes";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@oxygenui-design/tokens/validate";
import { twoOrgs, storedTokens } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

describe("reads are scoped", () => {
  it("does not list another organisation's themes", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    await createTheme(nw, { name: "Northwind Clinical", brandColour: "#1d63c9" });

    expect(await nw.data.themes.find().toArray()).toHaveLength(1);
    expect(await sm.data.themes.find().toArray()).toHaveLength(0);
  });

  it("does not find another organisation's theme by its slug", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    expect(await nw.data.themes.findOne({ slug: "clinical" })).not.toBeNull();
    expect(await sm.data.themes.findOne({ slug: "clinical" })).toBeNull();
  });

  it("does not find another organisation's theme by its id", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    // The strongest form: the id is correct and known, and it still returns
    // nothing, because the filter carries an orgId the caller cannot remove.
    expect(await sm.data.themes.findOne({ _id: id })).toBeNull();
  });

  /**
   * The attack this shape defends against: a caller passing an `orgId` of its
   * own — from a URL parameter, a form field, a stale variable. The scope is
   * merged *after* the caller's filter, so theirs is overridden rather than
   * honoured.
   */
  it("ignores an orgId the caller supplies", async () => {
    const { northwind, asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    const smuggled = await sm.data.themes.findOne({ orgId: northwind } as never);
    expect(smuggled).toBeNull();
  });

  it("counts only its own", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    await createTheme(nw, { name: "One", brandColour: "#1d63c9" });
    await createTheme(nw, { name: "Two", brandColour: "#b91c1c" });

    expect(await nw.data.themes.countDocuments()).toBe(2);
    expect(await sm.data.themes.countDocuments()).toBe(0);
  });
});

describe("writes are scoped", () => {
  it("cannot save a draft into another organisation's theme", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    await expect(saveDraft(sm, id, { ref: { brand: { "600": "#000000" } } })).rejects.toThrow(
      "No such theme",
    );

    // And the original is untouched.
    const theme = await nw.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).ref.brand?.["600"]).toBe("#1d63c9");
  });

  it("cannot publish another organisation's theme", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();
    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    await expect(publishTheme(sm, await tokens(), id)).rejects.toThrow("No such theme");
  });

  it("stamps every insert with the caller's own organisation", async () => {
    const { northwind, asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    const raw = await scoped(northwind).themes.findOne({ _id: id });
    expect(raw?.orgId.toHexString()).toBe(northwind.toHexString());
  });

  it("keeps published versions apart", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(nw, await tokens(), id);

    expect(await nw.data.versions.countDocuments()).toBe(1);
    expect(await sm.data.versions.countDocuments()).toBe(0);
    expect(await sm.data.versions.findOne({ themeId: id })).toBeNull();
  });

  it("keeps audit trails apart", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    expect((await nw.data.audit.find().toArray()).length).toBeGreaterThan(0);
    expect(await sm.data.audit.find().toArray()).toEqual([]);
  });
});

describe("the same name in two organisations", () => {
  /**
   * Uniqueness is per organisation, not global. Two customers may both have a
   * theme called `clinical`; the URL is scoped by org slug. A global unique
   * index would make one customer's naming a constraint on another's.
   */
  it("is allowed", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await expect(
      createTheme(sm, { name: "Clinical", brandColour: "#b91c1c" }),
    ).resolves.toMatchObject({ slug: "clinical" });
  });

  it("is refused within one organisation", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();

    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await expect(createTheme(nw, { name: "Clinical", brandColour: "#b91c1c" })).rejects.toThrow(
      "already exists",
    );
  });
});

describe("nothing under src reaches a collection unscoped", () => {
  /**
   * The structural guarantee, asserted rather than trusted. `scope.ts` is the
   * only module allowed to import `db()` directly; the two exceptions it
   * exports are named `unscoped*` and documented individually.
   */
  it("only scope.ts and auth.ts import the raw client", async () => {
    const { execSync } = await import("node:child_process");
    const path = await import("node:path");
    const root = path.resolve(__dirname, "..", "src");

    // Both spellings. A relative `./client` reaches exactly as far as an
    // aliased `@/db/client`, and checking only one form is how the rule ends
    // up enforced against the import style rather than against the access.
    const importers = execSync(
      `grep -rlE 'from "(@/db/client|\\./client|\\.\\./db/client)"' ${JSON.stringify(root)} || true`,
      { encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean)
      .map((f) => path.relative(root, f))
      .sort();

    // Two, and both are deliberate. `scope.ts` is the layer itself; `auth.ts`
    // is the sign-in path, which must find a member before an organisation is
    // known. Anything else is a module that could return the wrong customer's
    // data, so this list is the guarantee.
    expect(importers).toEqual(["db/scope.ts", "lib/auth.ts"]);
  });
});

describe("every accessor on the scoped view is scoped", () => {
  /**
   * Not a coverage exercise. `scope.ts` is the multi-tenant boundary, and the
   * guarantee is not "the accessors we happened to test are scoped" — it is
   * that *none* of them can express an unscoped query. An accessor nobody
   * called is exactly where an unscoped one would survive review, so each is
   * driven here against two organisations and asked to return nothing for the
   * wrong one.
   */
  it("covers reads, writes and counts across every collection", async () => {
    const { northwind, asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();

    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(nw, await tokens(), id);

    /* themes ---------------------------------------------------------- */
    expect(await nw.data.themes.find().toArray()).toHaveLength(1);
    expect(await sm.data.themes.find().toArray()).toHaveLength(0);
    expect(await sm.data.themes.findOne({ _id: id })).toBeNull();
    expect(await sm.data.themes.countDocuments()).toBe(0);

    // An update aimed at another organisation's document matches nothing.
    const blocked = await sm.data.themes.updateOne({ _id: id }, { $set: { name: "Stolen" } });
    expect(blocked.matchedCount).toBe(0);
    expect((await nw.data.themes.findOne({ _id: id }))?.name).toBe("Clinical");

    /* versions -------------------------------------------------------- */
    expect(await nw.data.versions.countDocuments()).toBe(1);
    expect(await sm.data.versions.countDocuments()).toBe(0);
    expect(await sm.data.versions.find().toArray()).toHaveLength(0);
    expect(await sm.data.versions.findOne({ themeId: id })).toBeNull();

    /* members --------------------------------------------------------- */
    // Each org seeded one member through `actingAs`.
    expect(await nw.data.members.countDocuments()).toBe(1);
    expect(await sm.data.members.countDocuments()).toBe(1);
    const nwMember = await nw.data.members.findOne({});
    expect(nwMember).not.toBeNull();
    expect(await sm.data.members.findOne({ _id: nwMember!._id })).toBeNull();
    expect(await nw.data.members.find().toArray()).toHaveLength(1);

    const demoted = await sm.data.members.updateOne(
      { _id: nwMember!._id },
      { $set: { role: "viewer" } },
    );
    expect(demoted.matchedCount, "cannot change another org's member").toBe(0);

    /* audit — append-only, so there is deliberately no update or delete */
    expect((await nw.data.audit.find().toArray()).length).toBeGreaterThan(0);
    expect(await sm.data.audit.find().toArray()).toHaveLength(0);
    await sm.data.audit.insertOne({
      _id: new ObjectId(),
      actorId: new ObjectId(),
      action: "theme.updated",
      subject: "x",
      at: new Date(),
    });
    // Southmere's entry lands in Southmere, not in the shared pile.
    expect(await sm.data.audit.find().toArray()).toHaveLength(1);
    expect(await nw.data.audit.find({ subject: "x" }).toArray()).toHaveLength(0);

    /* organisation ----------------------------------------------------- */
    expect((await nw.data.organisation.get())?.slug).toBe("northwind");
    expect((await sm.data.organisation.get())?.slug).toBe("southmere");

    await sm.data.organisation.updateOne({ $set: { name: "Renamed" } });
    expect((await sm.data.organisation.get())?.name).toBe("Renamed");
    // Northwind is untouched: `organisation.updateOne` is scoped by `_id`.
    expect((await nw.data.organisation.get())?.name).toBe("Northwind Health");
    expect(northwind).toBeDefined();
  });
});
