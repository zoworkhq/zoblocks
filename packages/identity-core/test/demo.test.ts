import { describe, expect, it } from "vitest";
import { substituteForDemo } from "../src/demo.js";
import { policy, resolveIdentity } from "../src/resolve.js";
import * as F from "./fixtures.js";

const P = policy({ now: F.NOW });
const DEMO = policy({ now: F.NOW, demoMode: true, photos: "allow" });

describe("substituteForDemo", () => {
  it("replaces the name", () => {
    const out = substituteForDemo(F.patient(), "pat-4471");
    expect(out.name?.[0]?.family).not.toBe("Okonkwo");
    expect(out.name?.[0]?.given?.[0]).not.toBe("Amara");
  });

  it("is deterministic — the same record is the same fake person everywhere", () => {
    const a = substituteForDemo(F.patient(), "pat-4471");
    const b = substituteForDemo(F.patient(), "pat-4471");
    expect(a.name?.[0]?.family).toBe(b.name?.[0]?.family);
    expect(a.identifier?.[0]?.value).toBe(b.identifier?.[0]?.value);
  });

  it("gives different records different people", () => {
    const a = substituteForDemo(F.patient(), "pat-4471");
    const b = substituteForDemo(F.patient(), "pat-9038");
    expect(a.name?.[0]?.family).not.toBe(b.name?.[0]?.family);
  });

  it("preserves the mononym shape", () => {
    const out = substituteForDemo(F.mononym, "pat-5150");
    expect(out.name?.[0]?.family).toBeUndefined();
  });

  it("preserves identifier length so layout does not change", () => {
    const out = substituteForDemo(F.patient(), "pat-4471");
    expect(out.identifier?.[0]?.value).toHaveLength(9);
    expect(out.identifier?.[0]?.value).not.toBe("123456789");
  });

  it("preserves the recorded date precision", () => {
    expect(substituteForDemo(F.patient({ birthDate: "1985" }), "k").birthDate).toHaveLength(4);
    expect(substituteForDemo(F.patient({ birthDate: "1985-03" }), "k").birthDate).toHaveLength(7);
    expect(substituteForDemo(F.patient({ birthDate: "1985-03-08" }), "k").birthDate).toHaveLength(
      10,
    );
  });

  it("shifts the birth date without moving it far", () => {
    const out = substituteForDemo(F.patient(), "pat-4471");
    const shifted = Date.parse(`${out.birthDate}T00:00:00Z`);
    const original = Date.parse("1985-03-08T00:00:00Z");
    expect(Math.abs(shifted - original)).toBeLessThanOrEqual(31 * 86_400_000);
    expect(out.birthDate).not.toBe("1985-03-08");
  });

  it("drops the photograph — a demo is exactly where a real face ends up in a slide deck", () => {
    expect(substituteForDemo(F.withPhoto, "pat-4471").photo).toBeUndefined();
    expect(resolveIdentity(F.withPhoto, DEMO).photo.kind).toBe("none-on-file");
  });

  it("passes security labels and state flags through untouched — those are what the demo shows", () => {
    const out = substituteForDemo(F.sensitive, "pat-7710");
    expect(out.meta?.security?.map((s) => s.code).sort()).toEqual(["ETH", "PSY"]);
    const dead = substituteForDemo(F.deceased, "pat-2001");
    expect(dead.deceasedDateTime).toBe("2024-03-12");
  });

  it("does not mutate the source record", () => {
    const p = F.patient();
    const before = JSON.stringify(p);
    substituteForDemo(p, "pat-4471");
    expect(JSON.stringify(p)).toBe(before);
  });

  it("keeps the swatch, so a collision in real data is still a collision in the demo", () => {
    // The point of keying off the real id: the shape of the data survives.
    const real = resolveIdentity(F.patient(), P);
    const demo = resolveIdentity(F.patient(), DEMO);
    expect(demo.swatch).toBe(real.swatch);
    expect(demo.key).toBe(real.key);
  });

  it("survives a record with nothing in it", () => {
    const out = substituteForDemo({}, "k");
    expect(out.name?.[0]?.given?.[0]).toBeTruthy();
    expect(out.identifier).toEqual([]);
  });
});
