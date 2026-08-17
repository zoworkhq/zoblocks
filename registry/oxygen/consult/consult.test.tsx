/**
 * Consult, where the stories cannot reach.
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
  type ConsultEvent,
  type Source,
} from "@oxygenui-design/consult-core";
import { Consult } from "./consult";

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

const grounded: ConsultEvent[] = [
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

function renderConsult(props: Partial<React.ComponentProps<typeof Consult>> = {}) {
  return render(
    <Consult
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
    renderConsult();

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
    renderConsult();
    type("What is the initial approach to rate control?");

    const send = await screen.findByRole("button", { name: "Send" });
    await waitFor(() => expect(send).toBeEnabled());
    fireEvent.click(send);

    await waitFor(() => expect(screen.getByText(/rate control/i)).toBeInTheDocument(), {
      timeout: 4000,
    });
  });

  it("stays disabled while there is nothing to send", () => {
    // An enabled Send on an empty field invites a request that the engine
    // would refuse anyway, and teaches that the button does nothing.
    renderConsult();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
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

  function askAbout(props: Partial<React.ComponentProps<typeof Consult>>) {
    renderConsult({
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
    renderConsult({
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
    const { container } = renderConsult({ suppressed: true });
    expect(container.firstChild).toBeNull();
  });
});

describe("the risk protocol hook", () => {
  it("is not called for an ordinary answer", async () => {
    // Guards against a crisis handler wired to the wrong event: one that fires
    // on every answer would train the team to ignore it.
    const onRiskProtocol = vi.fn();
    renderConsult({ onRiskProtocol });

    type("What is the initial approach to rate control?");
    fireEvent.keyDown(field(), { key: "Enter" });

    await waitFor(() => expect(screen.getByText(/rate control/i)).toBeInTheDocument(), {
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
  const dock = () => document.querySelector("[data-ox-consult]") as HTMLElement;

  it("floats above the viewport when it is not inline", () => {
    renderConsult({ anchor: "bottom-center" });
    // Fixed, and clear of the home indicator — a dock sitting under it is
    // unreachable on the tablets this runs on.
    expect(dock().className).toContain("fixed");
    expect(dock().className).toContain("safe-area-inset-bottom");
    expect(dock().className).not.toContain("items-end");
  });

  it("hugs the right edge when asked to", () => {
    renderConsult({ anchor: "bottom-right" });
    expect(dock().className).toContain("items-end");
  });

  it("takes no fixed positioning when inline", () => {
    // The embedded case: the host has already placed it, and a fixed dock
    // would escape whatever container it was put in.
    renderConsult({ anchor: "inline" });
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
    renderConsult({ shortcuts, role: "nurse" });

    type("/");
    expect(await screen.findByRole("option", { name: /Dose check/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Titration plan/ })).not.toBeInTheDocument();
  });

  it("shows it to the role it names", async () => {
    renderConsult({ shortcuts, role: "pharmacist" });

    type("/");
    expect(await screen.findByRole("option", { name: /Titration plan/ })).toBeTruthy();
  });

  it("shows unrestricted shortcuts when no role is given at all", async () => {
    // The default deployment: no role plumbed through yet. An unrestricted
    // shortcut must still appear, or the feature looks broken before anyone
    // has configured anything.
    renderConsult({ shortcuts });

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
    renderConsult({
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

    renderConsult({
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

    renderConsult({ modes: [unscoped], initialModeId: unscoped.id });

    fireEvent.click(screen.getByRole("button", { name: "Unscoped" }));
    await screen.findByRole("group", { name: "Change mode" });

    // Queried from the document rather than from the group: the mode buttons
    // are the group, and the suggestion list is its sibling.
    const suggestion = await screen.findByRole("button", { name: /Ask something general/ });
    // One line of text in the control, not two.
    expect(suggestion.querySelectorAll("span")).toHaveLength(1);
  });
});
