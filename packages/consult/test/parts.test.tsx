/**
 * The shared pieces, rendered directly.
 *
 * Covers the branches the end-to-end flow does not reach — proposals, the
 * non-happy states, sources with missing optional fields, and the escalation
 * hooks on the crisis notice.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AnswerBody,
  CheckNotices,
  CrisisNotice,
  DisclosureSheet,
  ProposalCard,
  RegisterBadge,
  ScopeStrip,
  SourcesPanel,
} from "../src/parts.js";
import { DEFAULT_LOCALE } from "../src/locale.js";
import { Consult } from "../src/Consult.js";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  type Answer,
  type ConsultApi,
  type ConsultEvent,
  type Source,
} from "../src/index.js";
import { EMPTY_ANSWER } from "@oxygenui-design/consult-core";

const disclosure = minimalDisclosure("test-model@1");

const source: Source = {
  id: "s1",
  title: "AF Guideline",
  passage: "Rate control is reasonable in most patients.",
  highlight: [0, 27],
  kind: "guideline",
  version: "2023.1",
  retrievedAt: "2026-08-16T09:00:00.000Z",
  score: 0.91,
};

const answer = (over: Partial<Answer> = {}): Answer => ({
  ...EMPTY_ANSWER,
  text: "Rate control is reasonable.",
  sources: new Map([[1, source]]),
  claims: [{ span: [0, 27], markers: [1] }],
  register: "grounded",
  ...over,
});

describe("RegisterBadge", () => {
  it("shows the source count when grounded", () => {
    render(<RegisterBadge answer={answer()} />);
    expect(screen.getByText(/Grounded · 1/)).toBeInTheDocument();
  });

  it("labels the general register", () => {
    render(<RegisterBadge answer={answer({ register: "general" })} />);
    expect(screen.getByText(DEFAULT_LOCALE.general)).toBeInTheDocument();
  });

  it("labels the declined register", () => {
    render(<RegisterBadge answer={answer({ register: "declined" })} />);
    expect(screen.getByText(DEFAULT_LOCALE.declined)).toBeInTheDocument();
  });
});

describe("AnswerBody", () => {
  it("marks an uncited span so it does not look like the rest", () => {
    const { container } = render(
      <AnswerBody
        answer={answer({
          text: "Cited part. Invented part.",
          claims: [{ span: [0, 11], markers: [1] }],
        })}
        onCite={vi.fn()}
      />,
    );
    const uncited = container.querySelector(".ox-consult-uncited");
    expect(uncited).toHaveTextContent("Invented part.");
    expect(uncited).toHaveAttribute("title", DEFAULT_LOCALE.unsupportedHint);
  });

  it("calls back with the marker when a citation is activated", async () => {
    const onCite = vi.fn();
    const user = userEvent.setup();
    render(<AnswerBody answer={answer()} onCite={onCite} />);
    await user.click(screen.getByRole("button", { name: /Source 1/ }));
    expect(onCite).toHaveBeenCalledWith(1);
  });
});

describe("CheckNotices", () => {
  it("renders nothing when there is nothing to say", () => {
    const { container } = render(<CheckNotices findings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("puts refusals before downgrades before flags", () => {
    render(
      <CheckNotices
        findings={[
          { code: "stigmatising-language", severity: "flag", message: "Flag message" },
          { code: "dosing-forbidden", severity: "refuse", message: "Refuse message" },
          { code: "citation-coverage", severity: "downgrade", message: "Downgrade message" },
        ]}
      />,
    );
    const messages = screen.getAllByRole("alert").map((el) => el.textContent);
    expect(messages[0]).toContain("Refuse message");
  });

  it("renders the detail line when present", () => {
    render(
      <CheckNotices
        findings={[
          {
            code: "citation-coverage",
            severity: "downgrade",
            message: "Partly unsupported.",
            detail: "40% of the answer is attributed.",
          },
        ]}
      />,
    );
    expect(screen.getByText("40% of the answer is attributed.")).toBeInTheDocument();
  });
});

describe("SourcesPanel", () => {
  it("highlights the supporting clause inside the passage", () => {
    const { container } = render(<SourcesPanel sources={[source]} onClose={vi.fn()} />);
    expect(container.querySelector("mark")).toHaveTextContent("Rate control is reasonable");
  });

  it("renders a source with no optional fields at all", () => {
    render(
      <SourcesPanel
        sources={[
          {
            id: "s2",
            title: "Bare source",
            passage: "Nothing else is known.",
            kind: "literature",
            retrievedAt: "2026-08-16T09:00:00.000Z",
          },
        ]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Bare source")).toBeInTheDocument();
    expect(screen.queryByText(/Version/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Match/)).not.toBeInTheDocument();
  });

  it("links out when a url is present", () => {
    render(
      <SourcesPanel
        sources={[{ ...source, url: "https://example.org/af" }]}
        onClose={vi.fn()}
      />,
    );
    const link = screen.getByRole("link", { name: "AF Guideline" });
    expect(link).toHaveAttribute("href", "https://example.org/af");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
  });

  it("clamps an out-of-range highlight rather than throwing", () => {
    expect(() =>
      render(
        <SourcesPanel
          sources={[{ ...source, highlight: [-10, 9999] }]}
          onClose={vi.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it("closes", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SourcesPanel sources={[source]} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.close }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ScopeStrip", () => {
  const scope = {
    subject: { reference: "Patient/1", display: "Amara Okonkwo" },
    categories: ["Condition", "Observation"],
    withheldCount: 0,
    showWithheld: false,
    asOf: "2026-08-16T09:00:00.000Z",
  };

  it("says plainly when no patient data is used", () => {
    render(<ScopeStrip scope={{ ...scope, categories: [] }} />);
    expect(screen.getByText(DEFAULT_LOCALE.readingNothing)).toBeInTheDocument();
  });

  it("falls back to the reference when there is no display name", () => {
    render(<ScopeStrip scope={{ ...scope, subject: { reference: "Patient/1" } }} />);
    expect(screen.getByText("Patient/1")).toBeInTheDocument();
  });

  it("offers a change control only when the host supplies a handler", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ScopeStrip scope={scope} />);
    expect(screen.queryByRole("button", { name: DEFAULT_LOCALE.changeScope })).toBeNull();

    rerender(<ScopeStrip scope={scope} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.changeScope }));
    expect(onChange).toHaveBeenCalled();
  });

  it("shows the withheld count when it is disclosable", () => {
    render(<ScopeStrip scope={{ ...scope, withheldCount: 3, showWithheld: true }} />);
    expect(screen.getByText(DEFAULT_LOCALE.withheld(3))).toBeInTheDocument();
  });
});

describe("CrisisNotice", () => {
  it("uses third-party copy when a clinician is asking about a patient", () => {
    render(<CrisisNotice audience="third-party" lines={[]} />);
    expect(screen.getByText(DEFAULT_LOCALE.crisisBodyThirdParty)).toBeInTheDocument();
  });

  it("offers the escalation hooks the host supplied", async () => {
    const onProtocol = vi.fn();
    const onPage = vi.fn();
    const user = userEvent.setup();
    render(
      <CrisisNotice audience="user" lines={[]} onProtocol={onProtocol} onPage={onPage} />,
    );

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.crisisProtocol }));
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.crisisOnCall }));
    expect(onProtocol).toHaveBeenCalled();
    expect(onPage).toHaveBeenCalled();
  });

  it("disables a line with no dialable number rather than rendering a broken link", () => {
    render(
      <CrisisNotice
        audience="user"
        lines={[{ label: "Local emergency services", number: "" }]}
      />,
    );
    expect(screen.getByRole("button", { name: "Local emergency services" })).toBeDisabled();
  });
});

describe("DisclosureSheet", () => {
  it("humanises the field names rather than showing camelCase", () => {
    render(<DisclosureSheet disclosure={disclosure} />);
    expect(screen.getByText("Out Of Scope Use")).toBeInTheDocument();
  });

  it("renders every section heading", () => {
    render(<DisclosureSheet disclosure={disclosure} />);
    for (const heading of ["Details", "Development", "Fairness", "Performance", "Maintenance"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });
});

describe("ProposalCard", () => {
  const api = (over: Partial<ConsultApi> = {}) =>
    ({
      proposal: {
        id: "p1",
        kind: "note-text",
        summary: "Add a line to the note",
        content: "New onset AF, rate controlled.",
      },
      confirm: vi.fn(),
      dismissProposal: vi.fn(),
      ...over,
    }) as unknown as ConsultApi;

  it("renders nothing when there is no proposal", () => {
    const { container } = render(<ProposalCard api={api({ proposal: null })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the proposed content as an addition", () => {
    render(<ProposalCard api={api()} />);
    expect(screen.getByText("New onset AF, rate controlled.")).toBeInTheDocument();
  });

  it("shows a diff when the proposal replaces existing text", () => {
    const withReplace = api({
      proposal: {
        id: "p1",
        kind: "note-text",
        summary: "Amend",
        content: "New text.",
        replaces: "Old text.",
      },
    });
    const { container } = render(<ProposalCard api={withReplace} />);
    expect(container.querySelector("del")).toHaveTextContent("Old text.");
    expect(container.querySelector("ins")).toHaveTextContent("New text.");
  });

  it("puts Discard first and focused — Confirm is never the default", () => {
    render(<ProposalCard api={api()} />);
    // A confirmation people click through reflexively is worse than none.
    expect(document.activeElement).toHaveTextContent(DEFAULT_LOCALE.proposalDismiss);
  });

  it("wires both controls", async () => {
    const confirm = vi.fn();
    const dismissProposal = vi.fn();
    const user = userEvent.setup();
    render(<ProposalCard api={api({ confirm, dismissProposal })} />);

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.proposalConfirm }));
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.proposalDismiss }));
    expect(confirm).toHaveBeenCalled();
    expect(dismissProposal).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* Non-happy states through the real component                         */
/* ------------------------------------------------------------------ */

let ids = 0;
const renderConsult = (over: Record<string, unknown> = {}) => {
  const user = userEvent.setup();
  const view = render(
    <Consult
      provider={createStaticProvider({ events: [{ type: "done", finish: "stop" }], disclosure })}
      modes={[lookUp]}
      actor={{ display: "Dr Okafor" }}
      now={() => "2026-08-16T09:00:00.000Z"}
      newId={() => `id-${++ids}`}
      {...over}
    />,
  );
  return { user, ...view };
};

const ask = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.type(screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel }), text);
  await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.send }));
};

describe("non-happy states", () => {
  it("renders a retryable error with a retry control", async () => {
    const { user } = renderConsult({
      provider: {
        ...createStaticProvider({ events: [], disclosure }),
        // eslint-disable-next-line require-yield
        async *send() {
          throw new Error("socket hang up");
        },
      },
    });
    await ask(user, "AF?");

    await waitFor(() => expect(screen.getByText(DEFAULT_LOCALE.errorTitle)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: DEFAULT_LOCALE.retry })).toBeInTheDocument();
  });

  it("refuses an empty answer rather than showing a blank bubble", async () => {
    const { user } = renderConsult();
    await ask(user, "AF?");
    await waitFor(() => expect(screen.getByText(DEFAULT_LOCALE.declined)).toBeInTheDocument());
  });

  it("starts a new thread", async () => {
    const events: ConsultEvent[] = [
      { type: "delta", text: "Answer." },
      { type: "done", finish: "stop" },
    ];
    const { user } = renderConsult({
      provider: createStaticProvider({ events, disclosure }),
    });
    await ask(user, "AF?");
    await waitFor(() => screen.getByRole("button", { name: DEFAULT_LOCALE.newChat }));

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.newChat }));
    expect(screen.queryByText("Answer.")).not.toBeInTheDocument();
  });

  it("offers insert only when the host wired a handler, and passes the text", async () => {
    const onInsert = vi.fn();
    const events: ConsultEvent[] = [
      { type: "delta", text: "Answer text." },
      { type: "done", finish: "stop" },
    ];
    const { user } = renderConsult({
      provider: createStaticProvider({ events, disclosure }),
      onInsert,
    });
    await ask(user, "AF?");
    await waitFor(() => screen.getByRole("button", { name: DEFAULT_LOCALE.insert }));

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.insert }));
    expect(onInsert).toHaveBeenCalledWith("Answer text.");
  });

  it("sends structured feedback from both controls", async () => {
    const onTelemetry = vi.fn();
    const events: ConsultEvent[] = [
      { type: "delta", text: "Answer." },
      { type: "done", finish: "stop" },
    ];
    const { user } = renderConsult({
      provider: createStaticProvider({ events, disclosure }),
      onTelemetry,
    });
    await ask(user, "AF?");
    await waitFor(() => screen.getByRole("button", { name: DEFAULT_LOCALE.helpful }));

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.helpful }));
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.notHelpful }));

    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ type: "feedback", rating: "up" }),
    );
    expect(onTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ type: "feedback", rating: "down" }),
    );
  });

  it("offers a stop control while streaming", async () => {
    const { user } = renderConsult({
      provider: createStaticProvider({
        events: [
          { type: "delta", text: "Slow" },
          { type: "done", finish: "stop" },
        ],
        disclosure,
        delayMs: 40,
      }),
    });
    await user.type(screen.getByRole("combobox", { name: DEFAULT_LOCALE.dockLabel }), "AF?");
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.send }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: DEFAULT_LOCALE.stop })).toBeInTheDocument(),
    );
  });

  it("renders inline when asked, rather than fixed to the viewport", () => {
    const { container } = renderConsult({ anchor: "inline" });
    expect(container.querySelector(".ox-consult--inline")).toBeInTheDocument();
  });

  it("wires the crisis escalation hooks through from props", async () => {
    const onRiskProtocol = vi.fn();
    const { user } = renderConsult({ onRiskProtocol });
    await ask(user, "I want to kill myself");

    const alert = await screen.findByRole("alert");
    await user.click(
      within(alert).getByRole("button", { name: DEFAULT_LOCALE.crisisProtocol }),
    );
    expect(onRiskProtocol).toHaveBeenCalled();
  });

  it("opens the shortcut menu from the dock control", async () => {
    const { user } = renderConsult({
      shortcuts: [{ id: "prep", label: "Prep", question: "Prepare me." }],
    });
    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.shortcuts }));
    expect(screen.getByRole("listbox", { name: DEFAULT_LOCALE.shortcuts })).toBeInTheDocument();
  });

  it("closes the mode tray from its close control", async () => {
    const { user } = renderConsult();
    await user.click(screen.getByRole("button", { name: lookUp.label }));
    expect(screen.getByRole("group", { name: DEFAULT_LOCALE.modes })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: DEFAULT_LOCALE.closeTray }));
    expect(screen.queryByRole("group", { name: DEFAULT_LOCALE.modes })).toBeNull();
  });
});
