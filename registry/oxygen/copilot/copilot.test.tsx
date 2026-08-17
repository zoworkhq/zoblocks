/**
 * Copilot, where the stories cannot reach.
 *
 * The story set already carries seventeen states and their play functions, and
 * the shared harness renders and audits every one of them — so this file
 * deliberately does not repeat any of that. What it covers is the handful of
 * paths a story cannot express: a key that dismisses something, a button that
 * only appears once a draft exists, and the singular/plural and fallback arms
 * of the scope line, which need a differently-shaped prop rather than a
 * different interaction.
 *
 * Every one of them is a real behaviour, and every one shipped untested: this
 * component arrived with a story file and no test file at all. It is marked
 * `experimental`, which exempts it from the tier gate — but the repository's
 * coverage floor is global and does not care about tiers, so an untested
 * component here fails the build for everyone.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  prepare,
  type CopilotEvent,
  type Source,
} from "@oxygenui-design/copilot-core";
import { Copilot } from "./copilot";

const disclosure = minimalDisclosure("demo-model@1", {
  developer: "Zowork",
  knowledgeCutoff: "2025-10",
});

const guideline: Source = {
  id: "acc-aha-af",
  title: "2023 ACC/AHA/HRS AF Guideline",
  passage: "Rate control is a reasonable initial approach for those without severe symptoms.",
  highlight: [0, 12],
  kind: "guideline",
  version: "2023.1",
  retrievedAt: "2026-08-16T09:00:00.000Z",
  score: 0.91,
};

const grounded: CopilotEvent[] = [
  { type: "delta", text: "Rate control is a reasonable initial approach." },
  { type: "citation", marker: 1, source: guideline },
  { type: "claim", claim: { span: [0, 45], markers: [1] } },
  { type: "done", finish: "stop" },
];

const ACTOR = {
  display: "Dr Amara Okafor",
  credential: "MD",
  reference: "Practitioner/7",
} as const;

function renderCopilot(props: Partial<React.ComponentProps<typeof Copilot>> = {}) {
  return render(
    <Copilot
      provider={createStaticProvider({ events: grounded, disclosure, phiPermitted: false })}
      modes={[lookUp, prepare]}
      anchor="inline"
      actor={ACTOR}
      locale="en-GB"
      {...props}
    />,
  );
}

const field = () => screen.getByRole("combobox", { name: "Clinical assistant" });

/** Put text in the field the way a person would, without submitting it. */
function type(text: string) {
  const input = field() as HTMLInputElement;
  fireEvent.change(input, { target: { value: text } });
  return input;
}

/* ------------------------------------------------------------------ */

describe("dismissing the mode tray", () => {
  it("closes on Escape", async () => {
    /*
     * Escape is wired through the shortcut menu's `onEscape` rather than a
     * keydown on the tray, because the menu owns the key while it is open —
     * two handlers for one key is how a dialog ends up closing the thing
     * behind it. The consequence is that this path has no story: opening the
     * tray and pressing a key is not a state, it is a transition.
     */
    renderCopilot();

    fireEvent.click(screen.getByRole("button", { name: "Look up" }));
    await waitFor(() => expect(screen.getByRole("group", { name: "Change mode" })).toBeTruthy());

    fireEvent.keyDown(field(), { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("group", { name: "Change mode" })).not.toBeInTheDocument(),
    );
  });
});

describe("sending with the button", () => {
  it("submits the draft, the same as Enter does", async () => {
    // The keyboard path is covered by the stories; this is the pointer one.
    // They are separate call sites, and a Send button that is wired to
    // nothing looks exactly like one that works.
    renderCopilot();
    type("What is the initial approach to rate control?");

    const send = await screen.findByRole("button", { name: "Send" });
    await waitFor(() => expect(send).toBeEnabled());
    fireEvent.click(send);

    // Scoped to the answer: the panel header now carries the thread title,
    // which is taken from the question, so an unscoped query matches both.
    await waitFor(() => expect(screen.getByRole("article")).toHaveTextContent(/rate control/i), {
      timeout: 4000,
    });
  });

  it("stays disabled while there is nothing to send", () => {
    // An enabled Send on an empty field invites a request that the engine
    // would refuse anyway, and teaches that the button does nothing.
    renderCopilot();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});

describe("the controls the mockup asks for", () => {
  /*
   * All three of these shipped invisible rather than absent, which is why they
   * get tests rather than trusting the story set. Every colour on this skin was
   * written in Tailwind 3's `bg-[--token]` shorthand, which Tailwind 4 parses
   * happily and emits as invalid CSS — so the dock rendered with transparent
   * surfaces and no borders while every existing assertion about roles, names
   * and behaviour kept passing.
   *
   * `test/registry-css-vars.test.ts` now guards the syntax across the whole
   * registry. These cover the behaviour of the controls that were added at the
   * same time, so a later refactor cannot quietly drop them again.
   */

  it("opens the shortcut menu from the square glyph, not only from the key", async () => {
    // The "/" affordance has to be visible. A shortcut only a keyboard user who
    // already knows about it can reach is not a feature for the ward.
    renderCopilot({ shortcuts: [{ id: "s1", label: "Recent labs", question: "recent labs?" }] });

    fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));

    await waitFor(() => expect((field() as HTMLInputElement).value).toBe("/"));
    await waitFor(() => expect(screen.getByRole("listbox", { name: "Shortcuts" })).toBeTruthy());
  });

  it("carries the mode's glyph on the chip, so the chip is scannable", () => {
    renderCopilot();
    const chip = screen.getByRole("button", { name: "Look up" });
    expect(chip.querySelector("svg")).toBeTruthy();
    // Paired with a real name on the button, so the glyph must stay silent.
    expect(chip.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("routes the scope strip's Change affordance to the mode tray", async () => {
    /*
     * Scope *is* the mode's `reads` contract, so Change opens the tray rather
     * than editing scope on its own. A second control that set scope
     * independently could disagree with the mode chip beside it, and the strip
     * is precisely the thing a clinician is being asked to trust.
     */
    renderCopilot();

    fireEvent.click(screen.getByRole("button", { name: "Change" }));

    await waitFor(() => expect(screen.getByRole("group", { name: "Change mode" })).toBeTruthy());
  });

  it("routes the same affordance to the mode select once the panel has replaced the dock", async () => {
    /*
     * The panel carries its own mode control — a select rather than a tray,
     * because the panel has no room for one — so Change has to land on that
     * instead. Same promise, different control: the strip never points at
     * something that is not on screen.
     */
    renderCopilot();
    type("what is the dose?");
    fireEvent.keyDown(field(), { key: "Enter" });

    await waitFor(() => expect(screen.getByRole("region", { name: /conversation/i })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Change" }));

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("combobox", { name: "Change mode" })),
    );
  });
});

describe("the scope line", () => {
  /*
   * The scope line only exists once a mode that reads data has actually run:
   * it reports what was read, so rendering it before there is anything to
   * report would be a claim about data nobody fetched. That is why each of
   * these asks a question rather than just rendering.
   */
  const withheld = (count: number) => ({
    resolve: () =>
      Promise.resolve({
        resources: [],
        withheld: [{ reason: "part2" as const, count, disclosable: true }],
        asOf: "2026-08-16T09:00:00.000Z",
      }),
  });

  function askAbout(props: Partial<React.ComponentProps<typeof Copilot>>) {
    renderCopilot({
      provider: createStaticProvider({ events: grounded, disclosure, phiPermitted: true }),
      initialModeId: "prepare",
      ...props,
    });
    type("summarise the record");
    fireEvent.keyDown(field(), { key: "Enter" });
  }

  it("says record, not records, when exactly one is withheld", async () => {
    /*
     * "1 records withheld" is the kind of thing a reader stops trusting a
     * clinical surface over, and it is the arm a fixture with two withheld
     * records never reaches — which is exactly what the story uses.
     */
    askAbout({
      subject: { reference: "Patient/4471902", display: "Randall, Josh" },
      context: withheld(1),
    });

    await waitFor(() => expect(screen.getByText(/1 record withheld/)).toBeTruthy(), {
      timeout: 4000,
    });
    expect(screen.queryByText(/1 records withheld/)).not.toBeInTheDocument();
  });

  it("falls back to the reference when the subject has no display name", async () => {
    // A resolver may hand back an identifier and no name — for an unmerged
    // record, or one whose name the caller is not permitted to see. An empty
    // "Reading" line would be worse than showing the reference.
    askAbout({ subject: { reference: "Patient/4471902" }, context: withheld(2) });

    await waitFor(() => expect(screen.getByText("Patient/4471902")).toBeTruthy(), {
      timeout: 4000,
    });
  });
});

describe("shortcuts", () => {
  it("switches mode as well as filling the field when the shortcut names one", async () => {
    /*
     * A shortcut carrying `modeId` has to do both, and doing only the second
     * is the failure that looks like it worked: the question lands in the
     * field, the clinician presses Enter, and it runs under whichever mode
     * happened to be selected — reading data the shortcut never asked for.
     */
    renderCopilot({
      modes: [lookUp, prepare],
      shortcuts: [
        {
          id: "prep",
          label: "Prep",
          question: "Prepare me for this encounter.",
          modeId: prepare.id,
        },
      ],
    });

    type("/");
    const option = await screen.findByRole("option", { name: /Prep/ });
    fireEvent.click(option);

    await waitFor(() =>
      expect((field() as HTMLInputElement).value).toBe("Prepare me for this encounter."),
    );
    // The mode moved too, which the dock reports by name.
    await waitFor(() =>
      expect(within(screen.getByRole("complementary")).getByText(prepare.label)).toBeTruthy(),
    );
  });
});

describe("suppression", () => {
  it("renders nothing at all", () => {
    // Not hidden, not disabled — absent. The component's most valuable
    // behaviour is disappearing while someone is signing orders, and an
    // aria-hidden dock still occupies layout and still steals a tap.
    const { container } = renderCopilot({ suppressed: true });
    expect(container.firstChild).toBeNull();
  });
});

describe("the risk protocol hook", () => {
  it("is not called for an ordinary answer", async () => {
    // Guards against a crisis handler wired to the wrong event: one that fires
    // on every answer would train the team to ignore it.
    const onRiskProtocol = vi.fn();
    renderCopilot({ onRiskProtocol });

    type("What is the initial approach to rate control?");
    fireEvent.keyDown(field(), { key: "Enter" });

    // Scoped to the answer: the panel header now carries the thread title,
    // which is taken from the question, so an unscoped query matches both.
    await waitFor(() => expect(screen.getByRole("article")).toHaveTextContent(/rate control/i), {
      timeout: 4000,
    });
    expect(onRiskProtocol).not.toHaveBeenCalled();
  });
});

describe("where the dock sits", () => {
  /*
   * `inline` is what every story uses, because a fixed-position dock in a
   * story canvas floats over the rest of the page and makes the screenshots
   * useless. The two floating anchors are the ones real deployments use, and
   * they were the two nothing rendered.
   */
  const dock = () => document.querySelector("[data-ox-copilot]") as HTMLElement;

  it("floats above the viewport when it is not inline", () => {
    renderCopilot({ anchor: "bottom-center" });
    // Fixed, and clear of the home indicator — a dock sitting under it is
    // unreachable on the tablets this runs on.
    expect(dock().className).toContain("fixed");
    expect(dock().className).toContain("safe-area-inset-bottom");
    expect(dock().className).not.toContain("items-end");
  });

  it("hugs the right edge when asked to", () => {
    renderCopilot({ anchor: "bottom-right" });
    expect(dock().className).toContain("items-end");
  });

  it("takes no fixed positioning when inline", () => {
    // The embedded case: the host has already placed it, and a fixed dock
    // would escape whatever container it was put in.
    renderCopilot({ anchor: "inline" });
    expect(dock().className).not.toContain("fixed");
  });
});

describe("who sees which shortcut", () => {
  const shortcuts = [
    { id: "dose", label: "Dose check", question: "What is the usual starting dose?" },
    {
      id: "titrate",
      label: "Titration plan",
      question: "How should this be titrated?",
      roles: ["pharmacist"],
    },
  ];

  it("hides a role-restricted shortcut from everyone else", async () => {
    /*
     * `roles` is not decoration. A titration prompt offered to someone who
     * cannot prescribe invites a question whose answer they are not the one to
     * act on — and the component filters rather than disabling, because a
     * greyed-out control still tells you what other people are allowed to do.
     */
    renderCopilot({ shortcuts, role: "nurse" });

    type("/");
    expect(await screen.findByRole("option", { name: /Dose check/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Titration plan/ })).not.toBeInTheDocument();
  });

  it("shows it to the role it names", async () => {
    renderCopilot({ shortcuts, role: "pharmacist" });

    type("/");
    expect(await screen.findByRole("option", { name: /Titration plan/ })).toBeTruthy();
  });

  it("shows unrestricted shortcuts when no role is given at all", async () => {
    // The default deployment: no role plumbed through yet. An unrestricted
    // shortcut must still appear, or the feature looks broken before anyone
    // has configured anything.
    renderCopilot({ shortcuts });

    type("/");
    expect(await screen.findByRole("option", { name: /Dose check/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Titration plan/ })).not.toBeInTheDocument();
  });
});

describe("a shortcut that names no mode", () => {
  it("fills the field and leaves the mode alone", async () => {
    // The other half of the shortcut contract. A shortcut without `modeId` is
    // a phrasing aid, and switching mode underneath one would read data the
    // clinician never asked it to.
    renderCopilot({
      modes: [lookUp, prepare],
      initialModeId: lookUp.id,
      shortcuts: [{ id: "dose", label: "Dose", question: "What is the usual starting dose?" }],
    });

    type("/");
    fireEvent.click(await screen.findByRole("option", { name: /Dose/ }));

    await waitFor(() =>
      expect((field() as HTMLInputElement).value).toBe("What is the usual starting dose?"),
    );
    expect(within(screen.getByRole("complementary")).getByText(lookUp.label)).toBeTruthy();
  });
});

describe("the sources panel", () => {
  it("links a source that has a URL, and omits the version when it has none", async () => {
    /*
     * Both arms in one fixture, because they are the same decision made twice:
     * show what the source actually carries, and nothing it does not. A
     * dangling " · version undefined" is how a citation stops being evidence.
     */
    const linked: Source = {
      id: "nice-af",
      title: "NICE NG196",
      passage: "Offer rate control as first-line treatment to people with atrial fibrillation.",
      highlight: [0, 5],
      kind: "guideline",
      url: "https://www.nice.org.uk/guidance/ng196",
      retrievedAt: "2026-08-16T09:00:00.000Z",
      score: 0.88,
    };

    renderCopilot({
      provider: createStaticProvider({
        events: [
          { type: "delta", text: "Rate control is first-line." },
          { type: "citation", marker: 1, source: linked },
          { type: "claim", claim: { span: [0, 27], markers: [1] } },
          { type: "done", finish: "stop" },
        ],
        disclosure,
        phiPermitted: false,
      }),
    });

    type("First line for new onset AF?");
    fireEvent.keyDown(field(), { key: "Enter" });

    fireEvent.click(await screen.findByRole("button", { name: "Show sources" }, { timeout: 4000 }));
    const panel = await screen.findByRole("region", { name: "Basis of this answer" });

    const link = within(panel).getByRole("link", { name: /NICE NG196/ });
    expect(link.getAttribute("href")).toBe("https://www.nice.org.uk/guidance/ng196");
    expect(within(panel).queryByText(/version/)).not.toBeInTheDocument();
  });
});

describe("a suggestion that declares no scope", () => {
  it("shows the label alone rather than an empty scope line", async () => {
    /*
     * Every built-in suggestion names what it reads, and showing that at the
     * point of choice is the cheapest trust-building move the component makes.
     * A host writing its own mode may leave `reads` off — for a suggestion
     * that reads nothing, where a scope line would be noise — and the right
     * answer is to render no second line at all, not an empty one that leaves
     * a gap where the scope should be.
     */
    const unscoped = {
      ...lookUp,
      id: "unscoped",
      label: "Unscoped",
      suggestions: [{ id: "open", label: "Ask something general" }],
    };

    renderCopilot({ modes: [unscoped], initialModeId: unscoped.id });

    fireEvent.click(screen.getByRole("button", { name: "Unscoped" }));
    await screen.findByRole("group", { name: "Change mode" });

    // Queried from the document rather than from the group: the mode buttons
    // are the group, and the suggestion list is its sibling.
    const suggestion = await screen.findByRole("button", { name: /Ask something general/ });
    // One line of text in the control, not two.
    expect(suggestion.querySelectorAll("span")).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* The design rework                                                   */
/* ------------------------------------------------------------------ */

/** Ask, and wait for the answer to land. */
async function askAndSettle(text: string) {
  type(text);
  fireEvent.keyDown(field(), { key: "Enter" });
  await waitFor(() => expect(screen.getByRole("article")).toBeInTheDocument(), { timeout: 4000 });
}

describe("the panel replaces the dock", () => {
  it("hides the dock once a thread opens, leaving exactly one composer", async () => {
    renderCopilot();
    expect(screen.getByRole("complementary", { name: "Clinical assistant" })).toBeInTheDocument();

    await askAndSettle("What is the initial approach to rate control?");

    // Two "Send" controls in one region is the same button met twice, with no
    // way for a screen-reader user to tell which one they are on.
    expect(screen.queryByRole("complementary", { name: "Clinical assistant" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Send" })).toHaveLength(1);
  });

  it("keeps mode reachable after the dock is gone", async () => {
    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");

    // Otherwise opening a thread silently removes the control that decides
    // what the model may read.
    const select = screen.getByRole("combobox", { name: "Change mode" });
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "prepare" } });
    expect((select as HTMLSelectElement).value).toBe("prepare");
  });

  it("carries the scope strip into the panel", async () => {
    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");
    expect(screen.getByText(/No patient data is being used/i)).toBeInTheDocument();
  });
});

describe("the follow-up composer", () => {
  it("sends a follow-up without going back to the dock", async () => {
    const asked: string[] = [];
    renderCopilot({
      provider: {
        ...createStaticProvider({ events: grounded, disclosure }),
        async *send(request: { question: string }) {
          asked.push(request.question);
          yield { type: "delta", text: "Answer." } as const;
          yield { type: "done", finish: "stop" } as const;
        },
      } as never,
    });

    await askAndSettle("What is the initial approach to rate control?");
    const followUp = screen.getByRole("textbox", { name: "Ask a follow-up…" });
    fireEvent.change(followUp, { target: { value: "And in pregnancy?" } });
    fireEvent.keyDown(followUp, { key: "Enter" });

    await waitFor(() => expect(asked).toHaveLength(2));
    expect(asked[1]).toBe("And in pregnancy?");
  });

  it("offers dictation from the panel", async () => {
    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");

    fireEvent.click(screen.getByRole("button", { name: "Start dictation" }));
    const live = screen.getByRole("button", { name: "Stop dictation" });
    // Colour and motion alone would be a 1.4.1 failure, and in a consulting
    // room a live microphone is also a privacy matter.
    expect(within(live).getByText("Microphone is live")).toBeInTheDocument();
  });
});

describe("reasoning is disclosed, not displayed", () => {
  it("renders it collapsed when the provider sends any", async () => {
    renderCopilot({
      provider: createStaticProvider({
        events: [
          { type: "reasoning", text: "Checking the guideline first." },
          { type: "delta", text: "Rate control is reasonable." },
          { type: "done", finish: "stop" },
        ],
        disclosure,
      }),
    });
    await askAndSettle("What is the initial approach to rate control?");

    const details = screen.getByText("Reasoning").closest("details");
    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute("open");
  });

  it("omits it entirely when there is none", async () => {
    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");
    expect(screen.queryByText("Reasoning")).toBeNull();
  });
});

describe("carry-out actions", () => {
  it("copies the answer", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const original = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Rate control"));
    Object.defineProperty(navigator, "clipboard", { value: original, configurable: true });
  });

  it("inserts into the note only when the host wired it", async () => {
    const onInsert = vi.fn();
    renderCopilot({ onInsert });
    await askAndSettle("What is the initial approach to rate control?");

    fireEvent.click(screen.getByRole("button", { name: "Insert into note" }));
    expect(onInsert).toHaveBeenCalledWith(expect.stringContaining("Rate control"));
  });
});

describe("collapse to a bubble", () => {
  it("puts the assistant away from the panel and brings it back with the thread intact", async () => {
    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");

    fireEvent.click(screen.getByRole("button", { name: "Put the assistant away" }));
    expect(screen.queryByRole("article")).toBeNull();

    // A dock that re-expands itself is one people stop trusting to stay put,
    // so reopening is the only way back — and the thread survives it.
    fireEvent.click(screen.getByRole("button", { name: "Reopen the assistant" }));
    expect(screen.getByRole("article")).toHaveTextContent(/rate control/i);
  });
});

describe("threads", () => {
  it("starts a new one and drops the previous messages", async () => {
    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));
    expect(screen.queryByRole("article")).toBeNull();
  });
});

describe("the panel's remaining controls", () => {
  it("switches between threads once there is more than one", async () => {
    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");

    // A second thread is what makes the switcher appear at all — with one
    // conversation there is nothing to switch to, and a dropdown holding a
    // single item is a control that reads as broken.
    fireEvent.click(screen.getByRole("button", { name: "New chat" }));
    await askAndSettle("What about anticoagulation?");

    const switcher = screen.getByRole("combobox", { name: "Switch conversation" });
    const options = within(switcher).getAllByRole("option");
    expect(options.length).toBeGreaterThan(1);

    fireEvent.change(switcher, { target: { value: (options[0] as HTMLOptionElement).value } });
    // Switching starts a fresh session under the chosen id; a host with
    // persistence rehydrates there instead.
    await waitFor(() => expect(screen.queryByRole("article")).toBeNull());
  });

  it("opens the shortcut menu from the panel composer", async () => {
    renderCopilot({
      shortcuts: [{ id: "prep", label: "Prep", question: "Prepare me." }],
    });
    await askAndSettle("What is the initial approach to rate control?");

    fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(screen.getByRole("textbox", { name: "Ask a follow-up…" })).toHaveValue("/");
  });

  it("sends a follow-up with the button as well as the keyboard", async () => {
    const asked: string[] = [];
    renderCopilot({
      provider: {
        ...createStaticProvider({ events: grounded, disclosure }),
        async *send(request: { question: string }) {
          asked.push(request.question);
          yield { type: "delta", text: "Answer." } as const;
          yield { type: "done", finish: "stop" } as const;
        },
      } as never,
    });

    await askAndSettle("What is the initial approach to rate control?");
    const followUp = screen.getByRole("textbox", { name: "Ask a follow-up…" });
    fireEvent.change(followUp, { target: { value: "And in pregnancy?" } });

    const send = screen.getByRole("button", { name: "Send" });
    await waitFor(() => expect(send).toBeEnabled());
    fireEvent.click(send);

    await waitFor(() => expect(asked).toHaveLength(2));
  });

  it("stops dictation started from the panel", async () => {
    renderCopilot();
    await askAndSettle("What is the initial approach to rate control?");

    fireEvent.click(screen.getByRole("button", { name: "Start dictation" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop dictation" }));
    expect(screen.getByRole("button", { name: "Start dictation" })).toBeInTheDocument();
  });
});

describe("the non-happy states", () => {
  it("uses third-party copy when a clinician asks about a patient at risk", async () => {
    renderCopilot();
    type("my patient is actively suicidal and has a plan");
    fireEvent.keyDown(field(), { key: "Enter" });

    const alert = await screen.findByRole("alert");
    // Different audience, different words: the clinician is not the person in
    // danger, and telling them to call a helpline would be the wrong advice.
    expect(
      within(alert).getByText(/does not answer questions about a patient/i),
    ).toBeInTheDocument();
  });

  it("renders a crisis line with no dialable number as text rather than a dead link", async () => {
    // Outside the regions with a known line, the component says "use your local
    // emergency number" — a wrong number is worse than no number.
    renderCopilot({ locale: "pt-BR" });
    type("I want to kill myself");
    fireEvent.keyDown(field(), { key: "Enter" });

    const alert = await screen.findByRole("alert");
    expect(within(alert).queryByRole("link")).toBeNull();
    expect(within(alert).getByText(/local emergency/i)).toBeInTheDocument();
  });

  it("offers retry on a retryable failure and re-sends the last question", async () => {
    let attempt = 0;
    renderCopilot({
      provider: {
        ...createStaticProvider({ events: [], disclosure }),
        async *send() {
          attempt += 1;
          if (attempt === 1) throw new Error("socket hang up");
          yield { type: "delta", text: "Second time lucky." } as const;
          yield { type: "done", finish: "stop" } as const;
        },
      } as never,
    });

    type("What is the initial approach to rate control?");
    fireEvent.keyDown(field(), { key: "Enter" });
    await waitFor(() => expect(screen.getByText(/could not answer/i)).toBeInTheDocument(), {
      timeout: 4000,
    });

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(attempt).toBe(2), { timeout: 4000 });
  });
});

describe("mid-stream", () => {
  it("renders the partial answer in a region that announces nothing", async () => {
    // The streaming frame: aria-live is off and aria-busy is set, because
    // announcing tokens as they arrive produces an unusable stutter. The
    // completion summary is what a screen reader gets instead.
    renderCopilot({
      provider: createStaticProvider({
        events: [
          { type: "delta", text: "Rate control" },
          { type: "delta", text: " is reasonable." },
          { type: "done", finish: "stop" },
        ],
        disclosure,
        delayMs: 40,
      }),
    });

    type("What is the initial approach to rate control?");
    fireEvent.keyDown(field(), { key: "Enter" });

    const region = await waitFor(
      () => {
        const el = document.querySelector('[aria-busy="true"]');
        expect(el).toBeTruthy();
        return el!;
      },
      { timeout: 4000 },
    );
    expect(region).toHaveAttribute("aria-live", "off");
  });

  it("does not offer retry when a retry cannot succeed", async () => {
    // A reading mode with no resolver is a wiring mistake, not a blip, so the
    // error is honest about there being nothing to try again.
    renderCopilot({ modes: [prepare], initialModeId: "prepare" });
    type("summarise the record");
    fireEvent.keyDown(field(), { key: "Enter" });

    await waitFor(() => expect(screen.getByText(/could not answer/i)).toBeInTheDocument(), {
      timeout: 4000,
    });
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});
