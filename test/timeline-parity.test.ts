/**
 * Our Timeline is Ant Design's Timeline, and antd is the one that moves.
 *
 * ADR 0010's rule for a primitive is "match Ant Design's public API exactly and
 * take no dependency on it". The second half is easy and permanent; the first
 * half decays silently the moment antd ships a rename, and the failure surfaces
 * in a customer's build rather than ours.
 *
 * So this reads antd's own type declarations out of the installed package and
 * holds our surface against them. It is the same discipline `switch-parity`
 * applies across our two channels, pointed outward.
 *
 * It also pins the one place where antd's documentation and antd's source
 * disagree. The docs table gives `mode` a default of `end`; the 6.6.0 source
 * falls back to `'start'`. We follow the source, and if a future antd changes
 * that fallback this test says so rather than a user noticing their timeline
 * moved.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * antd is not a root dependency — it is a peer of the packages that skin it —
 * so it is resolved through one of those rather than imported here.
 *
 * Resolved with Node's own resolver rather than by listing `node_modules/.pnpm`
 * and taking the newest `antd@*`. The listing version worked, then failed once
 * immediately after `pnpm install --frozen-lockfile`, and could not be
 * reproduced in fifteen runs after that — which is the signature of reading a
 * directory a package manager is in the middle of relinking. A test that
 * depends on the store's layout depends on install timing, and a flake nobody
 * can reproduce is a test the team learns to re-run instead of read.
 */
function findAntd(): string {
  const fromTabs = createRequire(path.join(ROOT, "packages", "tabs", "package.json"));
  try {
    return path.dirname(fromTabs.resolve("antd/package.json"));
  } catch {
    // The store, as a fallback only, and still a hard failure if antd is not
    // there: ADR 0010's parity claim cannot be checked without it.
    const store = path.join(ROOT, "node_modules", ".pnpm");
    const entry = readdirSync(store)
      .filter((name) => name.startsWith("antd@"))
      .sort()
      .at(-1);
    expect(
      entry,
      "antd is not installed. The parity claim in ADR 0010 cannot be checked without it, so this is a failure rather than a skip.",
    ).toBeDefined();
    return path.join(store, entry as string, "node_modules", "antd");
  }
}

const ANTD = findAntd();
const antdTimeline = path.join(ANTD, "es", "timeline");

const read = (file: string) => readFileSync(file, "utf8");

/** Top-level property names of a declared interface, in source order. */
function propsOf(source: string, declaration: string): Set<string> {
  const start = source.indexOf(declaration);
  expect(start, `${declaration} not found — has antd renamed it?`).toBeGreaterThan(-1);
  const open = source.indexOf("{", start);

  let depth = 0;
  let end = open;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }

  const body = source.slice(open + 1, end);
  const names = new Set<string>();
  // Only lines at nesting depth 1 are the interface's own members; anything
  // deeper belongs to an inline object type.
  let nesting = 0;
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (nesting === 0) {
      const match = /^(?:readonly\s+)?['"]?([A-Za-z_$][\w$-]*)['"]?\??\s*:/.exec(trimmed);
      if (match?.[1]) names.add(match[1]);
    }
    nesting += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
  }
  return names;
}

const antdSource = read(path.join(antdTimeline, "Timeline.d.ts"));
const ours = read(path.join(ROOT, "registry", "zoblocks", "timeline", "timeline.tsx"));

/**
 * Props antd declares that we deliberately do not reproduce.
 *
 * One entry, and it is the whole argument for owning this primitive. antd's
 * Timeline is an adapter over `Steps` and hardcodes `current: items.length - 1`,
 * which marks the last rendered item `process` — a state its own stylesheet
 * gives a dotted rail. A history has no current step, and on a newest-first
 * chronology `reverse` puts that dotted rail under the oldest event in the
 * chart. Adding anything to this set needs the same standard of argument.
 */
const DELIBERATELY_ABSENT = new Set<string>([]);

describe("antd v6 Timeline parity", () => {
  it("finds the installed antd", () => {
    expect(existsSync(antdTimeline)).toBe(true);
  });

  it("accepts every prop antd's Timeline accepts", () => {
    const theirs = propsOf(antdSource, "export interface TimelineProps");
    const missing = [...theirs].filter(
      (name) => !DELIBERATELY_ABSENT.has(name) && !new RegExp(`\\b${name}\\??:`).test(ours),
    );
    expect(missing, "antd props our Timeline does not declare").toEqual([]);
  });

  it("accepts every item prop antd's items accept", () => {
    const theirs = propsOf(antdSource, "export interface TimelineItemType");
    const missing = [...theirs].filter((name) => !new RegExp(`\\b${name}\\??:`).test(ours));
    expect(missing, "antd item props our TimelineItemType does not declare").toEqual([]);
  });

  it("still accepts every name antd v6 deprecated but did not remove", () => {
    // A migration is "change one import". That only holds while the v5 names a
    // real codebase is full of keep working.
    for (const legacy of ["label", "children", "dot", "position", "pending", "pendingDot"]) {
      expect(ours, `${legacy} is deprecated in antd v6 but still accepted`).toContain(
        `${legacy}?:`,
      );
    }
    expect(antdSource).toContain("@deprecated");
  });

  it("keeps antd's semantic DOM keys, so a classNames object ports unchanged", () => {
    for (const slot of [
      "root",
      "item",
      "itemWrapper",
      "itemIcon",
      "itemSection",
      "itemHeader",
      "itemTitle",
      "itemContent",
      "itemRail",
    ]) {
      expect(ours, `semantic slot ${slot}`).toContain(`"${slot}"`);
    }
  });

  it("keeps antd's mode, orientation and variant vocabularies", () => {
    expect(antdSource).toContain("'horizontal' | 'vertical'");
    expect(ours).toContain('"horizontal" | "vertical"');
    for (const value of ["left", "right", "start", "end", "alternate"]) {
      expect(ours, `mode value ${value}`).toContain(`"${value}"`);
    }
  });

  it("pins the mode default to antd's source, not antd's documentation table", () => {
    const implementation = read(path.join(antdTimeline, "Timeline.js"));
    expect(
      implementation,
      "antd 6.6.0 resolves an unset mode to 'start'. If this no longer holds, our default has to move with it.",
    ).toContain("modeList.includes(mode) ? mode : 'start'");
    expect(ours).toContain('return "start";');
  });

  it("still has the current-step behaviour we refuse to reproduce", () => {
    // If antd ever stops hardcoding this, the divergence stops being necessary
    // and the argument in the component's doc comment needs revisiting.
    const implementation = read(path.join(antdTimeline, "Timeline.js"));
    expect(implementation).toContain("current: mergedItems.length - 1");
    expect(read(path.join(antdTimeline, "style", "index.js"))).toContain(
      "'item-process-rail-line-style'",
    );
    // Named in the doc comment, which is where the argument lives — so the
    // assertion is on the declaration, not on the word.
    expect(ours).not.toMatch(/^\s*current\??:/m);
    expect(ours).not.toContain("current={");
  });

  it("renders an ol of li, which antd also does and its documentation denies", () => {
    const implementation = read(path.join(antdTimeline, "Timeline.js"));
    expect(implementation).toContain("rootComponent: 'ol'");
    expect(implementation).toContain("itemComponent: 'li'");
    expect(ours).toContain("<ol");
  });

  it("adds the accessible name antd has no way to accept", () => {
    // rc-steps emits no role, no aria-current and no aria-label; there is no
    // prop to name the list. Ours requires one in the type.
    // Resolved from antd's own directory for the same reason as antd itself:
    // the store's layout is a package manager's business, not a test's.
    const fromAntd = createRequire(path.join(ANTD, "package.json"));
    const stepSource = read(
      path.join(
        path.dirname(fromAntd.resolve("@rc-component/steps/package.json")),
        "es",
        "Steps.js",
      ),
    );
    expect(stepSource).not.toContain("aria-");
    expect(ours).toContain('{ "aria-label": string } | { "aria-labelledby": string }');
  });
});
