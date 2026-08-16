/**
 * The L1 hooks, exercised the way a customer would use them.
 *
 * ARCHITECTURE.md §2 makes a promise about this layer: when a customer needs
 * their own visual language they rebuild L2 and keep L1, because L1 is where
 * the accessibility correctness lives and the part they should not be
 * rewriting. That promise is only worth something if the hooks are tested
 * *without* our components — otherwise "keep L1" means "keep the parts our
 * styled component happens to call".
 *
 * Two things were reachable only from here before this file existed. The
 * `exclusive` and `atLeastOne` policies are not exposed by `Accordion` at all —
 * its antd-compatible `accordion` boolean maps to `single` — so they were
 * verified as pure functions and never through the hook that resolves them.
 * And `useDisclosure` had no test whatsoever: the styled `Disclosure` composes
 * `Accordion`, not the hook, so the hook was public API nothing exercised.
 *
 * The harness below is deliberately the minimum markup the contract requires,
 * which is also the point: if these assertions hold against a bare
 * button-in-a-heading, they hold for anyone who rebuilds the visuals.
 */

import { render, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import {
  useAccordion,
  useDisclosure,
  type AccordionItem,
  type AccordionPolicyName,
  type DisclosureEvent,
  type UseAccordionOptions,
} from "../registry/oxygen/lib/accordion-core";

afterEach(cleanup);

const FIXED_CLOCK = "2026-08-16T09:00:00+05:30";

const items = (n = 3): AccordionItem[] =>
  Array.from({ length: n }, (_, i) => ({
    key: `k${i}`,
    label: `Section ${i}`,
    children: <p>Body {i}</p>,
  }));

/** A customer's own visual language, in the fewest elements the contract allows. */
function Harness({ options }: { options: UseAccordionOptions }) {
  const api = useAccordion(options);
  const Heading = `h${api.headingLevel}` as "h3";

  return (
    <div data-testid="root">
      <button type="button" data-testid="expand-all" onClick={api.openAll}>
        Expand all
      </button>
      <button type="button" data-testid="collapse-all" onClick={api.closeAll}>
        Collapse all
      </button>
      <span data-testid="open-keys">{api.openKeys.join(",")}</span>

      {options.items.map((item) => {
        const heading = api.getHeadingProps(item);
        return (
          <section key={item.key}>
            <Heading {...heading}>
              <button {...api.getTriggerProps(item)}>{item.label}</button>
            </Heading>
            <div {...api.getPanelProps(item)}>
              {api.isDisclosed(item.key) ? item.children : <span>GATE</span>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const triggers = (c: HTMLElement) => [
  ...c.querySelectorAll<HTMLButtonElement>("h3 button, h2 button, h4 button"),
];
const openKeys = (c: HTMLElement) => c.querySelector('[data-testid="open-keys"]')?.textContent;

/* ------------------------------------------------------------------ */
/* useAccordion — the prop getters                                     */
/* ------------------------------------------------------------------ */

describe("useAccordion prop getters", () => {
  it("gives a heading its level as data, so a renderer can pick the element", () => {
    // The styled component reads `headingLevel` directly; a customer's renderer
    // reads this. It is the only way the hook can state a level without having
    // an opinion about markup.
    const view = render(<Harness options={{ items: items(1), headingLevel: 2 }} />);
    const heading = view.container.querySelector("[data-ox-accordion-heading]");
    expect(heading?.getAttribute("data-ox-accordion-heading")).toBe("2");
    expect(heading?.tagName).toBe("H2");
  });

  it("passes an item's own slot classes through the heading getter", () => {
    const view = render(
      <Harness
        options={{
          items: [{ key: "a", label: "A", classNames: { header: "MINE" }, children: <p>x</p> }],
        }}
      />,
    );
    expect(view.container.querySelector(".MINE")).not.toBeNull();
  });

  it("produces a complete trigger contract with no component involved", () => {
    const view = render(<Harness options={{ items: items(2) }} />);
    for (const t of triggers(view.container)) {
      expect(t.getAttribute("type")).toBe("button");
      expect(t.getAttribute("aria-expanded")).toBe("false");
      const controls = t.getAttribute("aria-controls");
      expect(controls).toBeTruthy();
      expect(view.container.querySelector(`#${CSS.escape(controls as string)}`)).not.toBeNull();
    }
  });

  it("keeps ids unique across two hooks on one page", () => {
    // useId is per-hook-instance, so two accordions in one document must not
    // collide — a duplicate id silently breaks aria-controls for one of them.
    const view = render(
      <>
        <Harness options={{ items: items(2) }} />
        <Harness options={{ items: items(2) }} />
      </>,
    );
    const ids = triggers(view.container).map((t) => t.getAttribute("aria-controls"));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ignores a key that is not in the list rather than throwing", () => {
    // `toggle` takes a key, and the caller owns it. A stale key from a
    // previous render, or one whose section was filtered out by a permission
    // check between render and click, must be a no-op — not a crash that takes
    // the whole record down with it.
    function Probe() {
      const api = useAccordion({ items: items(2) });
      return (
        <div>
          <span data-testid="open-keys">{api.openKeys.join(",")}</span>
          <button
            type="button"
            data-testid="ghost"
            onClick={() => {
              api.toggle("gone");
              api.open("gone");
              api.close("gone");
            }}
          >
            ghost
          </button>
        </div>
      );
    }
    const view = render(<Probe />);
    expect(() => view.getByTestId("ghost").click()).not.toThrow();
    expect(openKeys(view.container)).toBe("");
  });

  it.each([
    ["disabled", { key: "x", label: "X", collapsible: "disabled" as const }],
    ["pinned", { key: "x", label: "X", pinned: true }],
    ["withheld", { key: "x", label: "X", access: { kind: "withheld" as const, reason: "r" } }],
  ])("refuses to toggle a %s section even when toggle is called directly", (_label, subject) => {
    // Our own trigger checks inertness before calling toggle, so this guard is
    // belt-and-braces there. It is the front line for a customer's renderer,
    // which calls `toggle(key)` from its own markup and has no reason to know
    // that some sections are not toggleable.
    function Probe() {
      const api = useAccordion({ items: [subject as AccordionItem] });
      return (
        <div>
          <span data-testid="open-keys">{api.openKeys.join(",")}</span>
          <button type="button" data-testid="go" onClick={() => api.toggle("x")}>
            go
          </button>
        </div>
      );
    }
    const view = render(<Probe />);
    const before = openKeys(view.container);
    view.getByTestId("go").click();
    expect(openKeys(view.container)).toBe(before);
  });

  it("honours an explicit idPrefix", () => {
    const view = render(<Harness options={{ items: items(1), idPrefix: "chart" }} />);
    expect(triggers(view.container)[0]?.id).toBe("chart-t0");
    expect(triggers(view.container)[0]?.getAttribute("aria-controls")).toBe("chart-p0");
  });
});

/* ------------------------------------------------------------------ */
/* Policies, through the hook                                          */
/* ------------------------------------------------------------------ */

describe("policies through the hook", () => {
  it.each(["multiple", "single", "exclusive", "atLeastOne"] as AccordionPolicyName[])(
    "%s opens a closed section",
    async (policy) => {
      const user = userEvent.setup();
      const view = render(<Harness options={{ items: items(3), policy }} />);
      await user.click(triggers(view.container)[0] as HTMLElement);
      expect(openKeys(view.container)).toBe("k0");
    },
  );

  it("multiple keeps siblings open", async () => {
    const user = userEvent.setup();
    const view = render(<Harness options={{ items: items(3), policy: "multiple" }} />);
    await user.click(triggers(view.container)[0] as HTMLElement);
    await user.click(triggers(view.container)[1] as HTMLElement);
    expect(openKeys(view.container)).toBe("k0,k1");
  });

  it("single closes the sibling", async () => {
    const user = userEvent.setup();
    const view = render(<Harness options={{ items: items(3), policy: "single" }} />);
    await user.click(triggers(view.container)[0] as HTMLElement);
    await user.click(triggers(view.container)[1] as HTMLElement);
    expect(openKeys(view.container)).toBe("k1");
  });

  it("exclusive refuses to close by activation — something is always showing", async () => {
    // Not reachable through `Accordion`, which maps antd's boolean to `single`.
    const user = userEvent.setup();
    const view = render(<Harness options={{ items: items(3), policy: "exclusive" }} />);
    const first = triggers(view.container)[0] as HTMLElement;
    await user.click(first);
    await user.click(first);
    expect(openKeys(view.container)).toBe("k0");
  });

  it("atLeastOne refuses to close the last one", async () => {
    const user = userEvent.setup();
    const view = render(<Harness options={{ items: items(3), policy: "atLeastOne" }} />);
    const [a, b] = triggers(view.container);
    await user.click(a as HTMLElement);
    await user.click(a as HTMLElement);
    expect(openKeys(view.container)).toBe("k0");

    await user.click(b as HTMLElement);
    await user.click(a as HTMLElement);
    expect(openKeys(view.container)).toBe("k1");
  });
});

/* ------------------------------------------------------------------ */
/* openAll / closeAll                                                  */
/* ------------------------------------------------------------------ */

describe("openAll and closeAll", () => {
  const withWithheld: AccordionItem[] = [
    ...items(2),
    { key: "w", label: "Withheld", access: { kind: "withheld", reason: "Author only" } },
  ];

  it("opens everything the reader may have, and nothing else", async () => {
    const user = userEvent.setup();
    const view = render(<Harness options={{ items: withWithheld }} />);
    await user.click(view.getByTestId("expand-all"));
    expect(openKeys(view.container)).toBe("k0,k1");
  });

  it("closes everything", async () => {
    const user = userEvent.setup();
    const view = render(
      <Harness options={{ items: withWithheld, defaultActiveKey: ["k0", "k1"] }} />,
    );
    await user.click(view.getByTestId("collapse-all"));
    expect(openKeys(view.container)).toBe("");
  });

  it("cannot close a pinned section", async () => {
    const user = userEvent.setup();
    const view = render(
      <Harness options={{ items: [...items(2), { key: "p", label: "P", pinned: true }] }} />,
    );
    await user.click(view.getByTestId("collapse-all"));
    expect(openKeys(view.container)).toBe("p");
  });
});

/* ------------------------------------------------------------------ */
/* Disclosure through the hook                                         */
/* ------------------------------------------------------------------ */

describe("requestDisclosure", () => {
  const gated: AccordionItem[] = [
    {
      key: "g",
      label: "Governed",
      access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
      children: <p>THE CONTENT</p>,
    },
  ];

  function GateHarness({
    onDisclose,
    now,
  }: {
    onDisclose?: UseAccordionOptions["onDisclose"];
    now?: () => string;
  }) {
    const api = useAccordion({
      items: gated,
      ...(onDisclose ? { onDisclose } : {}),
      ...(now ? { now } : {}),
    });
    return (
      <div>
        <button type="button" data-testid="ask" onClick={() => void api.requestDisclosure("g")}>
          ask
        </button>
        <span data-testid="state">
          {api.isDisclosed("g")
            ? "disclosed"
            : api.isPending("g")
              ? "pending"
              : api.isRefused("g")
                ? "refused"
                : "closed"}
        </span>
        {api.isDisclosed("g") ? <p>THE CONTENT</p> : null}
      </div>
    );
  }

  it("reveals only after the application resolves true", async () => {
    const user = userEvent.setup();
    const view = render(<GateHarness onDisclose={() => true} />);
    expect(view.getByTestId("state").textContent).toBe("closed");
    await user.click(view.getByTestId("ask"));
    expect(view.getByTestId("state").textContent).toBe("disclosed");
  });

  it("records a refusal without revealing anything", async () => {
    const user = userEvent.setup();
    const view = render(<GateHarness onDisclose={() => false} />);
    await user.click(view.getByTestId("ask"));
    expect(view.getByTestId("state").textContent).toBe("refused");
    expect(view.container.innerHTML).not.toContain("THE CONTENT");
  });

  it("refuses when a handler throws — an error in a consent lookup is not a yes", async () => {
    const user = userEvent.setup();
    const view = render(
      <GateHarness
        onDisclose={() => {
          throw new Error("consent service unreachable");
        }}
      />,
    );
    await user.click(view.getByTestId("ask"));
    expect(view.getByTestId("state").textContent).toBe("refused");
  });

  it("refuses when a promise rejects", async () => {
    const user = userEvent.setup();
    const view = render(<GateHarness onDisclose={() => Promise.reject(new Error("timeout"))} />);
    await user.click(view.getByTestId("ask"));
    expect(view.getByTestId("state").textContent).toBe("refused");
  });

  it("refuses when nothing is wired — a gate that opens itself is not a gate", async () => {
    const user = userEvent.setup();
    const view = render(<GateHarness />);
    await user.click(view.getByTestId("ask"));
    expect(view.getByTestId("state").textContent).toBe("refused");
  });

  it("reports pending while an async policy is in flight", async () => {
    const user = userEvent.setup();
    let release!: (v: boolean) => void;
    const pending = new Promise<boolean>((r) => {
      release = r;
    });
    const view = render(<GateHarness onDisclose={() => pending} />);

    await user.click(view.getByTestId("ask"));
    expect(view.getByTestId("state").textContent).toBe("pending");

    await act(async () => {
      release(true);
      await pending;
    });
    expect(view.getByTestId("state").textContent).toBe("disclosed");
  });

  it("clears a previous refusal when the reader tries again", async () => {
    const user = userEvent.setup();
    let allow = false;
    const view = render(<GateHarness onDisclose={() => allow} />);

    await user.click(view.getByTestId("ask"));
    expect(view.getByTestId("state").textContent).toBe("refused");

    allow = true;
    await user.click(view.getByTestId("ask"));
    expect(view.getByTestId("state").textContent).toBe("disclosed");
  });

  it("stamps the injected clock rather than reading the wall clock", async () => {
    const user = userEvent.setup();
    const events: DisclosureEvent[] = [];
    const view = render(
      <GateHarness
        now={() => FIXED_CLOCK}
        onDisclose={(e) => {
          events.push(e);
          return true;
        }}
      />,
    );
    await user.click(view.getByTestId("ask"));
    expect(events[0]?.at).toBe(FIXED_CLOCK);
    expect(events[0]?.access.kind).toBe("consent");
  });

  it("returns false for a key that is not in the list", async () => {
    const onDisclose = vi.fn();
    let result: boolean | undefined;
    function Probe() {
      const api = useAccordion({ items: gated, onDisclose });
      return (
        <button
          type="button"
          data-testid="ask"
          onClick={() => {
            void api.requestDisclosure("nope").then((r) => {
              result = r;
            });
          }}
        >
          ask
        </button>
      );
    }
    const user = userEvent.setup();
    const view = render(<Probe />);
    await user.click(view.getByTestId("ask"));
    expect(result).toBe(false);
    expect(onDisclose).not.toHaveBeenCalled();
  });

  it("resolves true immediately for an ungoverned section, without calling the handler", async () => {
    const onDisclose = vi.fn().mockReturnValue(true);
    let result: boolean | undefined;
    function Probe() {
      const api = useAccordion({ items: items(1), onDisclose });
      return (
        <button
          type="button"
          data-testid="ask"
          onClick={() => {
            void api.requestDisclosure("k0").then((r) => {
              result = r;
            });
          }}
        >
          ask
        </button>
      );
    }
    const user = userEvent.setup();
    const view = render(<Probe />);
    await user.click(view.getByTestId("ask"));
    expect(result).toBe(true);
    expect(onDisclose).not.toHaveBeenCalled();
  });

  it("refuses a withheld section without asking anyone", async () => {
    const onDisclose = vi.fn().mockReturnValue(true);
    let result: boolean | undefined;
    function Probe() {
      const api = useAccordion({
        items: [{ key: "w", label: "W", access: { kind: "withheld", reason: "r" } }],
        onDisclose,
      });
      return (
        <button
          type="button"
          data-testid="ask"
          onClick={() => {
            void api.requestDisclosure("w").then((r) => {
              result = r;
            });
          }}
        >
          ask
        </button>
      );
    }
    const user = userEvent.setup();
    const view = render(<Probe />);
    await user.click(view.getByTestId("ask"));
    expect(result).toBe(false);
    expect(onDisclose).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* useDisclosure                                                       */
/* ------------------------------------------------------------------ */

describe("useDisclosure", () => {
  const item: AccordionItem = { key: "one", label: "One", children: <p>BODY</p> };

  function Single({
    open,
    defaultOpen,
    onOpenChange,
    subject = item,
    onDisclose,
  }: {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    subject?: AccordionItem;
    onDisclose?: UseAccordionOptions["onDisclose"];
  }) {
    const d = useDisclosure({
      item: subject,
      ...(open === undefined ? {} : { open }),
      ...(defaultOpen === undefined ? {} : { defaultOpen }),
      ...(onOpenChange ? { onOpenChange } : {}),
      ...(onDisclose ? { onDisclose } : {}),
    });

    return (
      <div>
        <h3 {...d.headingProps}>
          <button {...d.triggerProps}>{subject.label}</button>
        </h3>
        <div {...d.panelProps}>{d.disclosed ? subject.children : <span>GATE</span>}</div>
        <span data-testid="open">{String(d.open)}</span>
        <span data-testid="disclosed">{String(d.disclosed)}</span>
        <span data-testid="pending">{String(d.pending)}</span>
        <span data-testid="refused">{String(d.refused)}</span>
        <button type="button" data-testid="toggle" onClick={d.toggle}>
          toggle
        </button>
        <button type="button" data-testid="show" onClick={d.show}>
          show
        </button>
        <button type="button" data-testid="hide" onClick={d.hide}>
          hide
        </button>
        <button type="button" data-testid="request" onClick={() => void d.request("emergency")}>
          request
        </button>
      </div>
    );
  }

  const flag = (v: ReturnType<typeof render>, id: string) => v.getByTestId(id).textContent;

  it("emits the same markup contract as the many", () => {
    const view = render(<Single />);
    const trigger = view.container.querySelector("h3 button") as HTMLElement;
    expect(trigger.getAttribute("type")).toBe("button");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(
      view.container.querySelector(
        `#${CSS.escape(trigger.getAttribute("aria-controls") as string)}`,
      ),
    ).not.toBeNull();
    expect(view.container.querySelectorAll('[role="tab"],[role="tablist"]')).toHaveLength(0);
  });

  it("reports its own state as a boolean rather than a set", () => {
    const view = render(<Single />);
    expect(flag(view, "open")).toBe("false");
    expect(flag(view, "disclosed")).toBe("true");
    expect(flag(view, "pending")).toBe("false");
    expect(flag(view, "refused")).toBe("false");
  });

  it("toggles", async () => {
    const user = userEvent.setup();
    const view = render(<Single />);
    await user.click(view.getByTestId("toggle"));
    expect(flag(view, "open")).toBe("true");
    await user.click(view.getByTestId("toggle"));
    expect(flag(view, "open")).toBe("false");
  });

  it("shows and hides explicitly, and both are idempotent", async () => {
    const user = userEvent.setup();
    const view = render(<Single />);
    await user.click(view.getByTestId("show"));
    await user.click(view.getByTestId("show"));
    expect(flag(view, "open")).toBe("true");
    await user.click(view.getByTestId("hide"));
    await user.click(view.getByTestId("hide"));
    expect(flag(view, "open")).toBe("false");
  });

  it("opens by default when asked", () => {
    const view = render(<Single defaultOpen />);
    expect(flag(view, "open")).toBe("true");
    expect(view.getByText("BODY")).toBeTruthy();
  });

  it("honours a controlled open and does not move on its own", async () => {
    const user = userEvent.setup();
    const view = render(<Single open={false} />);
    await user.click(view.getByTestId("toggle"));
    expect(flag(view, "open")).toBe("false");
  });

  it("renders open when controlled open is true", () => {
    expect(flag(render(<Single open />), "open")).toBe("true");
  });

  it("reports changes as a boolean", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const view = render(<Single onOpenChange={onOpenChange} />);
    await user.click(view.getByTestId("toggle"));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(view.getByTestId("toggle"));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("gates a single section the same way the group does", async () => {
    const user = userEvent.setup();
    const governed: AccordionItem = {
      key: "one",
      label: "One",
      access: { kind: "reason", reasons: [{ code: "emergency", label: "Emergency" }] },
      children: <p>BODY</p>,
    };
    const events: DisclosureEvent[] = [];

    const view = render(
      <Single
        subject={governed}
        onDisclose={(e) => {
          events.push(e);
          return true;
        }}
      />,
    );

    expect(flag(view, "disclosed")).toBe("false");
    expect(view.container.innerHTML).not.toContain("BODY");

    await user.click(view.getByTestId("request"));
    expect(flag(view, "disclosed")).toBe("true");
    expect(events[0]?.reasonCode).toBe("emergency");
  });

  it("will not open a pinned single section, and reports it disabled", async () => {
    const user = userEvent.setup();
    const view = render(<Single subject={{ key: "one", label: "One", pinned: true }} />);
    const trigger = view.container.querySelector("h3 button") as HTMLElement;
    expect(trigger.getAttribute("aria-disabled")).toBe("true");
    expect(flag(view, "open")).toBe("true");
    await user.click(view.getByTestId("toggle"));
    expect(flag(view, "open")).toBe("true");
  });
});
