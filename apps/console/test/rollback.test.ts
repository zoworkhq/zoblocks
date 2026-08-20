/**
 * Restoring an earlier version.
 *
 * A rollback is a *forward* move: it publishes the old palette as a new version
 * rather than rewinding a pointer. That is what keeps every version immutable
 * and keeps "what was live on the 14th" answerable — the property the whole
 * versioning design exists for, and the one a pointer rewind would destroy.
 */

import { describe, expect, it } from "vitest";
import { emptyAssets, VALIDATOR_VERSION } from "@oxygenui-design/theme";
import { ThemeError, createTheme, publishTheme, rollbackTheme, saveOverrides } from "@/lib/themes";
import { uploadFont } from "@/lib/fonts";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@oxygenui-design/tokens/validate";
import { twoOrgs, storedTokens } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

function woff2(): Uint8Array {
  const bytes = new Uint8Array(2048);
  bytes.set([0x77, 0x4f, 0x46, 0x32]);
  return bytes;
}

/** Two published versions, differing in one semantic override. */
async function twoVersions() {
  const { asNorthwind, asSouthmere } = await twoOrgs();
  const nw = await asNorthwind();
  const sm = await asSouthmere();
  const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

  const first = await publishTheme(nw, await tokens(), id);
  await saveOverrides(nw, await tokens(), id, { semantic: { light: { accent: "#0b5aa8" } } });
  const second = await publishTheme(nw, await tokens(), id);

  return { nw, sm, id, first: first.version, second: second.version };
}

describe("rollback", () => {
  it("publishes the old palette as a new version rather than moving a pointer", async () => {
    const { nw, id, first, second } = await twoVersions();

    const { version } = await rollbackTheme(
      nw,
      await tokens(),
      id,
      first,
      "Accent regressed on the dark ground",
    );

    expect(version).toBe(second + 1);
    // Every earlier version is still there, unchanged.
    expect(await nw.data.versions.countDocuments()).toBe(3);
    expect((await nw.data.themes.findOne({ _id: id }))?.liveVersion).toBe(version);
  });

  it("restores the tokens the target carried", async () => {
    const { nw, id, first } = await twoVersions();

    await rollbackTheme(nw, await tokens(), id, first, "Restoring the original accent");

    const theme = await nw.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).semantic.light["accent"]).toBeUndefined();
  });

  it("restores the fonts too, not only the colours", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    await uploadFont(nw, id, { bytes: woff2(), filename: "a.woff2", family: "Original Sans" });
    const { version: withFont } = await publishTheme(nw, await tokens(), id);

    // A later publish with the face removed.
    await nw.data.themes.updateOne({ _id: id }, { $set: { assets: emptyAssets() } });
    await publishTheme(nw, await tokens(), id);

    await rollbackTheme(nw, await tokens(), id, withFont, "Put the typeface back");

    const theme = await nw.data.themes.findOne({ _id: id });
    expect(theme?.assets?.fonts.map((face) => face.family)).toEqual(["Original Sans"]);
  });

  /**
   * A reason of substance, enforced on the server.
   *
   * "fix" is not a reason. A rollback with none is unreadable a year later by
   * whoever has to explain it, and this trail is the thing a regulator reads.
   */
  it("refuses a reason shorter than ten characters", async () => {
    const { nw, id, first } = await twoVersions();

    await expect(rollbackTheme(nw, await tokens(), id, first, "fix")).rejects.toThrow(ThemeError);
    expect(await nw.data.versions.countDocuments()).toBe(2);
  });

  it("refuses a version that does not exist", async () => {
    const { nw, id } = await twoVersions();
    await expect(
      rollbackTheme(nw, await tokens(), id, 99, "Restoring a version that is not there"),
    ).rejects.toThrow(/No version 99/);
  });

  it("records the restore and its reason on the version and the trail", async () => {
    const { nw, id, first } = await twoVersions();
    const reason = "Accent regressed on the dark ground";

    const { version } = await rollbackTheme(nw, await tokens(), id, first, reason);

    const created = await nw.data.versions.findOne({ version });
    expect(created?.rolledBackFrom).toBe(first);
    expect(created?.reason).toBe(reason);
    expect(created?.validation.validatorVersion).toBe(VALIDATOR_VERSION);

    const entries = await nw.data.audit.find({ action: "theme.rolledback" }).toArray();
    expect(entries[0]?.detail).toContain(reason);
  });

  it("cannot restore another organisation's theme", async () => {
    const { sm, id, first } = await twoVersions();
    await expect(
      rollbackTheme(sm, await tokens(), id, first, "Trying to reach across the boundary"),
    ).rejects.toThrow("No such theme");
  });
});
