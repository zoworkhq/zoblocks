/**
 * The change gate.
 *
 * The interesting cases are the ones a clinical surface actually hits: a guard
 * that asks a human and takes time, a second request arriving while the first
 * is unanswered, and a guard that throws. Getting the last one wrong discards
 * an unsigned note because someone's confirm dialog had a bug.
 */

import { describe, expect, it, vi } from "vitest";
import {
  canEnterStep,
  createChangeGate,
  indexOfValue,
  initialValue,
  type TabItem,
} from "../src/index.js";

const items: TabItem[] = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
  { value: "c", label: "C" },
];

function gateWith(onBeforeChange?: Parameters<typeof createChangeGate>[0]["onBeforeChange"]) {
  const commits: Array<[string, string]> = [];
  const pending: boolean[] = [];
  const gate = createChangeGate({
    onBeforeChange,
    onCommit: (value, source) => commits.push([value, source]),
    onPendingChange: (next) => pending.push(next),
  });
  return { gate, commits, pending };
}

describe("createChangeGate — no guard", () => {
  it("commits immediately", async () => {
    const { gate, commits } = gateWith();
    await expect(gate.request("a", "pointer")).resolves.toMatchObject({ status: "committed" });
    expect(commits).toEqual([["a", "pointer"]]);
  });

  it("refuses a no-op so a re-click does not re-fire onChange", async () => {
    const { gate, commits } = gateWith();
    gate.sync("a");
    await expect(gate.request("a", "pointer")).resolves.toMatchObject({
      status: "blocked",
      reason: "same",
    });
    expect(commits).toEqual([]);
  });

  it("refuses a disabled item — aria-disabled is still clickable by design", async () => {
    const { gate, commits } = gateWith();
    const outcome = await gate.request("b", "pointer", {
      value: "b",
      disabled: true,
      disabledReason: "Restricted",
    });
    expect(outcome).toMatchObject({ status: "blocked", reason: "disabled" });
    expect(commits).toEqual([]);
  });

  it("refuses an unavailable item", async () => {
    const { gate } = gateWith();
    await expect(
      gate.request("b", "pointer", { value: "b", availability: "unavailable" }),
    ).resolves.toMatchObject({ status: "blocked", reason: "unavailable" });
  });
});

describe("createChangeGate — synchronous guard", () => {
  it("commits when the guard allows", async () => {
    const { gate, commits } = gateWith(() => true);
    await expect(gate.request("a", "keyboard")).resolves.toMatchObject({ status: "committed" });
    expect(commits).toEqual([["a", "keyboard"]]);
  });

  it("vetoes without committing", async () => {
    const { gate, commits } = gateWith(() => false);
    await expect(gate.request("a", "keyboard")).resolves.toMatchObject({ status: "vetoed" });
    expect(commits).toEqual([]);
  });

  it("passes the previous value to the guard", async () => {
    const guard = vi.fn(() => true);
    const { gate } = gateWith(guard);
    gate.sync("a");
    await gate.request("b", "pointer");
    expect(guard).toHaveBeenCalledWith("b", "a");
  });

  it("never goes pending for a synchronous answer", async () => {
    const { gate, pending } = gateWith(() => true);
    await gate.request("a", "pointer");
    expect(pending).toEqual([]);
  });

  it("treats a throwing guard as a refusal rather than a pass", async () => {
    const { gate, commits } = gateWith(() => {
      throw new Error("confirm dialog blew up");
    });
    await expect(gate.request("a", "pointer")).resolves.toMatchObject({ status: "vetoed" });
    expect(commits).toEqual([]);
  });
});

describe("createChangeGate — asynchronous guard", () => {
  it("goes pending, then commits", async () => {
    let resolve!: (value: boolean) => void;
    const { gate, commits, pending } = gateWith(() => new Promise<boolean>((r) => (resolve = r)));
    const request = gate.request("a", "pointer");
    // The strip is inert while a human is being asked — the one case where an
    // unresponsive tab is correct.
    expect(pending).toEqual([true]);
    resolve(true);
    await expect(request).resolves.toMatchObject({ status: "committed" });
    expect(pending).toEqual([true, false]);
    expect(commits).toEqual([["a", "pointer"]]);
  });

  it("goes pending, then vetoes", async () => {
    const { gate, commits, pending } = gateWith(() => Promise.resolve(false));
    await expect(gate.request("a", "pointer")).resolves.toMatchObject({ status: "vetoed" });
    expect(pending).toEqual([true, false]);
    expect(commits).toEqual([]);
  });

  it("treats a rejected promise as a refusal", async () => {
    const { gate, commits } = gateWith(() => Promise.reject(new Error("network")));
    await expect(gate.request("a", "pointer")).resolves.toMatchObject({ status: "vetoed" });
    expect(commits).toEqual([]);
  });

  it("supersedes rather than queues, so answering about B does not land on C", async () => {
    let resolveFirst!: (value: boolean) => void;
    let calls = 0;
    const { gate, commits } = gateWith(() => {
      calls += 1;
      if (calls === 1) return new Promise<boolean>((r) => (resolveFirst = r));
      return Promise.resolve(true);
    });

    const first = gate.request("b", "pointer");
    const second = gate.request("c", "pointer");
    await expect(second).resolves.toMatchObject({ status: "committed", value: "c" });

    resolveFirst(true);
    await expect(first).resolves.toMatchObject({ status: "superseded", value: "b" });
    // Only C was committed. B, whose dialog was answered late, is discarded.
    expect(commits).toEqual([["c", "pointer"]]);
  });

  it("invalidates an in-flight request when disposed", async () => {
    let resolve!: (value: boolean) => void;
    const { gate, commits } = gateWith(() => new Promise<boolean>((r) => (resolve = r)));
    const request = gate.request("a", "pointer");
    gate.dispose();
    resolve(true);
    await expect(request).resolves.toMatchObject({ status: "superseded" });
    expect(commits).toEqual([]);
  });

  it("refuses new requests once disposed", async () => {
    const { gate } = gateWith();
    gate.dispose();
    await expect(gate.request("a", "pointer")).resolves.toMatchObject({ status: "superseded" });
  });

  it("reports pending through the getter as well as the callback", async () => {
    let resolve!: (value: boolean) => void;
    const { gate } = gateWith(() => new Promise<boolean>((r) => (resolve = r)));
    const request = gate.request("a", "pointer");
    expect(gate.pending).toBe(true);
    resolve(false);
    await request;
    expect(gate.pending).toBe(false);
  });
});

describe("indexOfValue", () => {
  it("finds an item", () => {
    expect(indexOfValue(items, "b")).toBe(1);
  });

  it("returns -1 for a miss or for undefined", () => {
    expect(indexOfValue(items, "zzz")).toBe(-1);
    expect(indexOfValue(items, undefined)).toBe(-1);
  });
});

describe("initialValue", () => {
  it("honours a valid default", () => {
    expect(initialValue(items, "c")).toBe("c");
  });

  it("ignores a default that is not in the list", () => {
    expect(initialValue(items, "zzz")).toBe("a");
  });

  it("skips a disabled first item — an empty panel with no keyboard fix is worse", () => {
    const withDisabledFirst: TabItem[] = [
      { value: "a", label: "A", disabled: true, disabledReason: "Restricted" },
      { value: "b", label: "B" },
    ];
    expect(initialValue(withDisabledFirst, undefined)).toBe("b");
  });

  it("falls back to the first item when every item is disabled", () => {
    const allDisabled: TabItem[] = [
      { value: "a", label: "A", disabled: true, disabledReason: "x" },
      { value: "b", label: "B", disabled: true, disabledReason: "x" },
    ];
    expect(initialValue(allDisabled, undefined)).toBe("a");
  });

  it("returns undefined for an empty list", () => {
    expect(initialValue([], undefined)).toBeUndefined();
  });
});

describe("canEnterStep", () => {
  const steps: TabItem[] = [
    { value: "1", state: "done" },
    { value: "2", state: "current" },
    { value: "3", state: "locked" },
  ];

  it("always allows going backwards — locking completed steps forces a restart to fix a typo", () => {
    expect(canEnterStep(steps, 2, 0)).toBe(true);
    expect(canEnterStep(steps, 1, 1)).toBe(true);
  });

  it("blocks a locked step ahead", () => {
    expect(canEnterStep(steps, 1, 2)).toBe(false);
  });

  it("blocks a disabled step ahead", () => {
    const withDisabled: TabItem[] = [
      { value: "1" },
      { value: "2", disabled: true, disabledReason: "Complete step 1 first" },
    ];
    expect(canEnterStep(withDisabled, 0, 1)).toBe(false);
  });

  it("allows an unlocked step ahead", () => {
    expect(canEnterStep([{ value: "1" }, { value: "2" }], 0, 1)).toBe(true);
  });

  it("refuses an index that does not exist", () => {
    expect(canEnterStep(steps, 0, 9)).toBe(false);
  });
});

describe("re-entrant requests", () => {
  it("supersedes when the guard itself requests another change", async () => {
    // A guard that navigates — "you cannot open Labs, here is Summary
    // instead" — is a real pattern, and the first request must not land after
    // the second has already committed.
    const commits: string[] = [];
    let gate: ReturnType<typeof createChangeGate>;
    gate = createChangeGate({
      onBeforeChange: (next) => {
        if (next === "b") void gate.request("c", "programmatic");
        return true;
      },
      onCommit: (value) => commits.push(value),
    });

    const first = await gate.request("b", "pointer");
    expect(first).toMatchObject({ status: "superseded", value: "b" });
    // Only the redirect committed; the request it replaced did not.
    expect(commits).toEqual(["c"]);
  });
});
