import { describe, expect, it } from "vitest";
import {
  blanks,
  countBlanks,
  expand,
  expandPhrase,
  nextBlank,
  searchPhrases,
  tokenize,
  type Phrase,
} from "../src/expand.js";
import { noteSchema } from "../src/schema.js";
import { blank, doc, p, section, t } from "./helpers.js";
import type { Fragment } from "prosemirror-model";

/** Fragment carries `textBetween`; `textContent` is a Node getter. */
function textOf(fragment: Fragment): string {
  return fragment.textBetween(0, fragment.size, "");
}

describe("tokenize", () => {
  it("passes plain text through", () => {
    expect(tokenize("Denies fever.")).toEqual([{ kind: "text", text: "Denies fever." }]);
  });

  it("recognises a bare blank and a hinted one", () => {
    expect(tokenize("Pain is *** today")).toEqual([
      { kind: "text", text: "Pain is " },
      { kind: "blank", hint: "" },
      { kind: "text", text: " today" },
    ]);
    expect(tokenize("Pain is ***severity*** today")).toEqual([
      { kind: "text", text: "Pain is " },
      { kind: "blank", hint: "severity" },
      { kind: "text", text: " today" },
    ]);
  });

  it("keeps two blanks on one line as two blanks", () => {
    // The matcher is non-greedy for this reason: a greedy one swallows the text
    // between them and produces a single blank.
    expect(tokenize("*** and ***").filter((x) => x.kind === "blank")).toHaveLength(2);
  });

  it("recognises a pick list and trims its options", () => {
    expect(tokenize("Patient is {alert: drowsy :obtunded}")).toEqual([
      { kind: "text", text: "Patient is " },
      { kind: "choice", options: ["alert", "drowsy", "obtunded"] },
    ]);
  });

  it("treats an empty pick list as literal text rather than a silent blank", () => {
    // `{}` and `{::}` are typos, not decisions. Rendering them as an empty
    // choice would put an invisible hole in a signed note.
    expect(tokenize("{}")).toEqual([{ kind: "text", text: "{}" }]);
    expect(tokenize("{::}")).toEqual([{ kind: "text", text: "{::}" }]);
  });

  it("is not confused by leftover regex state between calls", () => {
    // The token matcher is a module-level global regex; a missing lastIndex
    // reset makes the second call skip the first token.
    const first = tokenize("*** a");
    const second = tokenize("*** a");
    expect(second).toEqual(first);
  });
});

describe("expand", () => {
  it("marks inserted text as template, because that is what it is", () => {
    const { content } = expand("Denies fever.");
    const text = content.firstChild!.firstChild!;
    expect(text.marks[0]!.attrs["origin"]).toBe("template");
  });

  it("counts the blanks it leaves behind", () => {
    const { blanks: n } = expand("Pain ***severity*** in the ***site***.");
    expect(n).toBe(2);
  });

  it("makes blanks real nodes rather than three asterisks of text", () => {
    // A text convention can be half-deleted into `**`, which then matches
    // nothing, blocks nothing, and ships inside a signed note.
    const { content } = expand("Pain is ***severity***.");
    const kinds: string[] = [];
    content.firstChild!.forEach((child) => kinds.push(child.type.name));
    expect(kinds).toContain("wildcard");
  });

  it("takes the first option of a pick list by default", () => {
    expect(textOf(expand("Patient is {alert:drowsy}.").content)).toBe("Patient is alert.");
  });

  it("lets the host resolve pick lists interactively", () => {
    const { content } = expand("Patient is {alert:drowsy}.", { choose: (o) => o[1]! });
    expect(textOf(content)).toBe("Patient is drowsy.");
  });

  it("drops a choice the host resolves to nothing", () => {
    expect(textOf(expand("A{x:y}B", { choose: () => "" }).content)).toBe("AB");
  });

  it("splits on blank lines and ignores empty ones", () => {
    const { content } = expand("One.\n\nTwo.");
    expect(content.childCount).toBe(2);
  });

  it("always produces something insertable, even from an empty body", () => {
    // Otherwise every call site has to special-case it.
    const { content } = expand("   \n  ");
    expect(content.childCount).toBe(1);
    expect(textOf(content)).toBe("");
  });

  it("accepts a caller-chosen provenance", () => {
    const { content } = expand("dictated words", { provenance: { origin: "dictated", confidence: 0.9 } });
    expect(content.firstChild!.firstChild!.marks[0]!.attrs["confidence"]).toBe(0.9);
  });

  it("produces content the schema accepts", () => {
    const { content } = expand("A ***b*** c\n\nsecond");
    expect(() =>
      noteSchema.nodes["doc"]!
        .createChecked(null, [noteSchema.nodes["section"]!.createChecked(null, content)])
        .check(),
    ).not.toThrow();
  });

  it("expands a stored phrase", () => {
    const phrase: Phrase = { id: "ros", label: "ROS", body: "Denies fever." };
    expect(textOf(expandPhrase(phrase).content)).toBe("Denies fever.");
  });
});

describe("countBlanks", () => {
  it("counts without expanding, for the picker", () => {
    // The picker shows "3 blanks" because a clinician choosing at speed needs
    // to know which phrase is about to demand three more decisions.
    expect(countBlanks("*** and ***\nand ***")).toBe(3);
    expect(countBlanks("no blanks here")).toBe(0);
  });
});

describe("blank traversal", () => {
  const d = doc(
    section({ code: "1", title: "A" }, p(t("x"), blank("one"), t("y"))),
    section({ code: "2", title: "B" }, p(blank("two"))),
  );

  it("finds every blank in document order", () => {
    expect(blanks(d).map((b) => b.hint)).toEqual(["one", "two"]);
  });

  it("moves to the next blank after a position", () => {
    const first = blanks(d)[0]!;
    expect(nextBlank(d, first.pos)!.hint).toBe("two");
  });

  it("wraps to the start, because doing nothing is indistinguishable from a broken key", () => {
    const last = blanks(d)[1]!;
    expect(nextBlank(d, last.pos)!.hint).toBe("one");
  });

  it("returns null when there is nothing to move to", () => {
    expect(nextBlank(doc(section({ code: "1", title: "A" }, p(t("x")))), 0)).toBeNull();
  });
});

describe("searchPhrases", () => {
  const phrases: Phrase[] = [
    { id: "ros", label: "Review of systems", description: "10 systems, negative", body: "" },
    { id: "rosbrief", label: "Brief ROS", description: "four systems", body: "" },
    { id: "ap", label: "Assessment and plan", description: "with a ros reference", body: "" },
    { id: "exam", label: "Normal ros exam", body: "" },
  ];

  it("returns everything for an empty query", () => {
    expect(searchPhrases(phrases, "   ")).toHaveLength(4);
  });

  it("tolerates the leading dot the clinician actually types", () => {
    expect(searchPhrases(phrases, ".ros")[0]!.id).toBe("ros");
  });

  it("ranks prefix over substring over label over description", () => {
    // Ordered so the top hit is stable while typing. Fuzzy matching where `.ap`
    // and `.aphasia` are both real phrases changes the top hit mid-keystroke,
    // and the muscle memory that makes dot phrases fast depends on it not.
    expect(searchPhrases(phrases, "ros").map((p) => p.id)).toEqual(["ros", "rosbrief", "exam", "ap"]);
  });

  it("keeps library order for ties", () => {
    // Both ids begin with the query, so both score identically; the library's
    // own order is what breaks the tie.
    const tied: Phrase[] = [
      { id: "apb", label: "Plan B", body: "" },
      { id: "apa", label: "Plan A", body: "" },
    ];
    expect(searchPhrases(tied, "ap").map((p) => p.id)).toEqual(["apb", "apa"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(searchPhrases(phrases, "zzz")).toHaveLength(0);
  });
});
