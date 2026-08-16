/**
 * `<Consult>` — the dock, the panel, and everything in between.
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
import { Button, Input, Space, Tooltip, Typography } from "antd";
import {
  ConsultAnswerRegion,
  ConsultDockRegion,
  ConsultLiveRegion,
  ConsultRoot,
  useConsult,
  useShortcutMenu,
  useSummonShortcut,
  type ConsultShortcut,
  type UseConsultOptions,
} from "@oxygenui-design/consult-react";
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
import { ConsultLocaleProvider, useLocale, type ConsultLocale } from "./locale.js";

const { Text } = Typography;

export interface ConsultProps extends UseConsultOptions {
  readonly shortcuts?: readonly ConsultShortcut[];
  /** Role the shortcut menu is filtered for. */
  readonly role?: string;
  /**
   * String overrides. Named `messages` rather than `locale` because
   * `UseConsultOptions.locale` is already the BCP-47 tag that drives crisis-line
   * resolution and the request's language — two different things called
   * "locale" in one props object is the kind of API that produces a bug report
   * about 988 appearing in Manchester.
   */
  readonly messages?: Partial<ConsultLocale>;
  readonly anchor?: "bottom-center" | "bottom-right" | "inline";
  readonly className?: string;
  /** Called when the clinician asks to change what the assistant can read. */
  readonly onChangeScope?: () => void;
  /** Escalation hooks for the crisis interstitial. */
  readonly onRiskProtocol?: () => void;
  readonly onPageOnCall?: () => void;
  /** Insert accepted text into the host's note. */
  readonly onInsert?: (text: string) => void;
}

export function Consult(props: ConsultProps): React.ReactNode {
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
    ...consultOptions
  } = props;

  const api = useConsult(consultOptions);

  return (
    <ConsultLocaleProvider {...(messages ? { value: messages } : {})}>
      <ConsultRoot api={api}>
        <ConsultSurface
          api={api}
          shortcuts={shortcuts}
          {...(role !== undefined ? { role } : {})}
          anchor={anchor}
          {...(className !== undefined ? { className } : {})}
          {...(onChangeScope ? { onChangeScope } : {})}
          {...(onRiskProtocol ? { onRiskProtocol } : {})}
          {...(onPageOnCall ? { onPageOnCall } : {})}
          {...(onInsert ? { onInsert } : {})}
        />
      </ConsultRoot>
    </ConsultLocaleProvider>
  );
}

interface SurfaceProps {
  api: ReturnType<typeof useConsult>;
  shortcuts: readonly ConsultShortcut[];
  role?: string;
  anchor: "bottom-center" | "bottom-right" | "inline";
  className?: string;
  onChangeScope?: () => void;
  onRiskProtocol?: () => void;
  onPageOnCall?: () => void;
  onInsert?: (text: string) => void;
}

function ConsultSurface(props: SurfaceProps): React.ReactNode {
  const { api, shortcuts, role, anchor, className } = props;
  const locale = useLocale();
  const [trayOpen, setTrayOpen] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
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

  return (
    <div
      className={["ox-consult", `ox-consult--${anchor}`, className].filter(Boolean).join(" ")}
      data-status={api.state.status}
    >
      <ConsultLiveRegion message={api.announcer.message} />

      {threadOpen ? (
        <ConsultPanel
          api={api}
          {...(props.onInsert ? { onInsert: props.onInsert } : {})}
          {...(props.onRiskProtocol ? { onRiskProtocol: props.onRiskProtocol } : {})}
          {...(props.onPageOnCall ? { onPageOnCall: props.onPageOnCall } : {})}
        />
      ) : null}

      <ConsultDockRegion label={locale.dockLabel} className="ox-consult-dock-region">
        {trayOpen ? (
          <div className="ox-consult-tray">
            <div className="ox-consult-tray-modes" role="group" aria-label={locale.modes}>
              {api.modes.map((mode) => (
                <Button
                  key={mode.id}
                  size="small"
                  type={mode.id === api.mode.id ? "primary" : "default"}
                  aria-pressed={mode.id === api.mode.id}
                  onClick={() => api.setMode(mode.id)}
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
                ✕
              </Button>
            </div>
            <ul className="ox-consult-suggestions">
              {api.mode.suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => {
                      api.setDraft(suggestion.question ?? suggestion.label);
                      setTrayOpen(false);
                    }}
                  >
                    <span className="ox-consult-suggestion-label">{suggestion.label}</span>
                    {suggestion.reads ? (
                      <span className="ox-consult-suggestion-reads">{suggestion.reads}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {menu.open ? (
          <ul className="ox-consult-shortcuts" {...menu.listProps} aria-label={locale.shortcuts}>
            {menu.items.map((item, index) => (
              <li key={item.id} {...menu.optionProps(index)} className="ox-consult-shortcut">
                {item.label}
                {item.description ? (
                  <span className="ox-consult-shortcut-desc">{item.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <ScopeStrip scope={api.scope} {...(props.onChangeScope ? { onChange: props.onChangeScope } : {})} />

        <div className="ox-consult-dock">
          <Tooltip title={locale.shortcuts}>
            <Button
              type="text"
              aria-label={locale.shortcuts}
              onClick={() => api.setDraft(api.draft.startsWith("/") ? api.draft : "/")}
            >
              ⌘
            </Button>
          </Tooltip>

          <Input
            ref={(node) => setInputEl(node?.input ?? null)}
            className="ox-consult-field"
            variant="borderless"
            value={api.draft}
            placeholder={api.mode.reads.length > 0 ? locale.placeholder : locale.placeholderPatient}
            aria-label={locale.dockLabel}
            disabled={api.state.status === "crisis"}
            onChange={(event) => api.setDraft(event.target.value)}
            onPressEnter={(event) => {
              if (menu.open) return;
              event.preventDefault();
              submit();
            }}
            {...menu.inputProps}
          />

          <Button size="small" onClick={() => setTrayOpen((open) => !open)} aria-expanded={trayOpen}>
            {api.mode.label}
          </Button>

          <DictationButton api={api} />

          {api.state.status === "streaming" || api.state.status === "submitting" ? (
            <Button aria-label={locale.stop} onClick={api.stop}>
              {locale.stop}
            </Button>
          ) : (
            <Button
              type="primary"
              aria-label={locale.send}
              disabled={!api.canSubmit}
              onClick={submit}
            >
              {locale.send}
            </Button>
          )}
        </div>

        <div className="ox-consult-footer">
          <Text type="secondary" className="ox-consult-disclaimer">
            {locale.disclaimer}
          </Text>
          <Button type="link" size="small" onClick={() => setDisclosureOpen((open) => !open)}>
            {locale.disclosureTitle}
          </Button>
        </div>

        {disclosureOpen ? <DisclosureSheet disclosure={api.disclosure} /> : null}
      </ConsultDockRegion>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DictationButton(props: { api: ReturnType<typeof useConsult> }): React.ReactNode {
  const locale = useLocale();
  const { dictation } = props.api;

  if (dictation.active) {
    return (
      <Button
        danger
        aria-label={locale.stopDictation}
        onClick={() => dictation.stop()}
        className="ox-consult-dictating"
      >
        <span className="ox-consult-wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="ox-consult-visually-hidden">{locale.dictationLive}</span>
      </Button>
    );
  }

  return (
    <Button aria-label={locale.startDictation} onClick={dictation.start}>
      🎙
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

function ConsultPanel(props: {
  api: ReturnType<typeof useConsult>;
  onInsert?: (text: string) => void;
  onRiskProtocol?: () => void;
  onPageOnCall?: () => void;
}): React.ReactNode {
  const { api } = props;
  const locale = useLocale();

  return (
    <section className="ox-consult-panel" aria-label={locale.panelLabel}>
      <header className="ox-consult-panel-head">
        <h2 className="ox-consult-panel-title">{api.mode.label}</h2>
        <Space>
          <Button size="small" onClick={api.newThread}>
            {locale.newChat}
          </Button>
        </Space>
      </header>

      <div className="ox-consult-thread">
        {api.state.messages.map((message) =>
          message.role === "clinician" ? (
            <p key={message.id} className="ox-consult-msg-user">
              {message.text}
            </p>
          ) : (
            <article key={message.id} className="ox-consult-msg-assistant">
              {message.answer ? <RegisterBadge answer={message.answer} /> : null}
              {message.answer ? (
                <AnswerBody answer={message.answer} onCite={() => api.openSources()} />
              ) : null}
              {message.checks ? <CheckNotices findings={message.checks.findings} /> : null}
              <Space className="ox-consult-msg-actions">
                <Button size="small" onClick={() => api.sendFeedback("up")}>
                  {locale.helpful}
                </Button>
                <Button size="small" onClick={() => api.sendFeedback("down")}>
                  {locale.notHelpful}
                </Button>
                <Button size="small" type="primary" ghost onClick={api.openSources}>
                  {locale.showSources}
                </Button>
                {props.onInsert ? (
                  <Button size="small" onClick={() => props.onInsert?.(message.text)}>
                    {locale.insert}
                  </Button>
                ) : null}
              </Space>
            </article>
          ),
        )}

        {api.state.status === "streaming" && api.state.current ? (
          <ConsultAnswerRegion busy className="ox-consult-streaming">
            {api.state.current.text}
          </ConsultAnswerRegion>
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
          <div className="ox-consult-refused" role="status">
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
          <div className="ox-consult-error" role="alert">
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
          <p className="ox-consult-notice" role="status">
            {locale.stoppedNotice}
          </p>
        ) : null}

        <ProposalCard api={api} />
      </div>

      {api.sourcesOpen ? (
        <SourcesPanel sources={api.sources} onClose={api.closeSources} />
      ) : null}

      <p className="ox-consult-disclaimer">{locale.disclaimer}</p>
    </section>
  );
}
