"use client";

/**
 * Consult — a floating clinical copilot, as copy-as-source.
 *
 * This is the second skin over `@oxygenui-design/consult-react`. The antd skin
 * (`@oxygenui-design/consult`) is the first. Both are thin: the engine, the
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
  ConsultAnswerRegion,
  ConsultDockRegion,
  ConsultLiveRegion,
  ConsultRoot,
  citationLabel,
  segmentAnswer,
  useConsult,
  useShortcutMenu,
  useSummonShortcut,
  type ConsultShortcut,
  type UseConsultOptions,
} from "@oxygenui-design/consult-react";
import { cn } from "@/lib/utils";

export interface ConsultProps extends UseConsultOptions {
  shortcuts?: readonly ConsultShortcut[];
  role?: string;
  anchor?: "bottom-center" | "bottom-right" | "inline";
  className?: string;
  onInsert?: (text: string) => void;
  onRiskProtocol?: () => void;
}

export function Consult({
  shortcuts = [],
  role,
  anchor = "bottom-center",
  className,
  onInsert,
  onRiskProtocol,
  ...options
}: ConsultProps) {
  const api = useConsult(options);
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

  return (
    <ConsultRoot api={api}>
      <div
        data-slot="consult"
        data-status={api.state.status}
        className={cn(
          "z-[900] flex flex-col items-center gap-2",
          anchor !== "inline" && "fixed inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
          anchor === "bottom-right" && "items-end",
          "pointer-events-none [&>*]:pointer-events-auto",
          className,
        )}
      >
        <ConsultLiveRegion message={api.announcer.message} />

        {threadOpen ? (
          <ConsultPanel api={api} {...(onInsert ? { onInsert } : {})} {...(onRiskProtocol ? { onRiskProtocol } : {})} />
        ) : null}

        <ConsultDockRegion className="flex w-full max-w-2xl flex-col gap-1.5">
          {trayOpen ? (
            <div className="rounded-2xl border border-[--ox-rule] bg-[--ox-surface] p-3 shadow-lg">
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
                        ? "bg-[--ox-status-accent] text-[--ox-text-on-accent]"
                        : "border border-[--ox-rule] text-[--ox-text]",
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <ul className="m-0 list-none p-0">
                {api.mode.suggestions.map((suggestion) => (
                  <li key={suggestion.id} className="border-t border-[--ox-rule] first:border-t-0">
                    <button
                      type="button"
                      className="w-full px-1 py-2 text-start"
                      onClick={() => {
                        api.setDraft(suggestion.question ?? suggestion.label);
                        setTrayOpen(false);
                      }}
                    >
                      <span className="block text-sm text-[--ox-text]">{suggestion.label}</span>
                      {/* The scope, shown at the point of choice. */}
                      {suggestion.reads ? (
                        <span className="block text-xs text-[--ox-text-muted]">{suggestion.reads}</span>
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
              className="m-0 list-none rounded-2xl border border-[--ox-rule] bg-[--ox-surface] p-2 shadow-lg"
            >
              {menu.items.map((item, index) => (
                <li
                  key={item.id}
                  {...menu.optionProps(index)}
                  className="cursor-pointer rounded-lg px-2 py-1.5 text-sm aria-selected:bg-[--ox-status-accent]/12"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}

          <ScopeStrip api={api} />

          <div className="flex items-center gap-1.5 rounded-2xl border border-[--ox-rule] bg-[--ox-surface] px-2.5 py-2 shadow-lg">
            <input
              ref={fieldRef}
              value={api.draft}
              aria-label="Clinical assistant"
              disabled={api.state.status === "crisis"}
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
              className="min-w-0 flex-1 bg-transparent text-[--ox-text] outline-none"
            />

            <button
              type="button"
              aria-expanded={trayOpen}
              onClick={() => setTrayOpen((open) => !open)}
              className="min-h-6 rounded-lg border border-[--ox-rule] px-2 py-1 text-sm"
            >
              {api.mode.label}
            </button>

            {api.dictation.active ? (
              <button
                type="button"
                aria-label="Stop dictation"
                onClick={() => api.dictation.stop()}
                className="min-h-6 min-w-6 rounded-lg px-2 text-[--ox-status-normal]"
              >
                <span aria-hidden="true">▮▮▮</span>
                {/* Colour and motion alone would be a 1.4.1 failure, and in a
                    consulting room it is also a privacy problem. */}
                <span className="sr-only">Microphone is live</span>
              </button>
            ) : (
              <button
                type="button"
                aria-label="Start dictation"
                onClick={api.dictation.start}
                className="min-h-6 min-w-6 rounded-lg px-2"
              >
                <span aria-hidden="true">🎙</span>
              </button>
            )}

            {api.state.status === "streaming" || api.state.status === "submitting" ? (
              <button
                type="button"
                onClick={api.stop}
                className="min-h-6 rounded-lg border border-[--ox-rule] px-2.5 py-1 text-sm"
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                disabled={!api.canSubmit}
                onClick={() => void api.submit()}
                className="min-h-6 rounded-lg bg-[--ox-status-accent] px-2.5 py-1 text-sm text-[--ox-text-on-accent] disabled:opacity-40"
              >
                Send
              </button>
            )}
          </div>

          {/* Never dismissible. */}
          <p className="m-0 text-center text-xs text-[--ox-text-muted]">
            Medical knowledge only. Not for autonomous decision making. Check sources and use your
            clinical judgement.
          </p>
        </ConsultDockRegion>
      </div>
    </ConsultRoot>
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
function ScopeStrip({ api }: { api: ReturnType<typeof useConsult> }) {
  const { scope } = api;

  if (scope.categories.length === 0) {
    return (
      <p className="m-0 rounded-lg border border-[--ox-rule] bg-[--ox-surface] px-3 py-1 text-xs text-[--ox-text-muted]">
        No patient data is being used
      </p>
    );
  }

  return (
    <p className="m-0 flex flex-wrap items-center gap-2 rounded-lg border border-[--ox-rule] bg-[--ox-surface] px-3 py-1 text-xs text-[--ox-text-muted]">
      <span>
        Reading <strong className="text-[--ox-text]">{scope.subject?.display ?? scope.subject?.reference}</strong>
        {" · "}
        {scope.categories.join(", ")}
      </span>
      {scope.showWithheld ? (
        <span className="rounded bg-[--ox-status-high]/20 px-1.5 text-[--ox-text]">
          {scope.withheldCount} record{scope.withheldCount === 1 ? "" : "s"} withheld
        </span>
      ) : null}
    </p>
  );
}

function ConsultPanel({
  api,
  onInsert,
  onRiskProtocol,
}: {
  api: ReturnType<typeof useConsult>;
  onInsert?: (text: string) => void;
  onRiskProtocol?: () => void;
}) {
  return (
    <section
      aria-label="Assistant conversation"
      className="flex max-h-[min(70vh,40rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[--ox-rule] bg-[--ox-surface] shadow-lg"
    >
      <header className="flex items-center justify-between border-b border-[--ox-rule] px-3 py-2">
        <h2 className="m-0 text-sm font-semibold text-[--ox-text]">{api.mode.label}</h2>
        <button
          type="button"
          onClick={api.newThread}
          className="min-h-6 rounded-lg border border-[--ox-rule] px-2 py-0.5 text-xs"
        >
          New chat
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {api.state.messages.map((message) =>
          message.role === "clinician" ? (
            <p
              key={message.id}
              className="m-0 max-w-[80%] self-end rounded-xl bg-[--ox-status-accent]/12 px-3 py-1.5 text-sm text-[--ox-text]"
            >
              {message.text}
            </p>
          ) : (
            <article key={message.id} className="flex flex-col gap-1.5">
              {message.answer ? (
                <span
                  data-register={message.answer.register}
                  className={cn(
                    "self-start rounded px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide",
                    message.answer.register === "grounded" &&
                      "bg-[--ox-status-normal]/15 text-[--ox-status-normal]",
                    message.answer.register === "general" &&
                      "bg-[--ox-status-high]/15 text-[--ox-status-high]",
                    message.answer.register === "declined" && "bg-[--ox-surface-2] text-[--ox-text-muted]",
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
                    "text-sm leading-relaxed text-[--ox-text]",
                    message.answer.register === "general" &&
                      "border-s-[3px] border-[--ox-status-high] ps-2.5",
                  )}
                >
                  {segmentAnswer(message.answer).map((segment, index) => (
                    <span
                      key={index}
                      className={cn(
                        segment.uncited && "underline decoration-[--ox-status-high] decoration-wavy underline-offset-4",
                      )}
                      {...(segment.uncited
                        ? { title: "No source was cited for this sentence. Verify it before acting." }
                        : {})}
                    >
                      {segment.text}
                      {segment.markers.map((marker) => (
                        <button
                          key={marker}
                          type="button"
                          onClick={api.openSources}
                          aria-label={citationLabel(marker, message.answer?.sources.get(marker))}
                          className="ms-px align-super rounded bg-[--ox-status-accent]/15 px-1 text-[0.65em]"
                        >
                          {marker}
                        </button>
                      ))}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button type="button" onClick={() => api.sendFeedback("up")} className="min-h-6 px-1">
                  Helpful
                </button>
                <button type="button" onClick={() => api.sendFeedback("down")} className="min-h-6 px-1">
                  Not helpful
                </button>
                <button
                  type="button"
                  onClick={api.openSources}
                  className="min-h-6 rounded-lg border border-[--ox-rule] px-2 py-0.5"
                >
                  Show sources
                </button>
                {onInsert ? (
                  <button type="button" onClick={() => onInsert(message.text)} className="min-h-6 px-1">
                    Insert into note
                  </button>
                ) : null}
              </div>
            </article>
          ),
        )}

        {api.state.status === "streaming" && api.state.current ? (
          <ConsultAnswerRegion busy className="text-sm leading-relaxed text-[--ox-text]">
            {api.state.current.text}
          </ConsultAnswerRegion>
        ) : null}

        {api.state.status === "crisis" ? (
          <section
            role="alert"
            className="rounded-xl border border-[--ox-status-critical]/45 border-s-[3px] border-s-[--ox-status-critical] bg-[--ox-status-critical]/6 p-3"
          >
            <h3 className="m-0 mb-1 text-sm font-semibold text-[--ox-status-critical]">
              This needs a person, not a model
            </h3>
            <p className="m-0 mb-2 text-sm text-[--ox-text]">
              {api.state.safety.crisis.audience === "user"
                ? "This assistant is not able to help with this. Please reach a person now."
                : "This assistant does not answer questions about a patient in immediate danger."}
            </p>
            <div className="flex flex-wrap gap-2">
              {onRiskProtocol ? (
                <button
                  type="button"
                  onClick={onRiskProtocol}
                  className="min-h-6 rounded-lg bg-[--ox-status-critical] px-2.5 py-1 text-sm text-[--ox-text-on-accent]"
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
                    className="min-h-6 rounded-lg border border-[--ox-rule] px-2.5 py-1 text-sm"
                  >
                    {line.label} · {line.number}
                  </a>
                ) : (
                  <span key={line.label} className="px-2.5 py-1 text-sm text-[--ox-text-muted]">
                    {line.label}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {api.state.status === "refused" && api.state.error ? (
          <div role="status" className="rounded-lg bg-[--ox-surface-2] p-2.5 text-sm">
            <strong className="text-[--ox-text]">Outside what this assistant answers</strong>
            <p className="m-0 text-[--ox-text-muted]">{api.state.error.message}</p>
          </div>
        ) : null}

        {api.state.status === "error" && api.state.error ? (
          <div role="alert" className="rounded-lg bg-[--ox-status-critical]/8 p-2.5 text-sm">
            <strong className="text-[--ox-text]">The assistant could not answer</strong>
            <p className="m-0 text-[--ox-text-muted]">{api.state.error.message}</p>
            {api.state.error.retryable && api.canRetry ? (
              <button
                type="button"
                onClick={() => void api.retry()}
                className="min-h-6 rounded-lg border border-[--ox-rule] px-2 py-0.5"
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
        <section aria-label="Basis of this answer" className="max-h-72 overflow-y-auto border-t border-[--ox-rule] p-3">
          <div className="mb-1 flex items-center justify-between">
            <strong className="text-sm text-[--ox-text]">Basis of this answer</strong>
            <button type="button" aria-label="Close" onClick={api.closeSources} className="min-h-6 px-1">
              ✕
            </button>
          </div>
          <ol className="m-0 list-none p-0">
            {api.sources.map((source, index) => (
              <li key={source.id} className="border-t border-[--ox-rule] pt-2 first:border-t-0 first:pt-0">
                <div className="flex items-baseline gap-1.5 text-sm">
                  <span aria-hidden="true" className="rounded bg-[--ox-status-accent]/15 px-1 text-xs">
                    {index + 1}
                  </span>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer noopener" className="text-[--ox-text]">
                      {source.title}
                    </a>
                  ) : (
                    <strong className="text-[--ox-text]">{source.title}</strong>
                  )}
                </div>
                <blockquote className="m-0 mt-1 border-s-2 border-[--ox-rule] ps-2 text-xs text-[--ox-text-muted]">
                  {source.passage}
                </blockquote>
                <p className="m-0 mt-1 text-[0.7rem] tabular-nums text-[--ox-text-muted]">
                  Retrieved {source.retrievedAt.slice(0, 10)}
                  {source.version ? ` · version ${source.version}` : ""} · {source.kind}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="m-0 border-t border-[--ox-rule] px-3 py-2 text-center text-xs text-[--ox-text-muted]">
        Medical knowledge only. Not for autonomous decision making. Check sources and use your
        clinical judgement.
      </p>
    </section>
  );
}
