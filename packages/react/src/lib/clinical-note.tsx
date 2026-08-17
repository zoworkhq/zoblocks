"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/clinical-note.tsx. Edit that file, not this one.
/**
 * The React binding for `@oxygenui-design/clinical-note-core`.
 *
 * The engine has no DOM. This file is the part that does: it mounts a
 * ProseMirror view, keeps React and ProseMirror's own state in sync, and
 * exposes the commands the toolbar and the keyboard need. Everything clinical
 * — the schema, the six provenance origins, the sign gate, the serializers —
 * lives in the engine and is tested without a browser.
 *
 * The split matters beyond tidiness. A server rendering a signed note, a job
 * re-hashing one to verify a signature, and a test asserting that the
 * assessment is empty all need the engine and none of them need this file.
 */

import * as React from "react";
import { EditorState, TextSelection, type Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { Fragment, type Node as PMNode } from "prosemirror-model";
import {
  MARKS,
  NODES,
  blanks,
  composition,
  expand,
  nextBlank,
  noteSchema,
  provenance,
  provenanceRanges,
  runGate,
  sectionAttrs,
  sections,
  type Composition,
  type GateContext,
  type GateResult,
  type GateRule,
  type Origin,
  type Phrase,
  type ProvenanceAttrs,
} from "@oxygenui-design/clinical-note-core";

/* ------------------------------------------------------------------ */
/* Provenance decorations                                              */
/* ------------------------------------------------------------------ */

/**
 * The tint each origin gets when "Origins" is on.
 *
 * Colour is never the only channel: every origin also carries a distinct
 * underline style, so the six stay separable in greyscale, under any
 * colour-vision deficiency, and in Windows High Contrast. A reviewer checking
 * a note on a monochrome ward printer has to be able to tell copied text from
 * typed text, and hue alone does not survive that trip.
 */
export const ORIGIN_CLASS: Record<Origin, string> = {
  typed: "",
  dictated: "ox-note-pv ox-note-pv-dictated",
  template: "ox-note-pv ox-note-pv-template",
  pulled: "ox-note-pv ox-note-pv-pulled",
  copied: "ox-note-pv ox-note-pv-copied",
  ai: "ox-note-pv ox-note-pv-ai",
};

export const ORIGIN_LABEL: Record<Origin, string> = {
  typed: "Typed",
  dictated: "Dictated",
  template: "Template",
  pulled: "Pulled",
  copied: "Copied",
  ai: "AI",
};

/* ------------------------------------------------------------------ */
/* Editor state                                                        */
/* ------------------------------------------------------------------ */

export interface UseClinicalNoteOptions {
  /** The document. Uncontrolled after mount; use `value` to reset it. */
  value: PMNode;
  onChange?: (doc: PMNode) => void;
  /** Gate rules and their context. Re-run on every document change. */
  rules: readonly GateRule[];
  gateContext: GateContext;
  /** Dot-phrase library. Hosts supply it; none ships in the package. */
  phrases?: readonly Phrase[];
  readOnly?: boolean;
  /**
   * Accessible name for the editable region.
   *
   * `role="textbox"` without one is an ARIA input field with no name: a screen
   * reader announces "edit, blank" and says nothing about what is being
   * edited. A prop rather than a constant because it is user-visible text.
   */
  label: string;
}

export interface ClinicalNoteApi {
  /** Attach to the editor host element. */
  ref: (node: HTMLDivElement | null) => void;
  doc: PMNode;
  gate: GateResult;
  composition: Composition;
  /** Which section the caret is in, by LOINC code. */
  activeSection: string | null;
  canUndo: boolean;
  canRedo: boolean;
  showOrigins: boolean;
  setShowOrigins: (next: boolean) => void;
  /** Toolbar commands. Each returns focus to the document. */
  cmd: {
    undo: () => void;
    redo: () => void;
    bold: () => void;
    italic: () => void;
    /** Move the caret to the next unfilled blank, wrapping. This is F2. */
    nextBlank: () => void;
    goToSection: (code: string) => void;
    insertPhrase: (phrase: Phrase) => void;
    /** Mark an AI range reviewed — what unblocks the sign button. */
    acceptAiAt: (from: number, to: number) => void;
    acceptAllAi: () => void;
  };
  blankCount: number;
}

function decorateOrigins(doc: PMNode, show: boolean): DecorationSet {
  if (!show) return DecorationSet.empty;

  const decorations = provenanceRanges(doc)
    .filter((range) => range.origin !== "typed")
    .map((range) =>
      Decoration.inline(range.from, range.to, {
        class: ORIGIN_CLASS[range.origin],
        // Read by assistive technology on caret entry, and by the tooltip.
        "data-ox-origin": range.origin,
        title:
          range.origin === "ai" && !range.attrs.reviewed
            ? `${ORIGIN_LABEL[range.origin]} — not yet reviewed`
            : ORIGIN_LABEL[range.origin],
      }),
    );

  return DecorationSet.create(doc, decorations);
}

export function useClinicalNote(options: UseClinicalNoteOptions): ClinicalNoteApi {
  const { value, onChange, rules, gateContext, readOnly = false, label } = options;

  const viewRef = React.useRef<EditorView | null>(null);
  const [doc, setDoc] = React.useState<PMNode>(value);
  const [showOrigins, setShowOriginsState] = React.useState(false);
  const [histState, setHistState] = React.useState({ canUndo: false, canRedo: false });
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  // Kept in refs so the ProseMirror dispatch closure never goes stale without
  // tearing the view down and rebuilding it, which would lose the selection.
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const showOriginsRef = React.useRef(showOrigins);
  showOriginsRef.current = showOrigins;

  const readState = React.useCallback((state: EditorState) => {
    setDoc(state.doc);
    setHistState({
      canUndo: undo(state),
      canRedo: redo(state),
    });
    const $from = state.selection.$from;
    const section = $from.depth > 0 ? $from.node(1) : null;
    setActiveSection(
      section && section.type.name === "section" ? String(section.attrs["code"] ?? "") : null,
    );
  }, []);

  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      if (!node) return;

      const state = EditorState.create({
        doc: value,
        plugins: [
          history(),
          keymap({
            "Mod-z": undo,
            "Mod-y": redo,
            "Shift-Mod-z": redo,
            "Mod-b": toggleMark(MARKS.strong),
            "Mod-i": toggleMark(MARKS.em),
            // F2 walks the blanks a template left behind. Muscle memory from
            // every SmartList a US clinician has ever filled in.
            F2: (editorState, dispatch) => {
              const next = nextBlank(editorState.doc, editorState.selection.from);
              if (!next || !dispatch) return false;
              dispatch(
                editorState.tr.setSelection(TextSelection.near(editorState.doc.resolve(next.pos))),
              );
              return true;
            },
          }),
          keymap(baseKeymap),
        ],
      });

      const view = new EditorView(node, {
        state,
        editable: () => !readOnly,
        attributes: {
          class: "ox-note-doc",
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": label,
        },
        decorations: (s) => decorateOrigins(s.doc, showOriginsRef.current),
        dispatchTransaction(tr: Transaction) {
          const next = view.state.apply(tr);
          view.updateState(next);
          readState(next);
          if (tr.docChanged) onChangeRef.current?.(next.doc);
        },
      });

      viewRef.current = view;
      readState(state);
    },
    // `value` is the initial document only; resetting it is the host's job via
    // a `key`. Rebuilding the view on every keystroke would destroy the caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readOnly, readState, label],
  );

  React.useEffect(() => {
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  /**
   * Flip the ribbon and force a redraw in the same step.
   *
   * `decorations` reads a ref, so ProseMirror needs a transaction to know
   * anything changed. Doing it here rather than in an effect keeps the toggle
   * a single code path — the effect version had to guard on a view that is
   * always present by the time anything can call this.
   */
  const setShowOrigins = React.useCallback((next: boolean) => {
    setShowOriginsState(next);
    showOriginsRef.current = next;
    viewRef.current?.dispatch(viewRef.current.state.tr.setMeta("ox-origins", next));
  }, []);

  const run = React.useCallback((fn: (view: EditorView) => void) => {
    const view = viewRef.current;
    if (!view) return;
    fn(view);
    view.focus();
  }, []);

  const cmd = React.useMemo<ClinicalNoteApi["cmd"]>(
    () => ({
      undo: () => run((view) => undo(view.state, view.dispatch)),
      redo: () => run((view) => redo(view.state, view.dispatch)),
      bold: () => run((view) => toggleMark(MARKS.strong)(view.state, view.dispatch)),
      italic: () => run((view) => toggleMark(MARKS.em)(view.state, view.dispatch)),
      nextBlank: () =>
        run((view) => {
          const next = nextBlank(view.state.doc, view.state.selection.from);
          if (!next) return;
          view.dispatch(
            view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(next.pos))),
          );
        }),
      goToSection: (code) =>
        run((view) => {
          const found = sections(view.state.doc).find((s) => sectionAttrs(s.node).code === code);
          if (!found) return;
          view.dispatch(
            view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(found.pos + 1))),
          );
        }),
      insertPhrase: (phrase) =>
        run((view) => {
          const { content } = expand(phrase.body);
          const { from, to } = view.state.selection;
          // One transaction, so the whole expansion is a single undo step
          // rather than four hundred keystrokes.
          view.dispatch(view.state.tr.replaceWith(from, to, content).scrollIntoView());
        }),
      acceptAiAt: (from, to) => run((view) => view.dispatch(markReviewed(view.state, from, to))),
      acceptAllAi: () =>
        run((view) => {
          let tr = view.state.tr;
          for (const range of provenanceRanges(
            view.state.doc,
            (a) => a.origin === "ai" && !a.reviewed,
          )) {
            tr = applyReviewed(tr, range.from, range.to, range.attrs);
          }
          if (tr.docChanged || tr.steps.length > 0) view.dispatch(tr);
        }),
    }),
    [run],
  );

  const gate = React.useMemo(() => runGate(doc, rules, gateContext), [doc, rules, gateContext]);
  const stats = React.useMemo(() => composition(doc), [doc]);
  const blankCount = React.useMemo(() => blanks(doc).length, [doc]);

  return {
    ref,
    doc,
    gate,
    composition: stats,
    activeSection,
    canUndo: histState.canUndo,
    canRedo: histState.canRedo,
    showOrigins,
    setShowOrigins,
    cmd,
    blankCount,
  };
}

/* ------------------------------------------------------------------ */
/* Marking generated text as read                                      */
/* ------------------------------------------------------------------ */

function applyReviewed(
  tr: Transaction,
  from: number,
  to: number,
  attrs: ProvenanceAttrs,
): Transaction {
  const reviewed = provenance({ ...attrs, origin: "ai", reviewed: true });
  return tr
    .removeMark(from, to, MARKS.provenance)
    .addMark(from, to, MARKS.provenance.create(reviewed as unknown as Record<string, unknown>));
}

function markReviewed(state: EditorState, from: number, to: number): Transaction {
  let tr = state.tr;
  for (const range of provenanceRanges(state.doc, (a) => a.origin === "ai" && !a.reviewed)) {
    if (range.from >= from && range.to <= to) {
      tr = applyReviewed(tr, range.from, range.to, range.attrs);
    }
  }
  return tr;
}

/* ------------------------------------------------------------------ */
/* Building documents for demos and hosts                              */
/* ------------------------------------------------------------------ */

/** One paragraph of text carrying a single origin. */
export function para(text: string, origin: Origin = "typed", extra: Partial<ProvenanceAttrs> = {}) {
  const attrs = provenance({ ...extra, origin });
  return NODES.paragraph.create(
    null,
    text === ""
      ? undefined
      : noteSchema.text(text, [
          MARKS.provenance.create(attrs as unknown as Record<string, unknown>),
        ]),
  );
}

/** A paragraph assembled from several differently-attributed runs. */
export function mixed(...runs: [string, Origin, Partial<ProvenanceAttrs>?][]) {
  return NODES.paragraph.create(
    null,
    Fragment.from(
      runs.map(([text, origin, extra]) =>
        noteSchema.text(text, [
          MARKS.provenance.create(
            provenance({ ...(extra ?? {}), origin }) as unknown as Record<string, unknown>,
          ),
        ]),
      ),
    ),
  );
}

/** A coded section. */
export function noteSection(
  attrs: { code: string; title: string; required?: boolean },
  ...content: PMNode[]
) {
  return NODES.section.create(
    { code: attrs.code, title: attrs.title, required: attrs.required ?? false },
    content.length > 0 ? content : [NODES.paragraph.create()],
  );
}

/** A whole note. */
export function noteDoc(...content: PMNode[]) {
  return NODES.doc.create(null, content);
}
