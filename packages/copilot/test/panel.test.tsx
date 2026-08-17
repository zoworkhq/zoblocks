/**
 * The panel, after the design rework.
 *
 * Everything here came from a mockup rather than from a feature list, and each
 * one carries an argument the earlier build was missing:
 *
 * - the panel **replaces** the dock, because two composers in one region is the
 *   same "Send" control met twice with no way to tell them apart;
 * - mode stays reachable once the dock is gone, or opening a thread would
 *   quietly remove the control that decides what the model may read;
 * - reasoning is disclosed, not displayed, because a visible chain of thought
 *   reads as evidence and is not evidence;
 * - a thumbs-down asks *why*, because a bare down-vote records a signal nobody
 *   can act on.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { Copilot } from "../src/Copilot.js";
import { DEFAULT_LOCALE } from "../src/locale.js";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  prepare,
  type CopilotEvent,
  type CopilotProps,
  type Source,
} from "../src/index.js";

const disclosure = minimalDisclosure("test-model@1");

const source: Source = {
  id: "s1",
  title: "2023 ACC/AHA AF Guideline",
  passage: "Rate control is a reasonable initial approach.",
  highlight: [0, 45],
  kind: "guideline",
  version: "2023.1",
  retrievedAt: "2026-08-16T09:00:00.000Z",
};

const withReasoning: CopilotEvent[] = [
  { type: "reasoning", text: "Checking the guideline, then the local formulary." },
  { type: "delta", text: "Rate control is a reasonable first strategy." },
  { type: "citation", marker: 1, source },
  { type: "claim", claim: { span: [0, 43], markers: [1] } },
  { type: "done", finish: "stop" },
];

let ids = 0;
const setup = (over: Partial<CopilotProps> = {}) => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(
    <Copilot
      provider={createStaticProvider({ events: withReasoning, disclosure })}
      modes={[lookUp, prepare]}
      actor={{ display: "Dr Okafor" }}
      now={() => "2026-08-16T09:00:00.000Z"}
      newId={() => `id-${++ids}`}
      {...over}
    />,
  );
  return { user, ...view };
};

const dockField = () => screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel });

async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(dockField(), text);
  await user.keyboard("{Enter}");
  await waitFor(() => expect(screen.getByRole("article")).toBeInTheDocument());
}

describe("the panel replaces the dock", () => {
  it("hides the dock once a thread is open, so there is exactly one composer", async () => {
    const { user } = setup();
    expect(
      screen.getByRole("complementary", { name: DEFAULT_LOCALE.dockLabel }),
    ).toBeInTheDocument();

    await ask(user, "AF first line?");

    expect(screen.queryByRole("complementary", { name: DEFAULT_LOCALE.dockLabel })).toBeNull();
    expect(screen.getAllByRole("button", { name: DEFAULT_LOCALE.send })).toHaveLength(1);
  });

  it("carries the scope strip into the panel rather than losing it", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");
    expect(screen.getByText(DEFAULT_LOCALE.readingNothing)).toBeInTheDocument();
  });

  it("keeps mode reachable after the dock is gone", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");

    // Without this the component would silently drop the control that decides
    // what the model may read the moment a thread opens.
    const chip = screen.getByRole("button", { name: DEFAULT_LOCALE.modes });
    expect(chip).toHaveTextContent(lookUp.label);
  });
});

describe("the follow-up composer", () => {
  it("sends a follow-up from the panel", async () => {
    const asked: string[] = [];
    const { user } = setup({
      provider: {
        ...createStaticProvider({ events: withReasoning, disclosure }),
        async *send(request: { question: string }) {
          asked.push(request.question);
          yield { type: "delta", text: "Answer." } as const;
          yield { type: "done", finish: "stop" } as const;
        },
      } as never,
    });

    await ask(user, "AF first line?");
    await user.type(
      screen.getByRole("textbox", { name: DEFAULT_LOCALE.followUp }),
      "And in pregnancy?",
    );
    await user.keyboard("{Enter}");

    await waitFor(() => expect(asked).toEqual(["AF first line?", "And in pregnancy?"]));
  });

  it("offers dictation and a shortcut affordance", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");
    expect(screen.getByRole("button", { name: DEFAULT_LOCALE.startDictation })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DEFAULT_LOCALE.shortcuts })).toBeInTheDocument();
  });

  it("offers attach only when the host wired a handler", async () => {
    const onAttach = vi.fn();
    const { user } = setup({ onAttach });
    await ask(user, "AF first line?");
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.attach }));
    expect(onAttach).toHaveBeenCalled();
  });
});

describe("reasoning is disclosed, not displayed", () => {
  it("renders the reasoning collapsed", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");

    const disclosure = screen.getByText(DEFAULT_LOCALE.reasoning).closest("details");
    expect(disclosure).toBeInTheDocument();
    // Closed by default: a visible chain of thought reads as evidence, and it
    // is a narrative the model produced alongside the answer.
    expect(disclosure).not.toHaveAttribute("open");
  });

  it("never renders reasoning as part of the answer text", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");
    expect(screen.getByRole("article")).toHaveTextContent("Rate control is a reasonable");
    expect(screen.getByRole("article").querySelector(".ox-copilot-answer")).not.toHaveTextContent(
      "Checking the guideline",
    );
  });

  it("omits the disclosure entirely when there is no reasoning", async () => {
    const { user } = setup({
      provider: createStaticProvider({
        events: [
          { type: "delta", text: "Answer." },
          { type: "done", finish: "stop" },
        ],
        disclosure,
      }),
    });
    await ask(user, "AF first line?");
    expect(screen.queryByText(DEFAULT_LOCALE.reasoning)).toBeNull();
  });
});

describe("feedback asks why", () => {
  it("records a thumbs-up immediately", async () => {
    const onTelemetry = vi.fn();
    const { user } = setup({ onTelemetry });
    await ask(user, "AF first line?");

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.helpful }));
    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ type: "feedback", rating: "up" }),
    );
  });

  it("asks for a reason before recording a thumbs-down", async () => {
    const onTelemetry = vi.fn();
    const { user } = setup({ onTelemetry });
    await ask(user, "AF first line?");

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.notHelpful }));
    expect(onTelemetry).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "feedback", rating: "down" }),
    );

    const group = screen.getByRole("group", { name: DEFAULT_LOCALE.whyNotHelpful });
    await user.click(within(group).getByRole("button", { name: "Unsafe" }));

    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ type: "feedback", rating: "down", reason: "unsafe" }),
    );
  });

  it("can be dismissed without recording anything", async () => {
    const onTelemetry = vi.fn();
    const { user } = setup({ onTelemetry });
    await ask(user, "AF first line?");

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.notHelpful }));
    const group = screen.getByRole("group", { name: DEFAULT_LOCALE.whyNotHelpful });
    await user.click(within(group).getByRole("button", { name: DEFAULT_LOCALE.close }));

    expect(screen.queryByRole("group", { name: DEFAULT_LOCALE.whyNotHelpful })).toBeNull();
    expect(onTelemetry).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "feedback", rating: "down" }),
    );
  });
});

describe("carry-out actions", () => {
  it("copies the answer", async () => {
    // Spying rather than stubbing `navigator`: userEvent.setup() installs its
    // own clipboard shim, and replacing the whole object leaves the component
    // writing to one copy while the assertion watches another.
    const { user } = setup();
    await ask(user, "AF first line?");
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.copy }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Rate control"));
    writeText.mockRestore();
  });

  it("inserts into the note when the host wired it", async () => {
    const onInsert = vi.fn();
    const { user } = setup({ onInsert });
    await ask(user, "AF first line?");

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.insert }));
    expect(onInsert).toHaveBeenCalledWith(expect.stringContaining("Rate control"));
  });
});

describe("collapse to a bubble", () => {
  it("puts the whole component away and brings it back", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.collapseDock }));

    // One control, and nothing else. A dock that re-expands itself is one
    // people stop trusting to stay put.
    expect(screen.queryByRole("combobox", { name: DEFAULT_LOCALE.dockLabel })).toBeNull();
    const bubble = screen.getByRole("button", { name: DEFAULT_LOCALE.reopen });

    await user.click(bubble);
    expect(screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel })).toBeInTheDocument();
  });

  it("can be closed from the panel too", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.close }));
    expect(screen.getByRole("button", { name: DEFAULT_LOCALE.reopen })).toBeInTheDocument();
  });

  it("keeps the thread when reopened", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.close }));
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.reopen }));

    expect(screen.getByRole("article")).toHaveTextContent("Rate control");
  });
});

describe("expanding the panel", () => {
  it("toggles between the two shapes", async () => {
    const { user, container } = setup();
    await ask(user, "AF first line?");

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.expand }));
    expect(container.querySelector(".ox-copilot-panel--expanded")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.collapse }));
    expect(container.querySelector(".ox-copilot-panel--expanded")).toBeNull();
  });
});

describe("threads", () => {
  it("titles a thread from its first question", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");
    expect(screen.getByRole("button", { name: DEFAULT_LOCALE.threads })).toHaveTextContent(
      "AF first line?",
    );
  });

  it("starts a new one and drops the old messages", async () => {
    const { user } = setup();
    await ask(user, "AF first line?");
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.newChat }));
    expect(screen.queryByRole("article")).toBeNull();
  });
});

describe("accessibility", () => {
  it("has no axe violations with the reworked panel open", async () => {
    const { user, container } = setup();
    await ask(user, "AF first line?");

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("has no axe violations collapsed to a bubble", async () => {
    const { user, container } = setup();
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.collapseDock }));

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
