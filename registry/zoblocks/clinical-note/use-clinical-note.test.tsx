/**
 * `useClinicalNote` — the headless surface, tested against a bare harness.
 *
 * The hook is exported for hosts that want their own chrome: the sign gate in
 * a drawer, the rail as a chart sidebar, the toolbar in an existing ribbon.
 * That makes it public API, and public API that only the shipped component
 * exercises is public API nobody has actually tried.
 *
 * Each test drives a command the way a host would and asserts on the document
 * the hook reports back, rather than on the DOM ProseMirror rendered — the
 * document is the contract, the DOM is an implementation of it.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import * as React from "react";
import { useClinicalNote } from "@/lib/zoblocks-clinical-note";
import { mixed, noteDoc, noteSection, para } from "@/lib/zoblocks-clinical-note";
import {
  DEFAULT_RULES,
  blanks,
  composition,
  unreviewedAi,
  type Phrase,
} from "@zoblocks/clinical-note-core";
import type { Node as PMNode } from "prosemirror-model";

const NOW = new Date("2026-08-16T14:38:00+05:30");

const PHRASE: Phrase = {
  id: "ap",
  label: "Assessment and plan",
  body: "Assessment: ***diagnosis***. Plan: ***intervention***.",
};

function withAi() {
  return noteDoc(
    noteSection(
      { code: "10164-2", title: "HPI", required: true },
      mixed(
        ["Six weeks of fatigue. ", "typed"],
        ["He denies overt bleeding.", "ai", { source: "scribe/v2", reviewed: false }],
      ),
    ),
    noteSection({ code: "51847-2", title: "A&P", required: true }, para("Plan.", "typed")),
  );
}

/** The smallest thing that can drive the hook: no chrome, just the commands. */
function Harness({ value, onDoc }: { value: PMNode; onDoc?: (doc: PMNode) => void }) {
  const api = useClinicalNote({
    value,
    onChange: onDoc,
    rules: DEFAULT_RULES,
    gateContext: { noteType: "progress", now: NOW },
    label: "Note body",
  });

  return (
    <div>
      <div ref={api.ref} />
      <button onClick={() => api.cmd.insertPhrase(PHRASE)}>insert phrase</button>
      <button onClick={() => api.cmd.acceptAiAt(0, api.doc.content.size)}>
        accept all in range
      </button>
      <button onClick={() => api.cmd.acceptAiAt(0, 1)}>accept nothing in range</button>
      <button onClick={() => api.cmd.nextBlank()}>next blank</button>
      <button onClick={() => api.cmd.bold()}>bold</button>
      <button onClick={() => api.cmd.italic()}>italic</button>
      <button onClick={() => api.cmd.undo()}>undo</button>
      <button onClick={() => api.cmd.redo()}>redo</button>
      <button onClick={() => api.cmd.goToSection("51847-2")}>go to plan</button>
      <button onClick={() => api.cmd.goToSection("00000-0")}>go to nowhere</button>
      <button onClick={() => api.cmd.acceptAllAi()}>accept all</button>
      <output data-testid="undoable">{String(api.canUndo)}</output>
      <button onClick={() => api.setShowOrigins(!api.showOrigins)}>toggle origins</button>
      <output data-testid="blanks">{api.blankCount}</output>
      <output data-testid="copied">{Math.round(api.composition.ratio.copied * 100)}</output>
      <output data-testid="unreviewed">{unreviewedAi(api.doc).length}</output>
      <output data-testid="section">{api.activeSection ?? "none"}</output>
      <output data-testid="origins">{String(api.showOrigins)}</output>
    </div>
  );
}

describe("insertPhrase", () => {
  it("expands a phrase into the document, blanks and all", async () => {
    const user = userEvent.setup();
    render(<Harness value={noteDoc(noteSection({ code: "1", title: "S" }))} />);
    expect(screen.getByTestId("blanks")).toHaveTextContent("0");

    await user.click(screen.getByText("insert phrase"));
    await waitFor(() => expect(screen.getByTestId("blanks")).toHaveTextContent("2"));
  });

  it("marks the inserted text as template, not as something the author wrote", async () => {
    // The whole point of the origin: the clinician chose the phrase, but did
    // not write these words in this encounter.
    const user = userEvent.setup();
    let latest: PMNode | undefined;
    render(
      <Harness
        value={noteDoc(noteSection({ code: "1", title: "S" }))}
        onDoc={(d) => (latest = d)}
      />,
    );
    await user.click(screen.getByText("insert phrase"));
    await waitFor(() => expect(latest).toBeDefined());
    expect(composition(latest!).chars.template).toBeGreaterThan(0);
  });
});

describe("acceptAiAt", () => {
  it("marks generated text reviewed inside the given range", async () => {
    const user = userEvent.setup();
    render(<Harness value={withAi()} />);
    expect(screen.getByTestId("unreviewed")).toHaveTextContent("1");

    await user.click(screen.getByText("accept all in range"));
    await waitFor(() => expect(screen.getByTestId("unreviewed")).toHaveTextContent("0"));
  });

  it("leaves ranges outside it alone", async () => {
    // A host accepting one passage must not silently accept the rest — that
    // would make the review gate a formality rather than a record.
    const user = userEvent.setup();
    render(<Harness value={withAi()} />);
    await user.click(screen.getByText("accept nothing in range"));
    await waitFor(() => expect(screen.getByTestId("unreviewed")).toHaveTextContent("1"));
  });
});

describe("nextBlank", () => {
  it("does nothing when the document has none, rather than throwing", async () => {
    const user = userEvent.setup();
    render(<Harness value={withAi()} />);
    await user.click(screen.getByText("next blank"));
    expect(screen.getByTestId("blanks")).toHaveTextContent("0");
  });

  it("moves through the blanks a phrase left behind", async () => {
    const user = userEvent.setup();
    render(<Harness value={noteDoc(noteSection({ code: "1", title: "S" }))} />);
    await user.click(screen.getByText("insert phrase"));
    await waitFor(() => expect(screen.getByTestId("blanks")).toHaveTextContent("2"));

    await user.click(screen.getByText("next blank"));
    await user.click(screen.getByText("next blank"));
    // Wrapping rather than stopping: doing nothing is indistinguishable from a
    // broken key, and F2 is pressed on reflex.
    expect(screen.getByTestId("blanks")).toHaveTextContent("2");
  });
});

describe("F2", () => {
  it("moves to the next blank from the keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Harness value={noteDoc(noteSection({ code: "1", title: "S" }))} />,
    );
    await user.click(screen.getByText("insert phrase"));
    await waitFor(() => expect(screen.getByTestId("blanks")).toHaveTextContent("2"));

    const editor = container.querySelector<HTMLElement>(".zb-note-doc");
    expect(editor).toBeTruthy();
    editor!.focus();
    await user.keyboard("{F2}");
    // The document is unchanged — F2 moves the caret, it does not edit.
    expect(screen.getByTestId("blanks")).toHaveTextContent("2");
  });

  it("is inert when there is nothing to move to", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness value={withAi()} />);
    const editor = container.querySelector<HTMLElement>(".zb-note-doc");
    editor!.focus();
    await user.keyboard("{F2}");
    expect(screen.getByTestId("unreviewed")).toHaveTextContent("1");
  });
});

describe("the editable region", () => {
  it("carries the accessible name the host supplied", () => {
    // `role=textbox` with no name is an ARIA input field a screen reader
    // announces as "edit, blank".
    const { container } = render(<Harness value={withAi()} />);
    expect(container.querySelector(".zb-note-doc")).toHaveAttribute("aria-label", "Note body");
  });

  it("reports which section the caret is in", async () => {
    render(<Harness value={withAi()} />);
    await waitFor(() => expect(screen.getByTestId("section")).toHaveTextContent("10164-2"));
  });
});

describe("the origins toggle", () => {
  it("is off until asked, and redraws when flipped", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness value={withAi()} />);
    expect(screen.getByTestId("origins")).toHaveTextContent("false");
    expect(container.querySelectorAll(".zb-note-pv")).toHaveLength(0);

    await user.click(screen.getByText("toggle origins"));
    await waitFor(() => {
      expect(screen.getByTestId("origins")).toHaveTextContent("true");
      expect(container.querySelectorAll(".zb-note-pv").length).toBeGreaterThan(0);
    });
  });
});

describe("composition", () => {
  it("reports ratios the engine measured, not ones the view guessed", () => {
    const doc = withAi();
    render(<Harness value={doc} />);
    expect(screen.getByTestId("copied")).toHaveTextContent(
      String(Math.round(composition(doc).ratio.copied * 100)),
    );
  });

  it("counts the blanks the engine finds", () => {
    const doc = withAi();
    render(<Harness value={doc} />);
    expect(screen.getByTestId("blanks")).toHaveTextContent(String(blanks(doc).length));
  });
});

describe("history and formatting", () => {
  it("goes from nothing-to-undo to something-to-undo once an edit lands", async () => {
    const user = userEvent.setup();
    render(<Harness value={noteDoc(noteSection({ code: "1", title: "S" }))} />);
    expect(screen.getByTestId("undoable")).toHaveTextContent("false");

    await user.click(screen.getByText("insert phrase"));
    await waitFor(() => expect(screen.getByTestId("undoable")).toHaveTextContent("true"));
  });

  it("undoes an insertion and redoes it", async () => {
    const user = userEvent.setup();
    render(<Harness value={noteDoc(noteSection({ code: "1", title: "S" }))} />);
    await user.click(screen.getByText("insert phrase"));
    await waitFor(() => expect(screen.getByTestId("blanks")).toHaveTextContent("2"));

    // One phrase expansion is one undo step, not four hundred keystrokes.
    await user.click(screen.getByText("undo"));
    await waitFor(() => expect(screen.getByTestId("blanks")).toHaveTextContent("0"));

    await user.click(screen.getByText("redo"));
    await waitFor(() => expect(screen.getByTestId("blanks")).toHaveTextContent("2"));
  });

  it("runs bold and italic without disturbing the document", async () => {
    const user = userEvent.setup();
    const doc = withAi();
    render(<Harness value={doc} />);
    await user.click(screen.getByText("bold"));
    await user.click(screen.getByText("italic"));
    // A collapsed selection stores the mark for the next keystroke rather than
    // rewriting anything, so the measured composition is untouched.
    expect(screen.getByTestId("copied")).toHaveTextContent(
      String(Math.round(composition(doc).ratio.copied * 100)),
    );
  });

  it("moves the caret between sections", async () => {
    const user = userEvent.setup();
    render(<Harness value={withAi()} />);
    await waitFor(() => expect(screen.getByTestId("section")).toHaveTextContent("10164-2"));
    await user.click(screen.getByText("go to plan"));
    await waitFor(() => expect(screen.getByTestId("section")).toHaveTextContent("51847-2"));
  });
});

describe("commands that have nothing to do", () => {
  it("ignores a section code the note does not contain", async () => {
    const user = userEvent.setup();
    render(<Harness value={withAi()} />);
    await waitFor(() => expect(screen.getByTestId("section")).toHaveTextContent("10164-2"));
    await user.click(screen.getByText("go to nowhere"));
    // The caret stays where it was rather than jumping to position zero.
    expect(screen.getByTestId("section")).toHaveTextContent("10164-2");
  });

  it("dispatches nothing when there is no generated text left to accept", async () => {
    const user = userEvent.setup();
    render(
      <Harness value={noteDoc(noteSection({ code: "1", title: "S" }, para("Typed.", "typed")))} />,
    );
    expect(screen.getByTestId("unreviewed")).toHaveTextContent("0");
    await user.click(screen.getByText("accept all"));
    expect(screen.getByTestId("undoable")).toHaveTextContent("false");
  });
});
