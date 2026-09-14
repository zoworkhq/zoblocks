"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/copilot/copilot.tsx. Edit that file, not this one.
/**
 * Copilot — a floating clinical copilot, as copy-as-source.
 *
 * This is the second skin over `@zoblocks/copilot-react`. The antd skin
 * (`@zoblocks/copilot`) is the first. Both are thin: the engine, the
 * safety pipeline, the streaming announcement strategy, the combobox keyboard
 * model and the citation segmentation all live in the two npm packages, so the
 * two skins cannot drift on any of the parts where drifting would be an
 * accessibility or safety defect.
 *
 * That split is what lets this component stay copyable. A registry item that
 * had to carry the crisis classifier and the audit mapping inline would be
 * thousands of lines nobody would read before pasting, and a safety control
 * nobody reads is not a safety control.
 *
 * Three props are worth reading before you use it:
 *
 *   `suppressed` — removes the component entirely. Set it while the clinician
 *   is administering medication or signing orders. Interruptions during those
 *   tasks measurably increase clinical errors, and the FDA's 2026 CDS guidance
 *   moved time-critical use under the criterion about independent review for
 *   the same reason. The most valuable thing this component does is disappear.
 *
 *   `context` — the resolver. Without one, only modes that read nothing will
 *   run. That is deliberate: reference lookup is the safest first deployment
 *   and needs no BAA covering patient data in the model call.
 *
 *   `provider` — targets *your* endpoint, never a model vendor. There is no
 *   apiKey prop and no way to add one.
 */

import * as React from "react";
import {
  ChevronDownIcon,
  CloseIcon,
  CopyIcon,
  InsertIcon,
  LockIcon,
  MicIcon,
  NewChatIcon,
  PersonIcon,
  SendIcon,
  ShortcutIcon,
  SparkIcon,
  StopIcon,
  ThoughtIcon,
  ThumbDownIcon,
  ThumbUpIcon,
  VerifyIcon,
  CopilotAnswerRegion,
  CopilotDockRegion,
  CopilotLiveRegion,
  CopilotRoot,
  citationLabel,
  modeIcon,
  segmentAnswer,
  useCopilot,
  useShortcutMenu,
  useSummonShortcut,
  type CopilotShortcut,
  type UseCopilotOptions,
} from "@zoblocks/copilot-react";
import { cn } from "../../lib/utils";

export interface CopilotProps extends UseCopilotOptions {
  /**
   * Prompts offered before the reader types. They are starting points, not commands — each
   * still runs through its mode's contract.
   */
  shortcuts?: readonly CopilotShortcut[];
  /**
   * ARIA role for the dock. Defaults to `complementary`, so the copilot is findable and
   * skippable rather than an unnamed div.
   */
  role?: string;
  /** Where the dock sits. `inline` renders it in flow for a surface that has its own layout. */
  anchor?: "bottom-center" | "bottom-right" | "inline";
  /** Applied to the dock's outer element. */
  className?: string;
  /**
   * Called when the reader chooses to put an answer into the note they are writing. Receives
   * text; the host owns where it lands and what provenance it carries.
   */
  onInsert?: (text: string) => void;
  /**
   * Called when a safety classifier escalates. The host runs its own protocol — this component
   * never decides what happens next in a crisis.
   */
  onRiskProtocol?: () => void;
}

export function Copilot({
  shortcuts = [],
  role,
  anchor = "bottom-center",
  className,
  onInsert,
  onRiskProtocol,
  ...options
}: CopilotProps) {
  const api = useCopilot(options);
  const [trayOpen, setTrayOpen] = React.useState(false);
  const fieldRef = React.useRef<HTMLInputElement>(null);

  const menu = useShortcutMenu({
    shortcuts,
    draft: api.draft,
    ...(role !== undefined ? { role } : {}),
    onSelect: (shortcut) => {
      if (shortcut.modeId) api.setMode(shortcut.modeId);
      api.setDraft(shortcut.question);
    },
    onEscape: () => setTrayOpen(false),
  });

  useSummonShortcut({ onSummon: () => fieldRef.current?.focus() });

  const threadOpen = api.state.messages.length > 0 || api.state.status === "crisis";

  // Collapsed, this is one button. A clinician who puts the assistant away has
  // to find it put away — anything that re-expands on its own teaches them that
  // dismissing it does not work.
  if (api.collapsed) {
    return (
      <CopilotRoot api={api}>
        <div
          data-zb-copilot=""
          data-zb-collapsed=""
          className={cn(
            "z-[900] flex justify-end",
            anchor !== "inline" &&
              "fixed inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
            "pointer-events-none [&>*]:pointer-events-auto",
            className,
          )}
        >
          <CopilotLiveRegion message={api.announcer.message} />
          <button
            type="button"
            aria-label="Reopen the assistant"
            onClick={() => api.setCollapsed(false)}
            className="grid h-12 w-12 place-items-center rounded-full bg-[var(--zb-accent)] text-[var(--zb-text-on-accent)] shadow-lg"
          >
            <SparkIcon />
          </button>
        </div>
      </CopilotRoot>
    );
  }

  return (
    <CopilotRoot api={api}>
      <div
        data-zb-copilot=""
        data-zb-status={api.state.status}
        className={cn(
          "z-[900] flex flex-col gap-2",
          // The dock centres; the thread docks to a side. A dock is a summons
          // bar and belongs where the eye already is, but a thread is something
          // you read *against* the record — centred, it sits on top of the
          // chart being discussed, and the first thing anyone does is drag it
          // out of the way.
          threadOpen ? "items-start" : "items-center",
          anchor !== "inline" &&
            "fixed inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
          anchor === "bottom-right" && "items-end",
          "pointer-events-none [&>*]:pointer-events-auto",
          className,
        )}
      >
        <CopilotLiveRegion message={api.announcer.message} />

        {threadOpen ? (
          <CopilotPanel
            api={api}
            {...(onInsert ? { onInsert } : {})}
            {...(onRiskProtocol ? { onRiskProtocol } : {})}
          />
        ) : (
          <CopilotDockRegion className="flex w-full max-w-2xl flex-col gap-1.5">
            {trayOpen ? (
              <div className="rounded-2xl border border-[var(--zb-border)] bg-[var(--zb-surface)] p-3 shadow-lg">
                <div role="group" aria-label="Change mode" className="mb-2 flex flex-wrap gap-1.5">
                  {api.modes.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      aria-pressed={mode.id === api.mode.id}
                      onClick={() => api.setMode(mode.id)}
                      className={cn(
                        "min-h-6 rounded-lg px-2.5 py-1 text-sm",
                        mode.id === api.mode.id
                          ? "bg-[var(--zb-accent)] text-[var(--zb-text-on-accent)]"
                          : "border border-[var(--zb-border)] text-[var(--zb-text)]",
                      )}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <ul className="m-0 list-none p-0">
                  {api.mode.suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      className="border-t border-[var(--zb-border)] first:border-t-0"
                    >
                      <button
                        type="button"
                        className="w-full px-1 py-2 text-start"
                        onClick={() => {
                          api.setDraft(suggestion.question ?? suggestion.label);
                          setTrayOpen(false);
                        }}
                      >
                        <span className="block text-sm text-[var(--zb-text)]">
                          {suggestion.label}
                        </span>
                        {/* The scope, shown at the point of choice. */}
                        {suggestion.reads ? (
                          <span className="block text-xs text-[var(--zb-text-muted)]">
                            {suggestion.reads}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {menu.open ? (
              <ul
                {...menu.listProps}
                aria-label="Shortcuts"
                className="m-0 list-none rounded-2xl border border-[var(--zb-border)] bg-[var(--zb-surface)] p-2 shadow-lg"
              >
                {menu.items.map((item, index) => (
                  <li
                    key={item.id}
                    {...menu.optionProps(index)}
                    className="cursor-pointer rounded-lg px-2 py-1.5 text-sm aria-selected:bg-[color-mix(in_oklab,var(--zb-accent)_12%,transparent)]"
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            ) : null}

            <ScopeStrip api={api} onChange={() => setTrayOpen(true)} />

            <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--zb-border)] bg-[var(--zb-surface)] px-2 py-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_12px_32px_-14px_rgb(0_0_0/0.22)]">
              {/* The square glyph. Also the "/" affordance, so the shortcut
                menu has a visible way in for anyone who never learns the key. */}
              <button
                type="button"
                aria-label="Shortcuts"
                onClick={() => api.setDraft(api.draft.startsWith("/") ? api.draft : "/")}
                className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] text-base text-[var(--zb-text-muted)]"
              >
                <ShortcutIcon />
              </button>

              <input
                ref={fieldRef}
                value={api.draft}
                aria-label="Clinical assistant"
                placeholder={
                  api.mode.reads.length > 0 ? "Ask about this patient…" : "Search the evidence…"
                }
                onChange={(event) => api.setDraft(event.target.value)}
                onKeyDown={(event) => {
                  menu.inputProps.onKeyDown(event);
                  if (event.key === "Enter" && !menu.open) {
                    event.preventDefault();
                    void api.submit();
                  }
                }}
                role={menu.inputProps.role}
                aria-expanded={menu.inputProps["aria-expanded"]}
                aria-controls={menu.inputProps["aria-controls"]}
                aria-autocomplete={menu.inputProps["aria-autocomplete"]}
                {...(menu.inputProps["aria-activedescendant"]
                  ? { "aria-activedescendant": menu.inputProps["aria-activedescendant"] }
                  : {})}
                className="min-w-0 flex-1 bg-transparent px-1 text-[var(--zb-text)] outline-none placeholder:text-[var(--zb-text-muted)]"
              />

              {(() => {
                const ModeGlyph = modeIcon(api.mode.id);
                return (
                  <button
                    type="button"
                    aria-expanded={trayOpen}
                    onClick={() => setTrayOpen((open) => !open)}
                    className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] px-2.5 py-1 text-sm text-[var(--zb-text)]"
                  >
                    <ModeGlyph className="text-[var(--zb-text-muted)]" />
                    {api.mode.label}
                  </button>
                );
              })()}

              {api.dictation.active ? (
                <button
                  type="button"
                  aria-label="Stop dictation"
                  onClick={() => api.dictation.stop()}
                  className="min-h-6 min-w-6 rounded-lg px-2 text-[var(--zb-status-normal)]"
                >
                  <span className="inline-flex gap-[2px]" aria-hidden="true">
                    <i className="block h-3 w-[2px] animate-pulse rounded bg-current" />
                    <i className="block h-2 w-[2px] animate-pulse rounded bg-current [animation-delay:120ms]" />
                    <i className="block h-3.5 w-[2px] animate-pulse rounded bg-current [animation-delay:240ms]" />
                  </span>
                  {/* Colour and motion alone would be a 1.4.1 failure, and in a
                    consulting room it is also a privacy problem. */}
                  <span className="sr-only">Microphone is live</span>
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Start dictation"
                  onClick={api.dictation.start}
                  disabled={api.state.status === "streaming" || api.state.status === "submitting"}
                  className="grid size-8 shrink-0 place-items-center rounded-[10px] text-base text-[var(--zb-text-muted)] disabled:opacity-40"
                >
                  <MicIcon />
                </button>
              )}

              {api.state.status === "streaming" || api.state.status === "submitting" ? (
                <button
                  type="button"
                  onClick={api.stop}
                  className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-[var(--zb-border)] text-base"
                >
                  <StopIcon />
                  <span className="sr-only">Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!api.canSubmit}
                  onClick={() => void api.submit()}
                  className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--zb-accent)] text-base text-[var(--zb-text-on-accent)] disabled:opacity-40"
                >
                  <SendIcon />
                  <span className="sr-only">Send</span>
                </button>
              )}
            </div>

            {/* Never dismissible. */}
            <p className="m-0 text-center text-xs text-[var(--zb-text-muted)]">
              Medical knowledge only. Not for autonomous decision making. Check sources and use your
              clinical judgement.
            </p>
          </CopilotDockRegion>
        )}
      </div>
    </CopilotRoot>
  );
}

/**
 * The scope strip.
 *
 * The highest-value element on the surface, and the one that is easiest to
 * leave out. A clinician needs to know what the assistant can see *before*
 * they trust a summary, and — the part everyone omits — what it could not see.
 * A summary that silently excludes a protected record has created a false
 * belief that would not exist if the tool did not exist.
 */
function ScopeStrip({
  api,
  onChange,
}: {
  api: ReturnType<typeof useCopilot>;
  onChange: () => void;
}) {
  const { scope } = api;

  // "Change" opens the mode tray rather than a scope picker of its own. Scope
  // *is* the mode's `reads` contract, so a second control that edited it
  // independently would let the two disagree — and the strip is the thing a
  // clinician is being asked to trust.
  const change = (
    <button
      type="button"
      onClick={onChange}
      className="rounded-full font-medium text-[var(--zb-accent)] underline underline-offset-2"
    >
      Change
    </button>
  );

  // A pill that sizes to its own text, not a full-width bar. The strip is a
  // statement about *this* answer, and a bar spanning the dock reads as chrome —
  // which is exactly the thing people stop seeing.
  const shell =
    // `rounded-2xl` rather than a full pill: the category list is host-supplied
    // and a pill that wraps to three lines reads as a rendering fault.
    "m-0 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3 py-1 text-xs text-[var(--zb-text-muted)] shadow-[0_1px_2px_rgb(0_0_0/0.04)]";

  if (scope.categories.length === 0) {
    return (
      <p className={shell}>
        <LockIcon className="shrink-0" />
        No patient data is being used
        {change}
      </p>
    );
  }

  return (
    <p className={shell}>
      <PersonIcon className="shrink-0" />
      <span>
        Reading{" "}
        <strong className="font-semibold text-[var(--zb-text)]">
          {scope.subject?.display ?? scope.subject?.reference}
        </strong>
        {" · "}
        {scope.categories.join(", ")}
      </span>
      {scope.showWithheld ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--zb-status-high)_20%,transparent)] px-2 py-px text-[var(--zb-text)]">
          <LockIcon className="shrink-0" />
          {scope.withheldCount} record{scope.withheldCount === 1 ? "" : "s"} withheld
        </span>
      ) : null}
      {change}
    </p>
  );
}

/**
 * A retrieved passage with the supporting clause marked.
 *
 * This is the difference between a citation and a verification. A source title
 * tells a clinician where an answer came from; it does not tell them the model
 * read that source correctly, and checking costs a tab, a search and a scan of
 * a forty-page guideline. Nobody pays that during a consultation — which is the
 * mechanism behind automation bias, an effort asymmetry rather than a character
 * flaw.
 *
 * Marking the clause makes the check a glance. `<mark>` rather than a styled
 * span because the semantics are exactly right and it survives forced-colours
 * mode, where a background tint would vanish and take the meaning with it.
 *
 * Offsets are host-supplied and clamped rather than trusted: a provider that
 * returns a stale range should mark the wrong words at worst, never throw away
 * the passage.
 */
export interface HighlightedPassageProps {
  /** The source passage, verbatim. Never re-flowed or truncated — a citation the reader cannot check against the original is not a citation. */
  text: string;
  /**
   * Character offsets of the span the answer drew on, as `[start, end]`.
   *
   * Out-of-range offsets highlight nothing rather than throwing: a citation
   * that points past the end of its own source is a bug in the caller, and
   * silently marking the wrong sentence would be worse than marking none.
   */
  at?: readonly [number, number];
}

export function HighlightedPassage({ text, at }: HighlightedPassageProps) {
  if (!at) return <>{text}</>;

  const start = Math.max(0, Math.min(at[0], text.length));
  const end = Math.max(start, Math.min(at[1], text.length));
  if (start === end) return <>{text}</>;

  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-[color-mix(in_oklab,var(--zb-status-high)_28%,transparent)] px-0.5 text-[var(--zb-text)]">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

function CopilotPanel({
  api,
  onInsert,
  onRiskProtocol,
}: {
  api: ReturnType<typeof useCopilot>;
  onInsert?: (text: string) => void;
  onRiskProtocol?: () => void;
}) {
  const modeSelectRef = React.useRef<HTMLSelectElement>(null);

  return (
    <section
      aria-label="Assistant conversation"
      // A column, not a banner. The record stays readable beside it, which is
      // the whole reason a clinician opened a thread about that record.
      className="flex max-h-[min(78vh,44rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--zb-border)] bg-[var(--zb-surface)] shadow-[0_1px_2px_rgb(0_0_0/0.05),0_16px_40px_-16px_rgb(0_0_0/0.28)]"
    >
      <header className="flex items-center justify-between border-b border-[var(--zb-border)] px-3 py-2">
        {api.threads.length > 1 ? (
          <label className="flex min-w-0 items-center gap-1">
            <span className="sr-only">Switch conversation</span>
            <select
              value={api.activeThreadId}
              onChange={(event) => api.switchThread(event.target.value)}
              className="min-w-0 max-w-[18rem] truncate bg-transparent text-sm font-semibold text-[var(--zb-text)] outline-none"
            >
              {api.threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.title}
                </option>
              ))}
            </select>
            <ChevronDownIcon />
          </label>
        ) : (
          <h2 className="m-0 truncate text-sm font-semibold text-[var(--zb-text)]">
            {api.threads[0]?.title ?? api.mode.label}
          </h2>
        )}
        <button
          type="button"
          onClick={api.newThread}
          className="min-h-6 rounded-lg border border-[var(--zb-border)] px-2 py-0.5 text-xs"
        >
          <NewChatIcon />
          <span className="sr-only">New chat</span>
        </button>
        <button
          type="button"
          aria-label="Put the assistant away"
          onClick={() => api.setCollapsed(true)}
          className="min-h-6 min-w-6 rounded-lg px-1"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {api.state.messages.map((message) =>
          message.role === "clinician" ? (
            <p
              key={message.id}
              className="m-0 max-w-[80%] self-end rounded-xl bg-[color-mix(in_oklab,var(--zb-accent)_12%,transparent)] px-3 py-1.5 text-sm text-[var(--zb-text)]"
            >
              {message.text}
            </p>
          ) : (
            <article key={message.id} className="flex flex-col gap-1.5">
              {/* Collapsed by design: a visible chain of thought reads as
                  evidence to a clinician, and it is not evidence. */}
              {message.answer?.reasoning ? (
                <details className="text-xs text-[var(--zb-text-muted)]">
                  <summary className="flex cursor-pointer items-center gap-1 text-[0.65rem] uppercase tracking-wide [&::-webkit-details-marker]:hidden">
                    <ThoughtIcon /> Reasoning
                  </summary>
                  <p className="m-0 mt-1 border-s-2 border-[var(--zb-border)] ps-2 leading-relaxed">
                    {message.answer.reasoning}
                  </p>
                </details>
              ) : null}

              {message.answer ? (
                <span
                  data-register={message.answer.register}
                  className={cn(
                    "self-start rounded px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide",
                    message.answer.register === "grounded" &&
                      "bg-[color-mix(in_oklab,var(--zb-status-normal)_15%,transparent)] text-[var(--zb-status-normal)]",
                    message.answer.register === "general" &&
                      "bg-[color-mix(in_oklab,var(--zb-status-high)_15%,transparent)] text-[var(--zb-status-high)]",
                    message.answer.register === "declined" &&
                      "bg-[var(--zb-bg-subtle)] text-[var(--zb-text-muted)]",
                  )}
                >
                  {message.answer.register === "grounded"
                    ? `Grounded · ${message.answer.sources.size}`
                    : message.answer.register === "general"
                      ? "General knowledge"
                      : "Declined"}
                </span>
              ) : null}

              {message.answer ? (
                <div
                  data-register={message.answer.register}
                  className={cn(
                    "text-sm leading-relaxed text-[var(--zb-text)]",
                    message.answer.register === "general" &&
                      "border-s-[3px] border-[var(--zb-status-high)] ps-2.5",
                  )}
                >
                  {segmentAnswer(message.answer).map((segment, index) => (
                    <span
                      key={index}
                      className={cn(
                        segment.uncited &&
                          "underline decoration-[var(--zb-status-high)] decoration-wavy underline-offset-4",
                      )}
                      {...(segment.uncited
                        ? {
                            title:
                              "No source was cited for this sentence. Verify it before acting.",
                          }
                        : {})}
                    >
                      {segment.text}
                      {segment.markers.map((marker) => (
                        <button
                          key={marker}
                          type="button"
                          onClick={() => api.openSourcesFor(message.id)}
                          aria-label={citationLabel(marker, message.answer?.sources.get(marker))}
                          className="ms-px align-super rounded bg-[color-mix(in_oklab,var(--zb-accent)_15%,transparent)] px-1 text-[0.65em]"
                        >
                          {marker}
                        </button>
                      ))}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  aria-label="Helpful"
                  onClick={() => api.sendFeedbackFor(message.id, "up")}
                  className="min-h-6 min-w-6 px-1"
                >
                  <ThumbUpIcon />
                </button>
                <button
                  type="button"
                  aria-label="Not helpful"
                  // No reason picker here, so record the thumbs-down at once.
                  onClick={() =>
                    api.sendFeedbackFor(message.id, "down", undefined, { askReason: false })
                  }
                  className="min-h-6 min-w-6 px-1"
                >
                  <ThumbDownIcon />
                </button>
                <button
                  type="button"
                  aria-label="Copy"
                  onClick={() => void navigator.clipboard?.writeText(message.text)}
                  className="min-h-6 min-w-6 px-1"
                >
                  <CopyIcon />
                </button>
                <button
                  type="button"
                  // This answer's sources, not the latest answer's.
                  onClick={() => api.openSourcesFor(message.id)}
                  className="inline-flex min-h-6 items-center gap-1 rounded-lg border border-[var(--zb-border)] px-2 py-0.5"
                >
                  <VerifyIcon />
                  Show sources
                </button>
                {onInsert ? (
                  <button
                    type="button"
                    aria-label="Insert into note"
                    onClick={() => onInsert(message.text)}
                    className="min-h-6 min-w-6 px-1"
                  >
                    <InsertIcon />
                  </button>
                ) : null}
              </div>
            </article>
          ),
        )}

        {api.state.status === "streaming" && api.state.current ? (
          <CopilotAnswerRegion busy className="text-sm leading-relaxed text-[var(--zb-text)]">
            {api.state.current.text}
          </CopilotAnswerRegion>
        ) : null}

        {api.state.status === "crisis" ? (
          <section
            role="alert"
            className="rounded-xl border border-[color-mix(in_oklab,var(--zb-status-critical)_45%,transparent)] border-s-[3px] border-s-[var(--zb-status-critical)] bg-[color-mix(in_oklab,var(--zb-status-critical)_6%,transparent)] p-3"
          >
            <h3 className="m-0 mb-1 text-sm font-semibold text-[var(--zb-status-critical)]">
              This needs a person, not a model
            </h3>
            <p className="m-0 mb-2 text-sm text-[var(--zb-text)]">
              {api.state.safety.crisis.audience === "user"
                ? "This assistant is not able to help with this. Please reach a person now."
                : "This assistant does not answer questions about a patient in immediate danger."}
            </p>
            <div className="flex flex-wrap gap-2">
              {onRiskProtocol ? (
                <button
                  type="button"
                  onClick={onRiskProtocol}
                  className="min-h-6 rounded-lg bg-[var(--zb-status-critical)] px-2.5 py-1 text-sm text-[var(--zb-text-on-accent)]"
                >
                  Open risk protocol
                </button>
              ) : null}
              {/* Resolved by locale. 988 works in the United States and nowhere
                  else, so hardcoding it ships a bug to every other market. */}
              {api.crisisLines.map((line) =>
                line.number ? (
                  <a
                    key={line.label}
                    href={`tel:${line.number}`}
                    className="min-h-6 rounded-lg border border-[var(--zb-border)] px-2.5 py-1 text-sm"
                  >
                    {line.label} · {line.number}
                  </a>
                ) : (
                  <span
                    key={line.label}
                    className="px-2.5 py-1 text-sm text-[var(--zb-text-muted)]"
                  >
                    {line.label}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {api.state.status === "refused" && api.state.error ? (
          <div role="status" className="rounded-lg bg-[var(--zb-bg-subtle)] p-2.5 text-sm">
            <strong className="text-[var(--zb-text)]">Outside what this assistant answers</strong>
            <p className="m-0 text-[var(--zb-text-muted)]">{api.state.error.message}</p>
          </div>
        ) : null}

        {api.state.status === "error" && api.state.error ? (
          <div
            role="alert"
            className="rounded-lg bg-[color-mix(in_oklab,var(--zb-status-critical)_8%,transparent)] p-2.5 text-sm"
          >
            <strong className="text-[var(--zb-text)]">The assistant could not answer</strong>
            <p className="m-0 text-[var(--zb-text-muted)]">{api.state.error.message}</p>
            {api.state.error.retryable && api.canRetry ? (
              <button
                type="button"
                onClick={() => void api.retry()}
                className="min-h-6 rounded-lg border border-[var(--zb-border)] px-2 py-0.5"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* The verification surface. The passage itself, not a link — following a
          link costs a tab and a search, and people accept rather than pay it. */}
      {api.sourcesOpen ? (
        <section
          aria-label="Basis of this answer"
          className="max-h-72 overflow-y-auto border-t border-[var(--zb-border)] p-3"
        >
          <div className="mb-1 flex items-center justify-between">
            <strong className="text-sm text-[var(--zb-text)]">Basis of this answer</strong>
            <button
              type="button"
              aria-label="Close"
              onClick={api.closeSources}
              className="min-h-6 px-1"
            >
              ✕
            </button>
          </div>
          <ol className="m-0 list-none p-0">
            {/* Numbered by citation marker, so "2" here is "2" in the answer. */}
            {api.citations.map(({ marker, source }) => (
              <li
                key={source.id}
                className="border-t border-[var(--zb-border)] pt-2 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline gap-1.5 text-sm">
                  <span
                    aria-hidden="true"
                    className="rounded bg-[color-mix(in_oklab,var(--zb-accent)_15%,transparent)] px-1 text-xs"
                  >
                    {marker}
                  </span>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[var(--zb-text)]"
                    >
                      {source.title}
                    </a>
                  ) : (
                    <strong className="text-[var(--zb-text)]">{source.title}</strong>
                  )}
                </div>
                <blockquote className="m-0 mt-1 border-s-2 border-[var(--zb-border)] ps-2 text-xs text-[var(--zb-text-muted)]">
                  <HighlightedPassage
                    text={source.passage}
                    {...(source.highlight ? { at: source.highlight } : {})}
                  />
                </blockquote>
                <p className="m-0 mt-1 text-[0.7rem] tabular-nums text-[var(--zb-text-muted)]">
                  Retrieved {source.retrievedAt.slice(0, 10)}
                  {source.version ? ` · ${source.version}` : ""} · {source.kind}
                  {typeof source.score === "number" ? ` · match ${source.score.toFixed(2)}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <ScopeStrip api={api} onChange={() => modeSelectRef.current?.focus()} />

      {/* The panel's own composer. Once the thread is open the dock is the wrong
          place to type: the answer being followed up on is up here, and making
          someone travel back down to ask about it is the kind of small friction
          that ends in a copy-paste into a chat window with none of this
          component's guarantees. */}
      <div className="border-t border-[var(--zb-border)] px-3 py-2">
        <input
          value={api.draft}
          aria-label="Ask a follow-up…"
          placeholder="Ask a follow-up…"
          disabled={api.state.status === "crisis"}
          onChange={(event) => api.setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void api.submit();
            }
          }}
          className="w-full bg-transparent text-sm text-[var(--zb-text)] outline-none"
        />
        <div className="mt-1 flex items-center gap-1">
          <button
            type="button"
            aria-label="Shortcuts"
            onClick={() => api.setDraft(api.draft.startsWith("/") ? api.draft : "/")}
            className="min-h-6 min-w-6 rounded-lg px-1"
          >
            <ShortcutIcon />
          </button>

          {/* Mode has to survive the dock being hidden, or opening a thread
              would quietly remove the control that decides what the model may
              read — the one thing that must never be implicit. */}
          <label className="inline-flex items-center gap-1 rounded-lg border border-[var(--zb-border)] px-2 py-0.5 text-xs">
            <span className="sr-only">Change mode</span>
            <select
              ref={modeSelectRef}
              value={api.mode.id}
              onChange={(event) => api.setMode(event.target.value)}
              className="bg-transparent text-xs text-[var(--zb-text)] outline-none"
            >
              {api.modes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>

          <span className="flex-1" />

          {api.dictation.active ? (
            <button
              type="button"
              aria-label="Stop dictation"
              onClick={() => api.dictation.stop()}
              className="min-h-6 min-w-6 rounded-lg px-1 text-[var(--zb-status-normal)]"
            >
              <MicIcon />
              <span className="sr-only">Microphone is live</span>
            </button>
          ) : (
            <button
              type="button"
              aria-label="Start dictation"
              onClick={api.dictation.start}
              // Disabled mid-answer: dictating would leave `streaming` and remove Stop.
              disabled={api.state.status === "streaming" || api.state.status === "submitting"}
              className="min-h-6 min-w-6 rounded-lg px-1 disabled:opacity-40"
            >
              <MicIcon />
            </button>
          )}

          {api.state.status === "streaming" || api.state.status === "submitting" ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={api.stop}
              className="min-h-6 min-w-6 rounded-lg border border-[var(--zb-border)] px-1"
            >
              <StopIcon />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              disabled={!api.canSubmit}
              onClick={() => void api.submit()}
              className="min-h-6 min-w-6 rounded-lg bg-[var(--zb-accent)] px-1 text-[var(--zb-text-on-accent)] disabled:opacity-40"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>

      <p className="m-0 border-t border-[var(--zb-border)] px-3 py-2 text-center text-xs text-[var(--zb-text-muted)]">
        Medical knowledge only. Not for autonomous decision making. Check sources and use your
        clinical judgement.
      </p>
    </section>
  );
}
