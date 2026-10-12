/**
 * The binary's flags. Serving itself is covered over an in-memory connection
 * in protocol.test.ts; what is left here is everything that must exit
 * without starting a server — and must never print to stdout by accident.
 */

import { describe, expect, it } from "vitest";
import { runStdio } from "../src/stdio.js";

function run(argv: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  return runStdio({
    argv,
    version: "1.2.3",
    out: (l) => out.push(l),
    err: (l) => err.push(l),
  }).then((code) => ({ code, out: out.join("\n"), err: err.join("\n") }));
}

describe("zoblocks-mcp", () => {
  it("prints help", async () => {
    const { code, out } = await run(["--help"]);
    expect(code).toBe(0);
    expect(out).toContain("--registry <url>");
    expect(out).toContain("--offline");
  });

  it("prints its version", async () => {
    const { code, out } = await run(["--version"]);
    expect(code).toBe(0);
    expect(out).toBe("1.2.3");
  });

  it("rejects an unknown flag on stderr, keeping stdout clean for the protocol", async () => {
    const { code, out, err } = await run(["--write"]);
    expect(code).toBe(2);
    expect(out).toBe("");
    expect(err).toContain("--write");
  });
});
