/**
 * The antd skin, rendered.
 *
 * copilot-core proves the engine and copilot-react proves the behaviour, so
 * what is tested here is what only the skin can get wrong: that the states
 * actually render, that the antd controls carry real accessible names rather
 * than antd's hardcoded English, and that the crisis and suppression paths put
 * nothing on screen that they should not.
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

const disclosure = minimalDisclosure("test-model@1", {
  developer: "Zowork",
  knowledgeCutoff: "2025-10",
});

const source: Source = {
  id: "s1",
  title: "2023 ACC/AHA AF Guideline",
  passage: "Rate control is a reasonable initial approach in most patients.",
  highlight: [0, 46],
  kind: "guideline",
  version: "2023.1",
  retrievedAt: "2026-08-16T09:00:00.000Z",
  score: 0.91,
};

const grounded: CopilotEvent[] = [
  { type: "delta", text: "Rate control is a reasonable first strategy." },
  { type: "citation", marker: 1, source },
  { type: "claim", claim: { span: [0, 43], markers: [1] } },
  { type: "done", finish: "stop" },
];

let ids = 0;
const setup = (over: Partial<CopilotProps> = {}) => {
  const props: CopilotProps = {
    provider: createStaticProvider({ events: grounded, disclosure }),
    modes: [lookUp, prepare],
    actor: { display: "Dr Okafor" },
    now: () => "2026-08-16T09:00:00.000Z",
    newId: () => `id-${++ids}`,
    ...over,
  };
  return { user: userEvent.setup(), ...render(<Copilot {...props} />) };
};

const ask = async (user: ReturnType<typeof userEvent.setup>, question: string) => {
  const field = screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel });
  await user.type(field, question);
  await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.send }));
};

describe("the dock", () => {
  it("renders as a named landmark, not a bare floating div", () => {
    setup();
    expect(
      screen.getByRole("complementary", { name: DEFAULT_LOCALE.dockLabel }),
    ).toBeInTheDocument();
  });

  it("does not promise to answer anything", () => {
    setup();
    const field = screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel });
    expect(field).toHaveAttribute("placeholder");
    expect(field.getAttribute("placeholder")).not.toMatch(/ask anything/i);
  });

  it("shows the standing disclaimer and never hides it", () => {
    setup();
    expect(screen.getAllByText(DEFAULT_LOCALE.disclaimer).length).toBeGreaterThan(0);
  });

  it("keeps send disabled until there is a question", async () => {
    const { user } = setup();
    expect(screen.getByRole("button", { name: DEFAULT_LOCALE.send })).toBeDisabled();
    await user.type(screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel }), "AF?");
    expect(screen.getByRole("button", { name: DEFAULT_LOCALE.send })).toBeEnabled();
  });

  it("says no patient data is used in a reference-only mode", () => {
    setup();
    expect(screen.getByText(DEFAULT_LOCALE.readingNothing)).toBeInTheDocument();
  });
});

describe("suppression — Law 5", () => {
  it("renders absolutely nothing when suppressed", () => {
    const { container } = setup({ suppressed: true });
    expect(container).toBeEmptyDOMElement();
  });
});

describe("answering", () => {
  it("streams an answer, marks it grounded, and renders a citation marker", async () => {
    const { user } = setup();
    await ask(user, "First line for new onset AF?");

    await waitFor(() =>
      expect(screen.getByText(/Rate control is a reasonable/)).toBeInTheDocument(),
    );
    expect(screen.getByText(new RegExp(DEFAULT_LOCALE.grounded))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Source 1, 2023 ACC\/AHA/ })).toBeInTheDocument();
  });

  it("names citation markers rather than reading a bare number", async () => {
    const { user } = setup();
    await ask(user, "AF?");
    await waitFor(() => screen.getByRole("button", { name: /Source 1/ }));
    // "Source 1, 2023 ACC/AHA AF Guideline, version 2023.1" — not "1".
    expect(screen.getByRole("button", { name: /version 2023\.1/ })).toBeInTheDocument();
  });

  it("opens the sources drawer with the retrieved passage, not just a link", async () => {
    const { user } = setup();
    await ask(user, "AF?");
    await waitFor(() => screen.getByRole("button", { name: DEFAULT_LOCALE.showSources }));

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.showSources }));

    const panel = screen.getByRole("region", { name: DEFAULT_LOCALE.basisOfAnswer });
    expect(
      within(panel).getByText(/Rate control is a reasonable initial approach/),
    ).toBeInTheDocument();
    expect(within(panel).getByText(/2023\.1/)).toBeInTheDocument();
  });

  it("emits the verification signal when the drawer opens", async () => {
    const onTelemetry = vi.fn();
    const { user } = setup({ onTelemetry });
    await ask(user, "AF?");
    await waitFor(() => screen.getByRole("button", { name: DEFAULT_LOCALE.showSources }));
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.showSources }));

    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sources-opened", sourceCount: 1 }),
    );
  });

  it("marks an uncited answer as general knowledge, visibly", async () => {
    const uncited: CopilotEvent[] = [
      { type: "delta", text: "Rhythm control is also reasonable in younger patients." },
      { type: "done", finish: "stop" },
    ];
    const { user } = setup({ provider: createStaticProvider({ events: uncited, disclosure }) });
    await ask(user, "AF?");

    await waitFor(() => expect(screen.getByText(DEFAULT_LOCALE.general)).toBeInTheDocument());
    // The register is on the element, so CSS can distinguish it — Law 3.
    expect(document.querySelector('[data-register="general"]')).toBeInTheDocument();
  });
});

describe("crisis", () => {
  it("replaces the answer with the interstitial rather than annotating it", async () => {
    const { user } = setup({ locale: "en-US" });
    await ask(user, "I want to kill myself");

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(DEFAULT_LOCALE.crisisTitle)).toBeInTheDocument();
    // No model output at all.
    expect(screen.queryByText(/Rate control/)).not.toBeInTheDocument();
  });

  it("offers a locale-resolved crisis line", async () => {
    const { user } = setup({ locale: "en-US" });
    await ask(user, "I want to kill myself");
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByRole("link", { name: /988/ })).toHaveAttribute("href", "tel:988");
  });

  it("does not offer 988 outside the United States", async () => {
    const { user } = setup({ locale: "en-GB" });
    await ask(user, "I want to kill myself");
    const alert = await screen.findByRole("alert");
    expect(within(alert).queryByText(/988/)).not.toBeInTheDocument();
    expect(within(alert).getByRole("link", { name: /Samaritans/ })).toBeInTheDocument();
  });

  it("disables the field so the conversation cannot continue", async () => {
    // The panel replaces the dock once a thread is open, so the field under
    // test is the panel's follow-up composer rather than the dock's.
    const { user } = setup();
    await ask(user, "I want to kill myself");
    await screen.findByRole("alert");
    expect(screen.getByRole("textbox", { name: DEFAULT_LOCALE.followUp })).toBeDisabled();
  });

  it("keeps the copy plain rather than warm", () => {
    expect(DEFAULT_LOCALE.crisisBodyUser).not.toMatch(/sorry to hear|I understand|here for you/i);
  });
});

describe("refusals", () => {
  it("redirects an out-of-mode question and offers the mode that would take it", async () => {
    const { user } = setup();
    await ask(user, "what are this patient's current medications");

    await waitFor(() => expect(screen.getByText(DEFAULT_LOCALE.refusedTitle)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Switch to Prepare/ })).toBeInTheDocument();
  });

  it("actually switches mode when the redirect is taken", async () => {
    const { user } = setup();
    await ask(user, "what are this patient's current medications");
    await waitFor(() => screen.getByRole("button", { name: /Switch to Prepare/ }));
    await user.click(screen.getByRole("button", { name: /Switch to Prepare/ }));

    // Mode stays reachable after the dock gives way to the panel — the chip
    // moves into the panel composer rather than disappearing.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: DEFAULT_LOCALE.modes })).toHaveTextContent(
        "Prepare",
      ),
    );
  });
});

describe("modes and shortcuts", () => {
  it("opens the mode tray and shows what each suggestion will read", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: lookUp.label }));

    expect(screen.getByRole("group", { name: DEFAULT_LOCALE.modes })).toBeInTheDocument();
    // Every suggestion declares its scope. Two of Look up's three read the
    // formulary, so this is deliberately a count rather than a lookup.
    expect(screen.getAllByText("Formulary only")).toHaveLength(2);
    expect(screen.getByText("Guideline corpus only")).toBeInTheDocument();
  });

  it("fills the field from a suggestion", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: lookUp.label }));
    await user.click(screen.getByRole("button", { name: /Interactions/ }));

    expect(screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel })).toHaveValue(
      "Interactions",
    );
  });

  it("opens the slash menu as a listbox with the first option active", async () => {
    const { user } = setup({
      shortcuts: [
        { id: "prep", label: "Prep", question: "Prepare me." },
        { id: "questions", label: "Questions", question: "What should I ask?" },
      ],
    });

    await user.type(screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel }), "/");

    const list = screen.getByRole("listbox", { name: DEFAULT_LOCALE.shortcuts });
    expect(within(list).getAllByRole("option")).toHaveLength(2);
    expect(within(list).getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("keeps focus in the field while arrowing, per the combobox pattern", async () => {
    const { user } = setup({
      shortcuts: [
        { id: "prep", label: "Prep", question: "Prepare me." },
        { id: "questions", label: "Questions", question: "What should I ask?" },
      ],
    });
    const field = screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel });
    await user.type(field, "/");
    await user.keyboard("{ArrowDown}");

    expect(document.activeElement).toBe(field);
    expect(field).toHaveAttribute("aria-activedescendant", "copilot-shortcuts-option-1");
  });

  it("selects a shortcut with Enter and puts its question in the field", async () => {
    const { user } = setup({
      shortcuts: [{ id: "prep", label: "Prep", question: "Prepare me for this encounter." }],
    });
    const field = screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel });
    await user.type(field, "/");
    await user.keyboard("{Enter}");

    expect(field).toHaveValue("Prepare me for this encounter.");
  });
});

describe("dictation", () => {
  it("switches to a live indicator with a hidden announcement", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.startDictation }));

    const stop = screen.getByRole("button", { name: DEFAULT_LOCALE.stopDictation });
    // Colour and motion alone would be a WCAG 1.4.1 failure, and in a
    // consulting room it is also a privacy problem.
    expect(within(stop).getByText(DEFAULT_LOCALE.dictationLive)).toBeInTheDocument();
  });
});

describe("scope strip", () => {
  it("names the patient, the categories, and what was withheld", async () => {
    const { user } = setup({
      initialModeId: "prepare",
      subject: { reference: "Patient/1", display: "Amara Okonkwo" },
      provider: createStaticProvider({ events: grounded, disclosure, phiPermitted: true }),
      context: {
        resolve: () =>
          Promise.resolve({
            resources: [],
            withheld: [{ reason: "part2", count: 2, disclosable: true }],
            asOf: "2026-08-16T09:00:00.000Z",
          }),
      },
    });

    await ask(user, "summarise the record");

    await waitFor(() => expect(screen.getByText("Amara Okonkwo")).toBeInTheDocument());
    // "2 records withheld" is the difference between a redaction and a lie.
    expect(screen.getByText(DEFAULT_LOCALE.withheld(2))).toBeInTheDocument();
  });
});

describe("disclosure sheet", () => {
  it("shows the answered count against all 31 HTI-1 attributes", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.disclosureTitle }));

    const sheet = screen.getByRole("region", { name: DEFAULT_LOCALE.disclosureTitle });
    expect(within(sheet).getByText(/of 31 attributes answered/)).toBeInTheDocument();
  });

  it("shows unanswered attributes rather than hiding them", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.disclosureTitle }));

    const sheet = screen.getByRole("region", { name: DEFAULT_LOCALE.disclosureTitle });
    expect(within(sheet).getAllByText(DEFAULT_LOCALE.disclosureUnanswered).length).toBeGreaterThan(
      5,
    );
  });
});

describe("localisation", () => {
  it("accepts overridden strings without touching the BCP-47 locale", async () => {
    setup({ messages: { dockLabel: "Assistant clinique" }, locale: "fr-FR" });
    expect(screen.getByRole("complementary", { name: "Assistant clinique" })).toBeInTheDocument();
  });
});

describe("accessibility", () => {
  it("has no axe violations at rest", async () => {
    const { container } = setup();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("has no axe violations with an answer and its sources open", async () => {
    const { user, container } = setup();
    await ask(user, "AF?");
    await waitFor(() => screen.getByRole("button", { name: DEFAULT_LOCALE.showSources }));
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.showSources }));

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("has no axe violations in the crisis state", async () => {
    const { user, container } = setup();
    await ask(user, "I want to kill myself");
    await screen.findByRole("alert");

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
