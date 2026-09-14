/**
 * `<Copilot>` — the dock, the panel, and everything in between.
 *
 * Read the props back as an argument. There is no `apiKey`, no `model`, no
 * `systemPrompt`, and no `onToolCall`. Those absences are the design: a
 * customer cannot misconfigure this component into calling a vendor directly,
 * cannot smuggle a permission grant through a prompt string, and cannot wire an
 * unattended tool execution, because the surface to do any of it does not
 * exist.
 *
 * The one prop worth reading twice is `suppressed`. It removes the component
 * entirely — no dock, no dictation indicator, no keyboard listener — and it
 * serves two masters at once: the human-factors finding that interruptions
 * during medication administration measurably increase clinical errors, and the
 * FDA's 2026 relocation of time-critical use into criterion 4, on the reasoning
 * that a clinician under time pressure cannot independently review anything.
 */

import { useCallback, useState } from "react";
import { Button, Dropdown, Input, Tooltip, Typography } from "antd";
import {
  ChevronDownIcon,
  CollapseIcon,
  CloseIcon,
  CopyIcon,
  ExpandIcon,
  FlagIcon,
  InsertIcon,
  MicIcon,
  MoreIcon,
  NewChatIcon,
  PlusIcon,
  SendIcon,
  ShortcutIcon,
  SparkIcon,
  StopIcon,
  ThoughtIcon,
  ThumbDownIcon,
  ThumbUpIcon,
  VerifyIcon,
  BookIcon,
  WorkUpIcon,
  modeIcon,
  CopilotAnswerRegion,
  CopilotDockRegion,
  CopilotLiveRegion,
  CopilotRoot,
  useCopilot,
  useShortcutMenu,
  useSummonShortcut,
  type CopilotShortcut,
  type UseCopilotOptions,
} from "@zoblocks/copilot-react";
import {
  AnswerBody,
  CheckNotices,
  CrisisNotice,
  DisclosureSheet,
  ProposalCard,
  RegisterBadge,
  ScopeStrip,
  SourcesPanel,
} from "./parts.js";
import { CopilotLocaleProvider, useLocale, type CopilotLocale } from "./locale.js";

const { Text } = Typography;

/**
 * The reasons a thumbs-down can carry.
 *
 * Each maps to a different fix, which is the whole point of a closed list:
 * `unsafe` is a stop-ship, `outdated` is a corpus problem, `no-source` is
 * retrieval, `wrong` is the model, `too-long` is the prompt.
 */
const FEEDBACK_REASONS = [
  "wrong",
  "outdated",
  "not-relevant",
  "unsafe",
  "no-source",
  "too-long",
] as const;

export interface CopilotProps extends UseCopilotOptions {
  readonly shortcuts?: readonly CopilotShortcut[];
  /** Role the shortcut menu is filtered for. */
  readonly role?: string;
  /**
   * String overrides. Named `messages` rather than `locale` because
   * `UseCopilotOptions.locale` is already the BCP-47 tag that drives crisis-line
   * resolution and the request's language — two different things called
   * "locale" in one props object is the kind of API that produces a bug report
   * about 988 appearing in Manchester.
   */
  readonly messages?: Partial<CopilotLocale>;
  readonly anchor?: "bottom-center" | "bottom-right" | "inline";
  readonly className?: string;
  /** Called when the clinician asks to change what the assistant can read. */
  readonly onChangeScope?: () => void;
  /** Escalation hooks for the crisis interstitial. */
  readonly onRiskProtocol?: () => void;
  readonly onPageOnCall?: () => void;
  /** Insert accepted text into the host's note. */
  readonly onInsert?: (text: string) => void;
  /** Attach a file or an image to the question. */
  readonly onAttach?: () => void;
}

export function Copilot(props: CopilotProps): React.ReactNode {
  const {
    shortcuts = [],
    role,
    messages,
    anchor = "bottom-center",
    className,
    onChangeScope,
    onRiskProtocol,
    onPageOnCall,
    onInsert,
    onAttach,
    ...copilotOptions
  } = props;

  const api = useCopilot(copilotOptions);

  return (
    <CopilotLocaleProvider {...(messages ? { value: messages } : {})}>
      <CopilotRoot api={api}>
        <CopilotSurface
          api={api}
          shortcuts={shortcuts}
          {...(role !== undefined ? { role } : {})}
          anchor={anchor}
          {...(className !== undefined ? { className } : {})}
          {...(onChangeScope ? { onChangeScope } : {})}
          {...(onRiskProtocol ? { onRiskProtocol } : {})}
          {...(onPageOnCall ? { onPageOnCall } : {})}
          {...(onInsert ? { onInsert } : {})}
          {...(onAttach ? { onAttach } : {})}
        />
      </CopilotRoot>
    </CopilotLocaleProvider>
  );
}

interface SurfaceProps {
  api: ReturnType<typeof useCopilot>;
  shortcuts: readonly CopilotShortcut[];
  role?: string;
  anchor: "bottom-center" | "bottom-right" | "inline";
  className?: string;
  onChangeScope?: () => void;
  onRiskProtocol?: () => void;
  onPageOnCall?: () => void;
  onInsert?: (text: string) => void;
  onAttach?: () => void;
}

/** The glyph for a mode, resolved once so both the chip and the tray agree. */
function ModeGlyph({ modeId }: { modeId: string }): React.ReactElement {
  const Glyph = modeIcon(modeId);
  return <Glyph />;
}

function CopilotSurface(props: SurfaceProps): React.ReactNode {
  const { api, shortcuts, role, anchor, className } = props;
  const locale = useLocale();
  const [trayOpen, setTrayOpen] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [inputEl, setInputEl] = useState<HTMLInputElement | null>(null);

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

  useSummonShortcut({ onSummon: () => inputEl?.focus() });

  const submit = useCallback(() => {
    void api.submit();
  }, [api]);

  const threadOpen = api.state.messages.length > 0 || api.state.status === "crisis";

  /*
   * Collapsed, the component is one button and nothing else.
   *
   * A clinician who puts this away has to find it put away. Anything that
   * re-expands on its own — a new answer, a suggestion, a nudge — teaches them
   * that dismissing it does not work, and the next thing they reach for is the
   * browser tab they can actually close.
   */
  if (api.collapsed) {
    return (
      <div
        className={["zb-copilot", `zb-copilot--${anchor}`, "zb-copilot--collapsed", className]
          .filter(Boolean)
          .join(" ")}
        data-zb-status={api.state.status}
      >
        <CopilotLiveRegion message={api.announcer.message} />
        <Button
          type="primary"
          shape="circle"
          className="zb-copilot-bubble"
          aria-label={locale.reopen}
          onClick={() => api.setCollapsed(false)}
          icon={<SparkIcon />}
        />
      </div>
    );
  }

  return (
    <div
      className={["zb-copilot", `zb-copilot--${anchor}`, className].filter(Boolean).join(" ")}
      data-status={api.state.status}
    >
      <CopilotLiveRegion message={api.announcer.message} />

      {threadOpen ? (
        <CopilotPanel
          scope={
            <ScopeStrip
              scope={api.scope}
              {...(props.onChangeScope ? { onChange: props.onChangeScope } : {})}
            />
          }
          api={api}
          modes={api.modes}
          expanded={expanded}
          onToggleExpand={() => setExpanded((open) => !open)}
          onOpenDisclosure={() => setDisclosureOpen(true)}
          {...(props.onAttach ? { onAttach: props.onAttach } : {})}
          {...(props.onInsert ? { onInsert: props.onInsert } : {})}
          {...(props.onRiskProtocol ? { onRiskProtocol: props.onRiskProtocol } : {})}
          {...(props.onPageOnCall ? { onPageOnCall: props.onPageOnCall } : {})}
        />
      ) : null}

      {threadOpen ? null : (
        <CopilotDockRegion label={locale.dockLabel} className="zb-copilot-dock-region">
          {trayOpen ? (
            <div className="zb-copilot-tray">
              <div className="zb-copilot-tray-modes" role="group" aria-label={locale.modes}>
                {api.modes.map((mode) => (
                  <Button
                    key={mode.id}
                    size="small"
                    type={mode.id === api.mode.id ? "primary" : "default"}
                    aria-pressed={mode.id === api.mode.id}
                    onClick={() => api.setMode(mode.id)}
                    icon={ModeGlyph({ modeId: mode.id })}
                  >
                    {mode.label}
                  </Button>
                ))}
                <Button
                  type="text"
                  size="small"
                  aria-label={locale.closeTray}
                  onClick={() => setTrayOpen(false)}
                >
                  <CloseIcon />
                </Button>
              </div>
              <ul className="zb-copilot-suggestions">
                {api.mode.suggestions.map((suggestion) => (
                  <li key={suggestion.id}>
                    <button
                      type="button"
                      onClick={() => {
                        api.setDraft(suggestion.question ?? suggestion.label);
                        setTrayOpen(false);
                      }}
                    >
                      <span className="zb-copilot-suggestion-label">{suggestion.label}</span>
                      {suggestion.reads ? (
                        <span className="zb-copilot-suggestion-reads">{suggestion.reads}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {menu.open ? (
            <ul className="zb-copilot-shortcuts" {...menu.listProps} aria-label={locale.shortcuts}>
              {menu.items.map((item, index) => (
                <li key={item.id} {...menu.optionProps(index)} className="zb-copilot-shortcut">
                  {item.label}
                  {item.description ? (
                    <span className="zb-copilot-shortcut-desc">{item.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          <ScopeStrip
            scope={api.scope}
            {...(props.onChangeScope ? { onChange: props.onChangeScope } : {})}
          />

          <div className="zb-copilot-dock">
            <Tooltip title={locale.shortcuts}>
              <Button
                type="text"
                aria-label={locale.shortcuts}
                onClick={() => api.setDraft(api.draft.startsWith("/") ? api.draft : "/")}
              >
                <ShortcutIcon />
              </Button>
            </Tooltip>

            <Input
              ref={(node) => setInputEl(node?.input ?? null)}
              className="zb-copilot-field"
              variant="borderless"
              value={api.draft}
              placeholder={
                api.mode.reads.length > 0 ? locale.placeholder : locale.placeholderPatient
              }
              aria-label={locale.dockLabel}
              onChange={(event) => api.setDraft(event.target.value)}
              onPressEnter={(event) => {
                if (menu.open) return;
                event.preventDefault();
                submit();
              }}
              {...menu.inputProps}
            />

            <Button
              size="small"
              onClick={() => setTrayOpen((open) => !open)}
              aria-expanded={trayOpen}
            >
              {api.mode.label}
            </Button>

            <DictationButton api={api} />

            {api.state.status === "streaming" || api.state.status === "submitting" ? (
              <Button aria-label={locale.stop} onClick={api.stop} icon={<StopIcon />} />
            ) : (
              <Button
                type="primary"
                aria-label={locale.send}
                disabled={!api.canSubmit}
                onClick={submit}
                icon={<SendIcon />}
              />
            )}
          </div>

          <div className="zb-copilot-footer">
            <Tooltip title={locale.collapseDock}>
              <Button
                type="text"
                size="small"
                aria-label={locale.collapseDock}
                onClick={() => api.setCollapsed(true)}
              >
                <CloseIcon />
              </Button>
            </Tooltip>
            <Text type="secondary" className="zb-copilot-disclaimer">
              {locale.disclaimer}
            </Text>
            <Button type="link" size="small" onClick={() => setDisclosureOpen((open) => !open)}>
              {locale.disclosureTitle}
            </Button>
          </div>

          {disclosureOpen ? <DisclosureSheet disclosure={api.disclosure} /> : null}
        </CopilotDockRegion>
      )}

      {/* The disclosure sheet is reachable from the panel too, so it lives
          outside the dock's conditional. */}
      {threadOpen && disclosureOpen ? <DisclosureSheet disclosure={api.disclosure} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DictationButton(props: { api: ReturnType<typeof useCopilot> }): React.ReactNode {
  const locale = useLocale();
  const { dictation } = props.api;

  if (dictation.active) {
    return (
      <Button
        danger
        aria-label={locale.stopDictation}
        onClick={() => dictation.stop()}
        className="zb-copilot-dictating"
      >
        <span className="zb-copilot-wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="zb-copilot-visually-hidden">{locale.dictationLive}</span>
      </Button>
    );
  }

  // Disabled mid-answer: dictating would leave `streaming` and remove Stop.
  const busy = props.api.state.status === "streaming" || props.api.state.status === "submitting";
  return (
    <Button
      aria-label={locale.startDictation}
      onClick={dictation.start}
      icon={<MicIcon />}
      disabled={busy}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

function CopilotPanel(props: {
  api: ReturnType<typeof useCopilot>;
  modes: readonly { id: string; label: string }[];
  scope?: React.ReactNode;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onInsert?: (text: string) => void;
  onRiskProtocol?: () => void;
  onPageOnCall?: () => void;
  onAttach?: () => void;
  onOpenDisclosure?: () => void;
}): React.ReactNode {
  const { api } = props;
  const locale = useLocale();

  const activeThread = api.threads.find((t) => t.id === api.activeThreadId);

  return (
    <section
      className={["zb-copilot-panel", props.expanded ? "zb-copilot-panel--expanded" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-label={locale.panelLabel}
    >
      <header className="zb-copilot-panel-head">
        {/* The thread switcher. A thread titles itself from its first question,
            so this reads as the conversation rather than as an id. */}
        <Dropdown
          disabled={api.threads.length < 2}
          menu={{
            selectedKeys: [api.activeThreadId],
            items: api.threads.map((thread) => ({ key: thread.id, label: thread.title })),
            onClick: ({ key }) => api.switchThread(key),
          }}
        >
          <button type="button" className="zb-copilot-thread-switch" aria-label={locale.threads}>
            <span className="zb-copilot-panel-title">{activeThread?.title ?? api.mode.label}</span>
            {api.threads.length > 1 ? <ChevronDownIcon /> : null}
          </button>
        </Dropdown>

        <span className="zb-copilot-panel-spacer" />

        <Tooltip title={locale.newChat}>
          <Button type="text" size="small" aria-label={locale.newChat} onClick={api.newThread}>
            <NewChatIcon />
          </Button>
        </Tooltip>
        {props.onToggleExpand ? (
          <Tooltip title={props.expanded ? locale.collapse : locale.expand}>
            <Button
              type="text"
              size="small"
              aria-label={props.expanded ? locale.collapse : locale.expand}
              onClick={props.onToggleExpand}
            >
              {props.expanded ? <CollapseIcon /> : <ExpandIcon />}
            </Button>
          </Tooltip>
        ) : null}
        <Tooltip title={locale.close}>
          <Button
            type="text"
            size="small"
            aria-label={locale.close}
            onClick={() => api.setCollapsed(true)}
          >
            <CloseIcon />
          </Button>
        </Tooltip>
      </header>

      <div className="zb-copilot-thread">
        {api.state.messages.map((message) =>
          message.role === "clinician" ? (
            <p key={message.id} className="zb-copilot-msg-user">
              {message.text}
            </p>
          ) : (
            <article key={message.id} className="zb-copilot-msg-assistant">
              {/* Collapsed by design. A visible chain of thought reads as
                  evidence to a clinician, and it is not evidence — it is a
                  narrative the model produced alongside the answer. */}
              {message.answer?.reasoning ? (
                <details className="zb-copilot-reasoning">
                  <summary>
                    <ThoughtIcon /> {locale.reasoning}
                  </summary>
                  <p>{message.answer.reasoning}</p>
                </details>
              ) : null}

              {message.answer ? <RegisterBadge answer={message.answer} /> : null}
              {message.answer ? (
                <AnswerBody answer={message.answer} onCite={() => api.openSourcesFor(message.id)} />
              ) : null}
              {message.checks ? <CheckNotices findings={message.checks.findings} /> : null}

              <div className="zb-copilot-msg-actions">
                <Tooltip title={locale.helpful}>
                  <Button
                    type="text"
                    size="small"
                    aria-label={locale.helpful}
                    onClick={() => api.sendFeedbackFor(message.id, "up")}
                  >
                    <ThumbUpIcon />
                  </Button>
                </Tooltip>
                <Tooltip title={locale.notHelpful}>
                  <Button
                    type="text"
                    size="small"
                    aria-label={locale.notHelpful}
                    onClick={() => api.sendFeedbackFor(message.id, "down")}
                  >
                    <ThumbDownIcon />
                  </Button>
                </Tooltip>

                <Button
                  size="small"
                  className="zb-copilot-verify"
                  icon={<VerifyIcon />}
                  onClick={() => api.openSourcesFor(message.id)}
                >
                  {locale.showSources}
                </Button>

                <span className="zb-copilot-msg-spacer" />

                <Tooltip title={locale.copy}>
                  <Button
                    type="text"
                    size="small"
                    aria-label={locale.copy}
                    onClick={() => void navigator.clipboard?.writeText(message.text)}
                  >
                    <CopyIcon />
                  </Button>
                </Tooltip>
                {props.onInsert ? (
                  <Tooltip title={locale.insert}>
                    <Button
                      type="text"
                      size="small"
                      aria-label={locale.insert}
                      onClick={() => props.onInsert?.(message.text)}
                    >
                      <InsertIcon />
                    </Button>
                  </Tooltip>
                ) : null}
                <Dropdown
                  menu={{
                    items: [
                      { key: "flag", label: locale.reportProblem, icon: <FlagIcon /> },
                      { key: "disclosure", label: locale.disclosureTitle, icon: <BookIcon /> },
                    ],
                    onClick: ({ key }) => {
                      if (key === "flag") api.sendFeedbackFor(message.id, "down");
                      else props.onOpenDisclosure?.();
                    },
                  }}
                >
                  <Button type="text" size="small" aria-label={locale.more}>
                    <MoreIcon />
                  </Button>
                </Dropdown>
              </div>

              {/* The reason picker. A bare thumbs-down records nothing
                  analysable, so it asks — from a closed list, because free text
                  produces "bad" and nothing else. */}
              {/* Only under the answer that was marked down. */}
              {api.awaitingFeedbackReason === message.id ? (
                <div className="zb-copilot-feedback" role="group" aria-label={locale.whyNotHelpful}>
                  <span className="zb-copilot-feedback-q">{locale.whyNotHelpful}</span>
                  {FEEDBACK_REASONS.map((reason) => (
                    <Button
                      key={reason}
                      size="small"
                      onClick={() => api.sendFeedbackFor(message.id, "down", reason)}
                    >
                      {locale.feedbackReason(reason)}
                    </Button>
                  ))}
                  <Button type="text" size="small" onClick={api.dismissFeedbackReason}>
                    {locale.close}
                  </Button>
                </div>
              ) : null}
            </article>
          ),
        )}

        {api.state.status === "streaming" && api.state.current ? (
          <CopilotAnswerRegion busy className="zb-copilot-streaming">
            {api.state.current.text}
          </CopilotAnswerRegion>
        ) : null}

        {api.state.status === "crisis" ? (
          <CrisisNotice
            audience={api.state.safety.crisis.audience}
            lines={api.crisisLines}
            {...(props.onRiskProtocol ? { onProtocol: props.onRiskProtocol } : {})}
            {...(props.onPageOnCall ? { onPage: props.onPageOnCall } : {})}
          />
        ) : null}

        {api.state.status === "refused" && api.state.error ? (
          <div className="zb-copilot-refused" role="status">
            <strong>{locale.refusedTitle}</strong>
            <p>{api.state.error.message}</p>
            {api.state.error.suggestedModeId ? (
              <Button
                size="small"
                onClick={() => api.setMode(api.state.error?.suggestedModeId ?? api.mode.id)}
              >
                {locale.switchMode(
                  api.modes.find((m) => m.id === api.state.error?.suggestedModeId)?.label ?? "",
                )}
              </Button>
            ) : null}
          </div>
        ) : null}

        {api.state.status === "error" && api.state.error ? (
          <div className="zb-copilot-error" role="alert">
            <strong>{locale.errorTitle}</strong>
            <p>{api.state.error.message}</p>
            {api.state.error.retryable && api.canRetry ? (
              <Button size="small" onClick={() => void api.retry()}>
                {locale.retry}
              </Button>
            ) : null}
          </div>
        ) : null}

        {api.state.status === "stopped" ? (
          <p className="zb-copilot-notice" role="status">
            {locale.stoppedNotice}
          </p>
        ) : null}

        <ProposalCard api={api} />
      </div>

      {api.sourcesOpen ? (
        <SourcesPanel
          sources={api.sources}
          markers={api.citations.map((citation) => citation.marker)}
          onClose={api.closeSources}
        />
      ) : null}

      {props.scope}

      {/* The panel's own composer. Once the thread is open the dock is the
          wrong place to type: the answer you are following up on is up here,
          and making someone travel back down to the dock to ask about it is
          the kind of small friction that ends in a copy-paste into a chat
          window with none of this component's guarantees. */}
      <div className="zb-copilot-composer">
        <Input
          className="zb-copilot-composer-field"
          variant="borderless"
          value={api.draft}
          placeholder={locale.followUp}
          aria-label={locale.followUp}
          disabled={api.state.status === "crisis"}
          onChange={(event) => api.setDraft(event.target.value)}
          onPressEnter={(event) => {
            event.preventDefault();
            void api.submit();
          }}
        />
        <div className="zb-copilot-composer-row">
          {props.onAttach ? (
            <Tooltip title={locale.attach}>
              <Button type="text" size="small" aria-label={locale.attach} onClick={props.onAttach}>
                <PlusIcon />
              </Button>
            </Tooltip>
          ) : null}
          <Tooltip title={locale.shortcuts}>
            <Button
              type="text"
              size="small"
              aria-label={locale.shortcuts}
              onClick={() => api.setDraft(api.draft.startsWith("/") ? api.draft : "/")}
            >
              <ShortcutIcon />
            </Button>
          </Tooltip>

          {/* Mode stays reachable once the dock is gone. Without this, opening
              a thread would quietly remove the control that decides what the
              model is allowed to read — the one thing §7 says must never be
              implicit. */}
          <Dropdown
            menu={{
              selectedKeys: [api.mode.id],
              items: props.modes.map((mode) => ({
                key: mode.id,
                label: mode.label,
                icon: <ModeGlyph modeId={mode.id} />,
              })),
              onClick: ({ key }) => api.setMode(key),
            }}
          >
            <Button size="small" className="zb-copilot-mode-chip" aria-label={locale.modes}>
              <ModeGlyph modeId={api.mode.id} />
              {api.mode.label}
              <ChevronDownIcon />
            </Button>
          </Dropdown>

          {/* The sources chip from the mockup: what this answer will be built
              from, stated before the question rather than after the answer. */}
          <span className="zb-copilot-sources-chip">
            <SparkIcon />
            <WorkUpIcon />
            {locale.sourcesChip}
          </span>

          <span className="zb-copilot-composer-spacer" />

          <DictationButton api={api} />
          {api.state.status === "streaming" || api.state.status === "submitting" ? (
            <Button size="small" aria-label={locale.stop} onClick={api.stop} icon={<StopIcon />} />
          ) : (
            <Button
              type="primary"
              size="small"
              aria-label={locale.send}
              disabled={!api.canSubmit}
              onClick={() => void api.submit()}
              icon={<SendIcon />}
            />
          )}
        </div>
      </div>

      <p className="zb-copilot-disclaimer">{locale.disclaimer}</p>
    </section>
  );
}
