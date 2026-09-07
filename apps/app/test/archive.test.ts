/**
 * Archiving a theme, which is not deleting it.
 *
 * The distinction is the whole feature. A published theme has immutable
 * versions behind it and applications are linking them right now, pinned by
 * URL. Deleting the theme to tidy a list would break every one of those links,
 * so archiving takes the row out of the list and leaves the stylesheets
 * serving.
 *
 * The property that most needs a test is the one nobody would notice breaking:
 * archiving must not unpublish. A version that stops resolving because somebody
 * tidied their theme list is a customer's production styling disappearing for
 * a housekeeping action.
 */

import { describe, expect, it } from "vitest";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@zoblocks/tokens/validate";
import { ThemeError, createTheme, publishTheme, setThemeArchived, versionCss } from "@/lib/themes";
import { twoOrgs } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

const BRAND = { name: "Northwind Clinical", brandColour: "#1d63c9" };

describe("archiving", () => {
  it("takes a theme out of circulation without unpublishing it", async () => {
    const { asNorthwind } = await twoOrgs();
    const auth = await asNorthwind();
    const { id } = await createTheme(auth, BRAND);
    const { version } = await publishTheme(auth, await tokens(), id);

    const servedBefore = await versionCss(auth, id, version);
    expect(servedBefore).toBeTruthy();

    await setThemeArchived(auth, id, true);

    const theme = await auth.data.themes.findOne({ _id: id });
    expect(theme?.status).toBe("archived");

    // The whole point: the published stylesheet is untouched, byte for byte.
    expect(await versionCss(auth, id, version)).toBe(servedBefore);
    expect(theme?.liveVersion).toBe(version);
  });

  /**
   * Restoring reads the status back off `liveVersion` rather than remembering
   * what it was. The two are the same fact stated twice, and a remembered value
   * is how they come to disagree after a round trip.
   */
  it("restores a published theme to published, and a draft to draft", async () => {
    const { asNorthwind } = await twoOrgs();
    const auth = await asNorthwind();

    const draft = await createTheme(auth, { ...BRAND, name: "Never Published" });
    await setThemeArchived(auth, draft.id, true);
    await setThemeArchived(auth, draft.id, false);
    expect((await auth.data.themes.findOne({ _id: draft.id }))?.status).toBe("draft");

    const live = await createTheme(auth, { ...BRAND, name: "Has Shipped" });
    await publishTheme(auth, await tokens(), live.id);
    await setThemeArchived(auth, live.id, true);
    await setThemeArchived(auth, live.id, false);
    expect((await auth.data.themes.findOne({ _id: live.id }))?.status).toBe("published");
  });

  it("refuses to archive twice, or to restore something that is not archived", async () => {
    const { asNorthwind } = await twoOrgs();
    const auth = await asNorthwind();
    const { id } = await createTheme(auth, BRAND);

    await expect(setThemeArchived(auth, id, false)).rejects.toThrow(ThemeError);
    await setThemeArchived(auth, id, true);
    await expect(setThemeArchived(auth, id, true)).rejects.toThrow(ThemeError);
  });

  it("records who did it, and what changed", async () => {
    const { asNorthwind } = await twoOrgs();
    const auth = await asNorthwind();
    const { id } = await createTheme(auth, BRAND);

    await setThemeArchived(auth, id, true);

    // `find`, because the scoped audit exposes only `find` and `insertOne` —
    // it is append-only by construction, which is the property that makes it
    // worth having at all.
    const [entry] = await auth.data.audit.find({ action: "theme.archived" }).toArray();
    expect(entry).toBeDefined();
    expect(entry!.actorId.toHexString()).toBe(auth.member.id);
    expect(entry!.detail).toBe("draft → archived");
  });

  /** Tenant isolation is structural everywhere else; it has to hold here too. */
  it("cannot archive another organisation's theme", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();
    const { id } = await createTheme(nw, BRAND);

    await expect(setThemeArchived(sm, id, true)).rejects.toThrow(ThemeError);
    expect((await nw.data.themes.findOne({ _id: id }))?.status).toBe("draft");
  });
});
