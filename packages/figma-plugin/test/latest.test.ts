/**
 * Only the newest request may write.
 *
 * The panel fetches a theme when one is chosen. Two picks in quick succession
 * are two requests, and they can land in either order: a slow answer for A
 * arriving after B's used to replace the payload, so Apply sent A while the
 * preview on screen was B's.
 */

import { describe, expect, it } from "vitest";
import { latestOnly } from "../src/ui/latest";

describe("latestOnly", () => {
  it("lets the only request through", () => {
    const requests = latestOnly();
    const a = requests.begin();
    expect(a()).toBe(true);
  });

  it("stales an earlier request once a later one begins", () => {
    const requests = latestOnly();
    const a = requests.begin();
    const b = requests.begin();
    expect(a()).toBe(false);
    expect(b()).toBe(true);
  });

  it("stales everything in flight on cancel", () => {
    const requests = latestOnly();
    const a = requests.begin();
    requests.cancel();
    expect(a()).toBe(false);
  });

  it("keeps two sequences independent", () => {
    const one = latestOnly();
    const two = latestOnly();
    const a = one.begin();
    two.begin();
    expect(a()).toBe(true);
  });
});
