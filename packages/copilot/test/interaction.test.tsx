/**
 * Keyboard paths and the remaining branches.
 *
 * Law 6: the fast path must be keyboard-complete — summon, mode, shortcut,
 * dictate, send, cite, close — without a mouse. The clinician who uses this
 * thirty times a shift is the one whose opinion decides renewal, and they will
 * not be reaching for a trackpad.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Copilot } from "../src/Copilot.js";
import { DEFAULT_LOCALE } from "../src/locale.js";
import {
  createStaticProvider,
  defineMode,
  lookUp,
  minimalDisclosure,
  prepare,
  type CopilotEvent,
  type CopilotProps,
} from "../src/index.js";

const disclosure = minimalDisclosure("test-model@1");

const answering: CopilotEvent[] = [
  { type: "delta", text: "Rate control is reasonable." },
  { type: "done", finish: "stop" },
];

let ids = 0;
const setup = (over: Partial<CopilotProps> = {}) => {
  const user = userEvent.setup();
  const view = render(
    <Copilot
      provider={createStaticProvider({ events: answering, disclosure })}
      modes={[lookUp, prepare]}
      actor={{ display: "Dr Okafor" }}
      now={() => "2026-08-16T09:00:00.000Z"}
      newId={() => `id-${++ids}`}
      {...over}
    />,
  );
  return { user, ...view };
};

const field = () => screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel });

describe("keyboard submission", () => {
  it("sends on Enter", async () => {
    const { user } = setup();
    await user.type(field(), "AF first line?{Enter}");
    await waitFor(() =>
      expect(screen.getByText("Rate control is reasonable.")).toBeInTheDocument(),
    );
  });

  it("does not send on Enter while the shortcut menu is open", async () => {
    // Enter belongs to the menu there — sending "/" as a question would be a
    // surprising and slightly embarrassing thing to put in an audit log.
    const { user } = setup({
      shortcuts: [{ id: "prep", label: "Prep", question: "Prepare me." }],
    });
    await user.type(field(), "/{Enter}");
    expect(field()).toHaveValue("Prepare me.");
    expect(screen.queryByText("Rate control is reasonable.")).not.toBeInTheDocument();
  });

  it("summons the field with Cmd+K from elsewhere on the page", async () => {
    const { user } = setup();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    await user.keyboard("{Meta>}k{/Meta}");
    expect(document.activeElement).toBe(field());
    outside.remove();
  });
});

describe("shortcuts that switch mode", () => {
  it("applies the shortcut's mode as well as its question", async () => {
    const { user } = setup({
      shortcuts: [
        {
          id: "history",
          label: "Patient history",
          modeId: "prepare",
          question: "Summarise the history.",
          description: "Reads the record",
        },
      ],
    });

    await user.type(field(), "/");
    expect(screen.getByText("Reads the record")).toBeInTheDocument();
    await user.keyboard("{Enter}");

    expect(field()).toHaveValue("Summarise the history.");
    expect(screen.getByRole("button", { name: "Prepare" })).toBeInTheDocument();
  });
});

describe("suggestions", () => {
  it("uses a suggestion's explicit question when it has one", async () => {
    const custom = defineMode({
      id: "custom",
      label: "Custom",
      promptRef: "c@1",
      risk: "reference",
      suggestions: [
        { id: "one", label: "Short label", question: "The much longer real question." },
      ],
    });
    const { user } = setup({ modes: [custom] });

    await user.click(screen.getByRole("button", { name: "Custom" }));
    await user.click(screen.getByRole("button", { name: "Short label" }));

    expect(field()).toHaveValue("The much longer real question.");
  });

  it("falls back to the label when a suggestion has no question", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: lookUp.label }));
    await user.click(screen.getByRole("button", { name: /Guideline summary/ }));
    expect(field()).toHaveValue("Guideline summary");
  });
});

describe("disclosure toggle", () => {
  it("opens and closes", async () => {
    const { user } = setup();
    const toggle = screen.getByRole("button", { name: DEFAULT_LOCALE.disclosureTitle });

    await user.click(toggle);
    expect(
      screen.getByRole("region", { name: DEFAULT_LOCALE.disclosureTitle }),
    ).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByRole("region", { name: DEFAULT_LOCALE.disclosureTitle })).toBeNull();
  });
});

describe("stopping", () => {
  it("shows the stopped notice, and says the answer may be incomplete", async () => {
    // A provider that emits one token and then genuinely waits, so the stop is
    // exercised rather than raced against a stream that was finishing anyway.
    const hanging = {
      ...createStaticProvider({ events: [], disclosure }),
      async *send(_request: unknown, signal: AbortSignal) {
        yield { type: "delta", text: "Partial" } as const;
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve();
          signal.addEventListener("abort", () => resolve(), { once: true });
        });
        yield { type: "done", finish: "aborted" } as const;
      },
    };

    const { user } = setup({ provider: hanging as never });

    await user.type(field(), "AF?{Enter}");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: DEFAULT_LOCALE.stop })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.stop }));

    await waitFor(() => expect(screen.getByText(DEFAULT_LOCALE.stoppedNotice)).toBeInTheDocument());
  });
});

describe("refusals without a redirect", () => {
  it("explains without offering a mode switch when none would help", async () => {
    const { user } = setup({ modes: [lookUp] });
    await user.type(field(), "write me a python script to parse this{Enter}");

    await waitFor(() => expect(screen.getByText(DEFAULT_LOCALE.refusedTitle)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Switch to/ })).toBeNull();
  });
});

describe("non-retryable errors", () => {
  it("does not offer retry when a retry cannot succeed", async () => {
    // A reading mode with no resolver is a wiring mistake, not a blip.
    const { user } = setup({ modes: [prepare], initialModeId: "prepare" });
    await user.type(field(), "summarise the record{Enter}");

    await waitFor(() => expect(screen.getByText(DEFAULT_LOCALE.errorTitle)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: DEFAULT_LOCALE.retry })).toBeNull();
  });
});

describe("streaming region", () => {
  it("is aria-live off and busy while tokens arrive", async () => {
    const { user, container } = setup({
      provider: createStaticProvider({
        events: [
          { type: "delta", text: "Streaming" },
          { type: "done", finish: "stop" },
        ],
        disclosure,
        delayMs: 30,
      }),
    });

    await user.type(field(), "AF?{Enter}");

    await waitFor(() => {
      const region = container.querySelector(".ox-copilot-streaming");
      expect(region).toHaveAttribute("aria-live", "off");
      expect(region).toHaveAttribute("aria-busy", "true");
    });
  });
});

describe("scope change hook", () => {
  it("wires onChangeScope through to the strip", async () => {
    const onChangeScope = vi.fn();
    const { user } = setup({
      modes: [prepare],
      initialModeId: "prepare",
      subject: { reference: "Patient/1", display: "Amara Okonkwo" },
      onChangeScope,
    });

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.changeScope }));
    expect(onChangeScope).toHaveBeenCalled();
  });
});

describe("the remaining controls", () => {
  it("switches mode from a chip in the tray", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: lookUp.label }));

    const group = screen.getByRole("group", { name: DEFAULT_LOCALE.modes });
    await user.click(within(group).getByRole("button", { name: "Prepare" }));

    expect(within(group).getByRole("button", { name: "Prepare" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("closes the mode tray when Escape is pressed with no shortcut menu open", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: lookUp.label }));
    expect(screen.getByRole("group", { name: DEFAULT_LOCALE.modes })).toBeInTheDocument();

    await user.type(field(), "{Escape}");
    expect(screen.queryByRole("group", { name: DEFAULT_LOCALE.modes })).toBeNull();
  });

  it("stops dictation from the live control", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.startDictation }));
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.stopDictation }));
    expect(screen.getByRole("button", { name: DEFAULT_LOCALE.startDictation })).toBeInTheDocument();
  });

  it("retries a retryable failure", async () => {
    let attempt = 0;
    const flaky = {
      ...createStaticProvider({ events: [], disclosure }),
      async *send() {
        attempt += 1;
        if (attempt === 1) throw new Error("socket hang up");
        yield { type: "delta", text: "Second time lucky." } as const;
        yield { type: "done", finish: "stop" } as const;
      },
    };

    const { user } = setup({ provider: flaky as never });
    await user.type(field(), "AF?{Enter}");
    await waitFor(() => expect(screen.getByText(DEFAULT_LOCALE.errorTitle)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.retry }));
    await waitFor(() => expect(attempt).toBe(2));
  });
});

describe("citation markers open the drawer", () => {
  it("opens sources when a marker is activated from inside the answer", async () => {
    const cited: CopilotEvent[] = [
      { type: "delta", text: "Rate control is reasonable." },
      {
        type: "citation",
        marker: 1,
        source: {
          id: "s1",
          title: "AF Guideline",
          passage: "Rate control is reasonable.",
          kind: "guideline",
          retrievedAt: "2026-08-16T09:00:00.000Z",
        },
      },
      { type: "claim", claim: { span: [0, 27], markers: [1] } },
      { type: "done", finish: "stop" },
    ];
    const { user } = setup({ provider: createStaticProvider({ events: cited, disclosure }) });

    await user.type(field(), "AF?{Enter}");
    await waitFor(() => screen.getByRole("button", { name: /Source 1/ }));
    await user.click(screen.getByRole("button", { name: /Source 1/ }));

    const panel = screen.getByRole("region", { name: DEFAULT_LOCALE.basisOfAnswer });
    expect(within(panel).getByText(/Rate control is reasonable/)).toBeInTheDocument();
  });
});
