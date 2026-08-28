"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/clinical-note/clinical-note.tsx. Edit that file, not this one.
/**
 * ClinicalNote — a note editor that knows who wrote every character.
 *
 * A rich text editor is a solved problem; a clinical note is not. Every
 * character in one has an origin: the clinician typed it, dictated it, a
 * template fired it, it was pulled from a lab result, it was copied forward
 * from a note about a different admission, or a model wrote it. In every EHR
 * shipping today all of that collapses into identical black text the moment it
 * lands on screen — and the clinician signs, attesting to all of it equally.
 *
 * Three well-documented problems fall out of that one missing structure. A 2022
 * analysis of over 100 million notes found 50.1% of note text duplicated from
 * prior documentation on the same patient. Copy-and-paste has been implicated
 * in roughly a third of errors in ambulatory patient-safety analyses. And CMS's
 * July 2025 signature guidance treats an AI scribe exactly as it treats a human
 * one: the clinician signs, and owns every word, whether or not the tool is
 * named.
 *
 * Storing origin per range does not solve any of those. It makes all three
 * *visible*, which is the prerequisite — and it is what turns "I reviewed it"
 * from an unfalsifiable claim into something the sign button can check.
 *
 * The engine is `@oxygenui-design/clinical-note-core`: schema, provenance,
 * gate rules and serializers, with no DOM and no React. This file is the skin.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  DEFAULT_RULES,
  ORIGINS,
  NODES,
  emptyNote,
  formatDuration,
  sectionAttrs,
  sections,
  toText,
  type Finding,
  type GateContext,
  type GateRule,
  type NoteTypeDef,
  type NoteTypeName,
  type Origin,
  type Phrase,
} from "@oxygenui-design/clinical-note-core";
import type { Node as PMNode } from "prosemirror-model";
import { ORIGIN_LABEL, useClinicalNote, type ClinicalNoteApi } from "../../lib/clinical-note";

export {
  ORIGIN_LABEL,
  useClinicalNote,
  mixed,
  noteDoc,
  noteSection,
  para,
} from "../../lib/clinical-note";

/* ------------------------------------------------------------------ */
/* Glyphs                                                              */
/* ------------------------------------------------------------------ */

/**
 * Inline, on a 24px grid with a 2px stroke — Lucide's geometry.
 *
 * Inline rather than a dependency because a registry component is copied into
 * a customer's repository, and adding an icon package to their bundle for six
 * glyphs is a decision that should be theirs.
 */
function Icon({ path, className }: { path: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}

const UndoIcon = () => (
  <Icon
    path={
      <>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </>
    }
  />
);
const RedoIcon = () => (
  <Icon
    path={
      <>
        <path d="m15 14 5-5-5-5" />
        <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
      </>
    }
  />
);
const BoldIcon = () => (
  <Icon path={<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />} />
);
const ItalicIcon = () => (
  <Icon
    path={
      <>
        <path d="M19 4h-9" />
        <path d="M14 20H5" />
        <path d="m15 4-6 16" />
      </>
    }
  />
);
const OriginsIcon = () => (
  <Icon
    path={
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 18a6 6 0 0 0 0-12z" fill="currentColor" stroke="none" />
      </>
    }
  />
);
const BlockIcon = () => (
  <Icon
    path={
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </>
    }
  />
);
const WarnIcon = () => (
  <Icon
    path={
      <>
        <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    }
  />
);
const PassIcon = () => (
  <Icon
    path={
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </>
    }
  />
);
const ShieldIcon = () => (
  <Icon
    path={
      <>
        <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </>
    }
  />
);

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

/** Who the note is about. Two independent identifiers, minimum. */
export interface NoteSubject {
  /** FHIR reference, e.g. `Patient/4471902`. */
  reference: string;
  /** Family-name-first, as a chart banner shows it. */
  display: string;
  /** Medical record number, or whatever your deployment's second identifier is. */
  identifier?: string;
  /** Rendered verbatim. Ambiguity in a date of birth is a wrong-patient event. */
  birthDate?: string;
  /** Free text: "30y M", "Bed 4E-12". */
  detail?: string;
}

/** Who is writing, and whether someone else has to countersign. */
export interface NoteAuthor {
  display: string;
  /** "Resident", "Attending", "Scribe" — shown beside the name. */
  role?: string;
  requiresCosign?: boolean;
}

/** What the host is doing with the draft, said honestly. */
export type SaveState =
  | { kind: "saved"; at: string }
  | { kind: "saving" }
  | { kind: "offline"; pending: number }
  | { kind: "failed"; reason?: string };

export type CommitKind = "draft" | "sign" | "addend";

export interface ClinicalNoteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Who the note is about. Never optional — it is the wrong-patient mitigation. */
  subject: NoteSubject;
  /**
   * Who is writing. Distinct from `recordedBy` on the signature: the person composing and the
   * person attesting are not always the same.
   */
  author: NoteAuthor;
  /** Decides which sections exist and which of them block a signature. */
  noteType: NoteTypeName | NoteTypeDef;
  /** The document. Defaults to an empty note of `noteType`. */
  value?: PMNode;
  /** Fired as the note is edited, with the origin of the edit preserved. */
  onChange?: (doc: PMNode) => void;
  /**
   * The instant the gate is evaluated against, from the host's clock.
   *
   * Required, and there is no default. A browser clock on a ward workstation
   * is not evidence, and 42 CFR 482.24(c)(1) wants entries dated, timed and
   * authenticated. Passing `new Date()` is a decision the host makes, not one
   * this component makes silently on their behalf.
   */
  now: Date;
  /** Extra gate rules, appended to the defaults. */
  rules?: readonly GateRule[];
  /** Overrides for the default gate context — thresholds, mostly. */
  gateOptions?: Partial<Omit<GateContext, "noteType" | "now" | "subject">>;
  /** Dot phrases. None ship in the package; a phrase library is yours. */
  phrases?: readonly Phrase[];
  /** Draft state, shown in the status strip. Never a silent spinner. */
  saveState?: SaveState;
  /**
   * Fired for each of the three commits.
   *
   * Three verbs with three legal meanings, never one blue Save: `draft` is
   * reversible, `sign` is not, and `addend` is the only legal operation on a
   * note that has already been signed.
   */
  onCommit?: (kind: CommitKind, doc: PMNode, acknowledged: string[]) => void;
  /** Renders the signed reader instead of the editor. */
  readOnly?: boolean;
  /** The attestation sentence. Wording is a legal and organisational decision. */
  attestation?: string;
  /** Absolute, with offset — the created/edited line under the document. */
  timestampLine?: string;
  /**
   * Accessible name for the editable region. Defaults to "Note body".
   *
   * User-visible text, so it is a prop: a deployment in another language needs
   * to be able to change it.
   */
  editorLabel?: string;
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Banner({ subject, status }: { subject: NoteSubject; status: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--ox-border)] px-5 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-[var(--ox-text)]">
            {subject.display}
          </span>
          {status}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs tabular-nums text-[var(--ox-text-muted)]">
          {subject.identifier ? <span>MRN {subject.identifier}</span> : null}
          {subject.birthDate ? <span>· DOB {subject.birthDate}</span> : null}
          {subject.detail ? <span>· {subject.detail}</span> : null}
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // A toolbar is one tab stop, not fifteen. Arrow keys move within it; the
      // roving tabindex is managed by the toolbar below.
      tabIndex={-1}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-md px-1.5",
        "text-[var(--ox-text-muted)] transition-colors",
        "hover:bg-[var(--ox-surface-raised)] hover:text-[var(--ox-text)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]",
        "disabled:pointer-events-none disabled:opacity-40",
        pressed && "bg-[var(--ox-accent-subtle)] text-[var(--ox-accent-hover)]",
      )}
    >
      {children}
    </button>
  );
}

/**
 * The toolbar, as one tab stop with arrow-key movement.
 *
 * The WAI-ARIA toolbar pattern, and it is not decoration: fifteen individually
 * focusable buttons means fifteen Tab presses between the document and the
 * sign button, every single time, for anyone who does not use a mouse.
 */
function Toolbar({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(0);

  const buttons = React.useCallback(
    () =>
      Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []),
    [],
  );

  React.useEffect(() => {
    const all = buttons();
    all.forEach((button, i) => (button.tabIndex = i === active ? 0 : -1));
  });

  function onKeyDown(event: React.KeyboardEvent) {
    const all = buttons();
    if (all.length === 0) return;

    // One decision, one place. The previous shape computed the target twice —
    // once to decide whether the key was ours, once to act on it — which is
    // how the two got to disagree about Home and End.
    const target = ((): number | null => {
      switch (event.key) {
        case "ArrowRight":
          return (active + 1) % all.length;
        case "ArrowLeft":
          return (active - 1 + all.length) % all.length;
        case "Home":
          return 0;
        case "End":
          return all.length - 1;
        default:
          // Anything else belongs to the host, or to type-ahead.
          return null;
      }
    })();

    if (target === null) return;
    event.preventDefault();
    setActive(target);
    all[target]?.focus();
  }

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className="flex flex-wrap items-center gap-1 border-b border-[var(--ox-border)] px-4 py-1.5"
    >
      {children}
    </div>
  );
}

function Cluster({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-lg bg-[var(--ox-bg-subtle)] p-0.5">
      {children}
    </span>
  );
}

/** The 100%-stacked bar. Five swatch rows is a legend; this is the data. */
function OriginBar({ ratio }: { ratio: Record<Origin, number> }) {
  const present = ORIGINS.filter((origin) => ratio[origin] > 0);
  return (
    <div
      className="flex h-2 overflow-hidden rounded-full ring-1 ring-inset ring-[var(--ox-border)]"
      role="img"
      aria-label={present
        .map((origin) => `${ORIGIN_LABEL[origin]} ${Math.round(ratio[origin] * 100)}%`)
        .join(", ")}
    >
      {present.map((origin) => (
        <span
          key={origin}
          data-origin={origin}
          className="ox-note-bar block h-full"
          style={{ width: `${ratio[origin] * 100}%` }}
        />
      ))}
    </div>
  );
}

function SeverityIcon({ severity }: { severity: Finding["severity"] }) {
  if (severity === "block") return <BlockIcon />;
  if (severity === "warn") return <WarnIcon />;
  return <PassIcon />;
}

/**
 * The sign gate.
 *
 * Three severities and only one of them stops you. A gate that blocks on
 * everything is routed around within a week; one that blocks on nothing is
 * decoration. Warnings are shown, counted, and handed to `onCommit` so the
 * host can record them — a signature over a note with five acknowledged
 * warnings is a different artifact from one with none.
 */
export function SignGate({
  findings,
  canSign,
  attestation,
  author,
  onSign,
  onCancel,
  onNavigate,
}: {
  /**
   * What is standing between this note and a signature, each with a severity.
   *
   * Rendered in full rather than summarised: "3 issues" tells an author to
   * hunt, and the point of the gate is that it already knows.
   */
  findings: readonly Finding[];
  /** Whether policy permits this author to sign at all. Separate from whether the findings currently allow it. */
  canSign: boolean;
  /** The sentence being signed. Shown before the control, never after the decision. */
  attestation?: string;
  /** Who is signing, and in what capacity. */
  author: NoteAuthor;
  /** Fired with the ids of every finding the author acknowledged on the way through. Acknowledgement is part of the record, not a dismissal. */
  onSign?: (acknowledged: string[]) => void;
  /** Fired when the author backs out of signing. The draft is untouched. */
  onCancel?: () => void;
  /** Fired when the author jumps to the passage a finding is about. Without it a finding names a problem and offers no way to reach it. */
  onNavigate?: (finding: Finding) => void;
}) {
  const [attested, setAttested] = React.useState(false);
  const blocking = findings.filter((f) => f.severity === "block");
  const warnings = findings.filter((f) => f.severity === "warn");
  const passed = findings.filter((f) => f.severity === "pass");

  return (
    <div className="flex flex-col gap-4" data-testid="sign-gate">
      <div
        role="status"
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
          blocking.length > 0
            ? "bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]"
            : "bg-[var(--ox-status-normal-bg)] text-[var(--ox-status-normal)]",
        )}
      >
        <SeverityIcon severity={blocking.length > 0 ? "block" : "pass"} />
        <span>
          <strong className="font-semibold">{blocking.length} blocking</strong> · {warnings.length}{" "}
          {warnings.length === 1 ? "warning" : "warnings"} · {passed.length} passed
        </span>
      </div>

      <ul className="divide-y divide-[var(--ox-border)] overflow-hidden rounded-lg border border-[var(--ox-border)]">
        {findings.map((finding) => (
          <li
            key={finding.id}
            className={cn(
              "grid grid-cols-[auto_1fr_auto] items-start gap-3 px-3 py-2.5 text-sm",
              finding.severity === "block" &&
                "bg-[color-mix(in_oklab,var(--ox-status-critical-bg)_30%,transparent)]",
            )}
          >
            <span
              className={cn(
                "mt-0.5",
                finding.severity === "block" && "text-[var(--ox-status-critical)]",
                finding.severity === "warn" && "text-[var(--ox-status-high)]",
                finding.severity === "pass" && "text-[var(--ox-status-normal)]",
              )}
            >
              <SeverityIcon severity={finding.severity} />
            </span>
            <span className="min-w-0">
              <span className="text-[var(--ox-text)]">{finding.title}</span>
              {finding.detail ? (
                <span className="mt-0.5 block text-xs text-[var(--ox-text-muted)]">
                  {finding.detail}{" "}
                  {finding.at && onNavigate ? (
                    <button
                      type="button"
                      onClick={() => onNavigate(finding)}
                      className="text-[var(--ox-accent)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]"
                    >
                      Go to it
                    </button>
                  ) : null}
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                finding.severity === "block" &&
                  "bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
                finding.severity === "warn" &&
                  "bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
                finding.severity === "pass" &&
                  "bg-[var(--ox-status-normal-bg)] text-[var(--ox-status-normal)]",
              )}
            >
              {finding.severity === "block"
                ? "Blocks"
                : finding.severity === "warn"
                  ? "Warns"
                  : "Pass"}
            </span>
          </li>
        ))}
      </ul>

      {attestation ? (
        <label className="flex items-start gap-2 border-t border-[var(--ox-border)] pt-4 text-sm">
          <input
            type="checkbox"
            checked={attested}
            onChange={(event) => setAttested(event.target.checked)}
            className="mt-0.5 size-4 accent-[var(--ox-accent)]"
          />
          <span>
            <span className="text-[var(--ox-text)]">{attestation}</span>
            <span className="mt-1 block text-xs text-[var(--ox-text-muted)]">
              Signing as <strong className="font-medium">{author.display}</strong>
              {author.role ? ` · ${author.role}` : null}
              {author.requiresCosign ? " · a countersignature will be requested" : null}
            </span>
          </span>
        </label>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-md px-3 text-sm text-[var(--ox-text-muted)] hover:bg-[var(--ox-surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]"
        >
          Back to note
        </button>
        <button
          type="button"
          disabled={!canSign || (Boolean(attestation) && !attested)}
          onClick={() => onSign?.(warnings.map((warning) => warning.id))}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium",
            "bg-[var(--ox-accent)] text-[var(--ox-text-on-accent)]",
            "hover:bg-[var(--ox-accent-hover)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]",
            "disabled:pointer-events-none disabled:opacity-45",
          )}
        >
          <ShieldIcon />
          Sign
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reader                                                              */
/* ------------------------------------------------------------------ */

export interface Attestation {
  who: string;
  role?: string;
  /** Absolute, with offset. "Today, 14:38" is not a record. */
  when: string;
  statement?: string;
}

export interface Addendum {
  author: string;
  when: string;
  text: string;
}

/**
 * A signed note, read-only, with its addenda.
 *
 * Separate from the editor on purpose: most people who open a note never edit
 * one, and this path loads no ProseMirror view at all.
 *
 * The original text is never shown as corrected — it is shown as superseded.
 * Both statements stand, in order, with their own authors and times. That is
 * the difference between a record and a document, and it is what makes the
 * chart admissible.
 */
export function ClinicalNoteReader({
  subject,
  title,
  doc,
  attestations = [],
  addenda = [],
  className,
  ...rest
}: {
  /** Who the note is about. Rendered so a reader can check the chart before believing the note. */
  subject: NoteSubject;
  /** The note's heading, and the article's accessible name. */
  title: string;
  /** The signed document. Read-only by construction — this component has no editing path at all. */
  doc: PMNode;
  /**
   * Signatures on the note, in order.
   *
   * A countersignature is another attestation rather than a second copy of the
   * first, so each carries its own signer, capacity and time.
   */
  attestations?: readonly Attestation[];
  /**
   * Addenda appended after signing.
   *
   * Never merged into the body: an addendum is a separate authored act, and
   * folding it into the original text would rewrite what somebody signed.
   */
  addenda?: readonly Addendum[];
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--ox-border)] bg-[var(--ox-surface)]",
        className,
      )}
      aria-label={`${title}, signed`}
      // A signed note is read in the same chart, at the same density, as the
      // editor that produced it.
      data-ox-density="clinical"
      {...rest}
    >
      <Banner
        subject={subject}
        status={
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ox-status-normal-bg)] px-2 py-0.5 text-xs font-medium text-[var(--ox-status-normal)]">
            <ShieldIcon />
            Signed
          </span>
        }
      />

      <div className="space-y-5 px-5 py-4">
        <dl className="overflow-hidden rounded-lg border border-[var(--ox-border)] text-sm">
          {attestations.map((attestation) => (
            <div
              key={`${attestation.who}-${attestation.when}`}
              className="grid grid-cols-[minmax(7rem,10rem)_1fr] border-b border-[var(--ox-border)] last:border-b-0"
            >
              <dt className="bg-[var(--ox-bg-subtle)] px-3 py-2 text-[var(--ox-text-muted)]">
                {attestation.statement ? "Attestation" : "Signed by"}
              </dt>
              <dd className="px-3 py-2">
                <span className="text-[var(--ox-text)]">
                  {attestation.who}
                  {attestation.role ? ` · ${attestation.role}` : null}
                </span>
                <span className="mt-0.5 block text-xs tabular-nums text-[var(--ox-text-muted)]">
                  {attestation.when}
                </span>
                {attestation.statement ? (
                  <span className="mt-1 block text-[var(--ox-text-muted)]">
                    “{attestation.statement}”
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>

        <div className="ox-note-doc ox-note-read max-w-[74ch]">
          {sections(doc).map(({ node }) => {
            const { code, title } = sectionAttrs(node);
            // One section at a time through the same serializer the export
            // uses, so the reader can never drift from the transmitted text.
            const lines = toText(NODES.doc.create(null, [node]))
              .trim()
              .split("\n")
              .slice(1);
            if (lines.length === 0) return null;
            return (
              <section key={code}>
                <h3>{title}</h3>
                {lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </section>
            );
          })}
        </div>

        {addenda.map((addendum, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-[var(--ox-border)]">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--ox-bg-subtle)] px-3 py-2 text-xs tabular-nums text-[var(--ox-text-muted)]">
              <span>
                <strong className="font-semibold text-[var(--ox-text)]">Addendum {i + 1}</strong> ·{" "}
                {addendum.author} · {addendum.when}
              </span>
            </div>
            <p className="px-3 py-3 text-sm text-[var(--ox-text)]">{addendum.text}</p>
          </div>
        ))}

        <p className="rounded-md bg-[var(--ox-status-low-bg)] px-3 py-2 text-sm text-[var(--ox-text-muted)]">
          The signed note above cannot be edited. Corrections are made by adding a further addendum.
        </p>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* The editor                                                          */
/* ------------------------------------------------------------------ */

function SaveStateLine({ state }: { state?: SaveState }) {
  if (!state) return null;
  const tone =
    state.kind === "failed" ? "danger" : state.kind === "offline" ? "warning" : "success";
  const text =
    state.kind === "saved"
      ? `Saved ${state.at}`
      : state.kind === "saving"
        ? "Saving…"
        : state.kind === "offline"
          ? `Offline — ${state.pending} change${state.pending === 1 ? "" : "s"} held locally`
          : `Not saved${state.reason ? ` — ${state.reason}` : ""}`;

  return (
    // Polite for ordinary transitions; a failed save is the one a clinician has
    // to hear about, because the alternative is losing twenty minutes of work.
    <span
      className="inline-flex items-center gap-1.5"
      role="status"
      aria-live={state.kind === "failed" ? "assertive" : "polite"}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" && "bg-[var(--ox-status-normal)]",
          tone === "warning" && "bg-[var(--ox-status-high)]",
          tone === "danger" && "bg-[var(--ox-status-critical)]",
        )}
      />
      <span className="tabular-nums">{text}</span>
    </span>
  );
}

export function ClinicalNote({
  subject,
  author,
  noteType,
  value,
  onChange,
  now,
  rules,
  gateOptions,
  phrases,
  saveState,
  onCommit,
  readOnly = false,
  attestation,
  timestampLine,
  editorLabel = "Note body",
  className,
  ...rest
}: ClinicalNoteProps) {
  const initial = React.useMemo(() => value ?? emptyNote(noteType), [value, noteType]);

  const allRules = React.useMemo<readonly GateRule[]>(
    () => (rules ? [...DEFAULT_RULES, ...rules] : DEFAULT_RULES),
    [rules],
  );
  const gateContext = React.useMemo<GateContext>(
    () => ({ ...gateOptions, noteType, now, subject: subject.reference }),
    [gateOptions, noteType, now, subject.reference],
  );

  const api: ClinicalNoteApi = useClinicalNote({
    value: initial,
    onChange,
    rules: allRules,
    gateContext,
    phrases,
    readOnly,
    label: editorLabel,
  });

  const [gateOpen, setGateOpen] = React.useState(false);
  const noteSections = React.useMemo(() => sections(api.doc), [api.doc]);
  const copied = Math.round(api.composition.ratio.copied * 100);
  const unreviewed = api.gate.findings.find(
    (f: Finding) => f.id === "unreviewed-ai" && f.severity === "block",
  );

  return (
    <div
      className={cn(
        "ox-note flex flex-col overflow-hidden rounded-xl border border-[var(--ox-border)] bg-[var(--ox-surface)]",
        className,
      )}
      data-ox-density="clinical"
      {...rest}
    >
      <Banner
        subject={subject}
        status={
          <span className="rounded-full bg-[var(--ox-status-low-bg)] px-2 py-0.5 text-xs font-medium text-[var(--ox-status-low)]">
            Draft
          </span>
        }
      />

      <Toolbar label="Note formatting and insertion">
        <Cluster>
          <ToolButton label="Undo" onClick={api.cmd.undo} disabled={!api.canUndo}>
            <UndoIcon />
          </ToolButton>
          <ToolButton label="Redo" onClick={api.cmd.redo} disabled={!api.canRedo}>
            <RedoIcon />
          </ToolButton>
        </Cluster>
        <Cluster>
          <ToolButton label="Bold" onClick={api.cmd.bold}>
            <BoldIcon />
          </ToolButton>
          <ToolButton label="Italic" onClick={api.cmd.italic}>
            <ItalicIcon />
          </ToolButton>
        </Cluster>
        {api.blankCount > 0 ? (
          <ToolButton
            label={`Go to next blank, ${api.blankCount} remaining`}
            onClick={api.cmd.nextBlank}
          >
            <span className="font-mono text-[11px]">✳ {api.blankCount}</span>
            <kbd className="rounded border border-[var(--ox-border)] px-1 font-mono text-[10px] text-[var(--ox-text-muted)]">
              F2
            </kbd>
          </ToolButton>
        ) : null}
        <span className="flex-1" />
        <ToolButton
          label="Show where each passage came from"
          pressed={api.showOrigins}
          onClick={() => api.setShowOrigins(!api.showOrigins)}
        >
          <OriginsIcon />
          <span className="text-xs">Origins</span>
        </ToolButton>
      </Toolbar>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--ox-border)] bg-[var(--ox-bg-subtle)] px-4 py-1.5 text-xs text-[var(--ox-text-muted)]">
        <SaveStateLine state={saveState} />
        <span>
          <strong className="font-semibold text-[var(--ox-text)]">{author.display}</strong>
          {author.role ? ` · ${author.role}` : null}
          {author.requiresCosign ? " · cosign required" : null}
        </span>
        <span className="flex-1" />
        {copied > 0 ? (
          <span className="rounded-full bg-[var(--ox-status-high-bg)] px-2 py-0.5 tabular-nums text-[var(--ox-status-high)]">
            {copied}% copied forward
          </span>
        ) : null}
        {unreviewed ? (
          <span className="rounded-full bg-[var(--ox-status-normal-bg)] px-2 py-0.5 text-[var(--ox-status-normal)]">
            {unreviewed.title}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-[20rem] flex-col sm:flex-row">
        <nav
          aria-label="Sections"
          className="shrink-0 border-b border-[var(--ox-border)] px-2 py-3 sm:w-56 sm:border-b-0 sm:border-e"
        >
          <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--ox-text-muted)]">
            {noteSections.length} sections
          </p>
          <ul>
            {noteSections.map(({ node }) => {
              const { code, title, required } = sectionAttrs(node);
              const empty = node.textContent.trim() === "";
              return (
                <li key={code}>
                  <button
                    type="button"
                    onClick={() => api.cmd.goToSection(code)}
                    aria-current={api.activeSection === code ? "true" : undefined}
                    className={cn(
                      "relative flex w-full items-center justify-between gap-2 rounded-md py-1.5 ps-3 pe-2 text-start text-[13px]",
                      "text-[var(--ox-text-muted)] hover:bg-[var(--ox-surface-raised)]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]",
                      api.activeSection === code &&
                        "bg-[var(--ox-accent-subtle)] font-medium text-[var(--ox-accent-hover)] before:absolute before:inset-y-1.5 before:start-0 before:w-0.5 before:rounded before:bg-[var(--ox-accent)]",
                    )}
                  >
                    <span className="truncate">{title}</span>
                    {required && empty ? (
                      <span className="shrink-0 rounded-full bg-[var(--ox-status-critical-bg)] px-1.5 text-[10px] text-[var(--ox-status-critical)]">
                        required
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {api.composition.total > 0 ? (
            <div className="mt-4 border-t border-[var(--ox-border)] px-2 pt-3">
              <p className="pb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--ox-text-muted)]">
                Origins
              </p>
              <OriginBar ratio={api.composition.ratio} />
              <ul className="mt-2 space-y-1 text-[11px] tabular-nums text-[var(--ox-text-muted)]">
                {ORIGINS.filter((origin) => api.composition.ratio[origin] > 0).map((origin) => (
                  <li key={origin} className="flex items-center gap-2">
                    <span data-origin={origin} className="ox-note-bar size-2 rounded-sm" />
                    <span className="flex-1">{ORIGIN_LABEL[origin]}</span>
                    <span>{Math.round(api.composition.ratio[origin] * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>

        <div className="min-w-0 flex-1 px-6 py-5">
          <div ref={api.ref} className="max-w-[74ch]" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ox-border)] px-5 py-3">
        <p className="text-xs tabular-nums text-[var(--ox-text-muted)]">{timestampLine}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onCommit?.("draft", api.doc, [])}
            className="h-9 rounded-md border border-[var(--ox-border)] px-3 text-sm text-[var(--ox-text)] hover:bg-[var(--ox-surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => setGateOpen(true)}
            aria-describedby={api.gate.canSign ? undefined : "ox-note-blocked"}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium",
              "bg-[var(--ox-accent)] text-[var(--ox-text-on-accent)] hover:bg-[var(--ox-accent-hover)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]",
              !api.gate.canSign && "opacity-60",
            )}
          >
            <ShieldIcon />
            Sign &amp; file
          </button>
          {!api.gate.canSign ? (
            <span id="ox-note-blocked" className="sr-only">
              {api.gate.blocking.length} item
              {api.gate.blocking.length === 1 ? "" : "s"} must be resolved before this note can be
              signed.
            </span>
          ) : null}
        </div>
      </div>

      {gateOpen ? (
        <div className="border-t border-[var(--ox-border)] bg-[var(--ox-bg-subtle)] px-5 py-4">
          <SignGate
            findings={api.gate.findings}
            canSign={api.gate.canSign}
            attestation={attestation}
            author={author}
            onCancel={() => setGateOpen(false)}
            onNavigate={(finding) => {
              setGateOpen(false);
              if (finding.id === "unreviewed-ai") api.cmd.acceptAllAi();
            }}
            onSign={(acknowledged) => {
              setGateOpen(false);
              onCommit?.("sign", api.doc, acknowledged);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

ClinicalNote.Reader = ClinicalNoteReader;
ClinicalNote.SignGate = SignGate;

export { formatDuration };
