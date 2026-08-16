/**
 * The pieces the dock and the panel share.
 *
 * A note on antd usage throughout this skin: every antd control that renders a
 * close button gets `closable={false}` and a hand-rolled button instead. antd
 * hardcodes `aria-label="Close"` outside its own locale system — a gap found
 * during the Signature work — and a component whose argument is accessibility
 * cannot ship an untranslatable control.
 */

import { Alert, Button, Space, Tag, Tooltip, Typography } from "antd";
import {
  citationLabel,
  segmentAnswer,
  type ConsultApi,
  type Answer,
  type CheckFinding,
  type CrisisLine,
  type ScopeSummary,
  type Source,
} from "@oxygenui-design/consult-react";
import {
  disclosureCompleteness,
  disclosureFields,
  DISCLOSURE_LABELS,
  DISCLOSURE_SECTIONS,
  type ModelDisclosure,
} from "@oxygenui-design/consult-core";
import { useLocale } from "./locale.js";

const { Text, Paragraph } = Typography;

/* ------------------------------------------------------------------ */
/* Register badge                                                      */
/* ------------------------------------------------------------------ */

/**
 * Grounded / General / Declined, rendered so the three are distinguishable at
 * a glance rather than by reading.
 *
 * Law 3: a model that answers everything in the same assured register teaches
 * clinicians to trust everything equally.
 */
export function RegisterBadge(props: { answer: Answer }): React.ReactNode {
  const locale = useLocale();
  const { register, sources } = props.answer;

  if (register === "grounded") {
    return (
      <Tag color="green" className="ox-consult-register" data-register="grounded">
        {locale.grounded} · {sources.size}
      </Tag>
    );
  }
  if (register === "general") {
    return (
      <Tag color="gold" className="ox-consult-register" data-register="general">
        {locale.general}
      </Tag>
    );
  }
  return (
    <Tag className="ox-consult-register" data-register="declined">
      {locale.declined}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Answer body                                                         */
/* ------------------------------------------------------------------ */

/**
 * The answer, with inline citation markers and uncited spans marked.
 *
 * Markers are buttons rather than links because they open a local drawer, and
 * each carries a real accessible name — "Source 1, 2023 ACC/AHA AF guideline"
 * rather than "1". A superscript numeral read aloud as a bare number tells a
 * screen-reader user nothing.
 */
export function AnswerBody(props: {
  answer: Answer;
  onCite: (marker: number) => void;
}): React.ReactNode {
  const locale = useLocale();
  const segments = segmentAnswer(props.answer);

  return (
    <div className="ox-consult-answer" data-register={props.answer.register}>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={segment.uncited ? "ox-consult-uncited" : undefined}
          {...(segment.uncited ? { title: locale.unsupportedHint } : {})}
        >
          {segment.text}
          {segment.markers.map((marker) => (
            <button
              key={marker}
              type="button"
              className="ox-consult-marker"
              aria-label={citationLabel(marker, props.answer.sources.get(marker))}
              onClick={() => props.onCite(marker)}
            >
              {marker}
            </button>
          ))}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Check findings                                                      */
/* ------------------------------------------------------------------ */

export function CheckNotices(props: { findings: readonly CheckFinding[] }): React.ReactNode {
  if (props.findings.length === 0) return null;
  const severityOrder = { refuse: 0, downgrade: 1, flag: 2 } as const;
  const sorted = [...props.findings].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );

  return (
    <div className="ox-consult-findings">
      {sorted.map((finding, index) => (
        <Alert
          key={`${finding.code}-${index}`}
          type={finding.severity === "refuse" ? "error" : finding.severity === "downgrade" ? "warning" : "info"}
          message={finding.message}
          {...(finding.detail ? { description: finding.detail } : {})}
          showIcon
          banner
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

/**
 * The verification surface — §5 state 07, and the FDA's fourth criterion.
 *
 * Renders the retrieved passage with the supporting clause highlighted, not a
 * list of links. Following a link costs a tab, a load and a search, and the
 * whole automation-bias finding is that people accept rather than pay that
 * cost. The passage is the basis; the link is a convenience.
 */
export function SourcesPanel(props: {
  sources: readonly Source[];
  onClose: () => void;
}): React.ReactNode {
  const locale = useLocale();

  return (
    <section className="ox-consult-sources" aria-label={locale.basisOfAnswer}>
      <header className="ox-consult-sources-head">
        <Text strong>{locale.basisOfAnswer}</Text>
        <Button type="text" size="small" aria-label={locale.close} onClick={props.onClose}>
          ✕
        </Button>
      </header>
      <ol className="ox-consult-source-list">
        {props.sources.map((source, index) => (
          <li key={source.id} className="ox-consult-source">
            <div className="ox-consult-source-title">
              <span className="ox-consult-source-marker" aria-hidden="true">
                {index + 1}
              </span>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer noopener">
                  {source.title}
                </a>
              ) : (
                <Text strong>{source.title}</Text>
              )}
            </div>
            <blockquote className="ox-consult-passage">
              <Highlighted passage={source.passage} highlight={source.highlight} />
            </blockquote>
            <div className="ox-consult-source-meta">
              <span>
                {locale.retrieved} {source.retrievedAt.slice(0, 10)}
              </span>
              {source.version ? (
                <span>
                  {locale.version} {source.version}
                </span>
              ) : null}
              <span>{source.kind}</span>
              {source.score !== undefined ? (
                <span>
                  {locale.match} {source.score.toFixed(2)}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Highlighted(props: {
  passage: string;
  highlight: readonly [number, number] | undefined;
}): React.ReactNode {
  const { passage, highlight } = props;
  if (!highlight) return <>{passage}</>;
  const [start, end] = highlight;
  const safeStart = Math.max(0, Math.min(start, passage.length));
  const safeEnd = Math.max(safeStart, Math.min(end, passage.length));
  return (
    <>
      {passage.slice(0, safeStart)}
      <mark>{passage.slice(safeStart, safeEnd)}</mark>
      {passage.slice(safeEnd)}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Scope strip                                                         */
/* ------------------------------------------------------------------ */

/**
 * The highest-value pixel in the component.
 *
 * A clinician looking at a floating assistant has one question they cannot
 * otherwise answer: what does this thing know about my patient right now?
 * Without an answer they must assume either too much or too little, and
 * neither is recoverable through better answers.
 *
 * The third part — what is missing and why — is the one everyone omits and the
 * one that matters most. A summary that silently excludes a Part 2 record and
 * says nothing has actively created a false belief.
 */
export function ScopeStrip(props: {
  scope: ScopeSummary;
  onChange?: () => void;
}): React.ReactNode {
  const locale = useLocale();
  const { scope } = props;

  if (scope.categories.length === 0) {
    return (
      <p className="ox-consult-scope" data-empty="true">
        <span className="ox-consult-scope-text">{locale.readingNothing}</span>
      </p>
    );
  }

  return (
    <p className="ox-consult-scope">
      <span className="ox-consult-scope-text">
        {locale.reading}{" "}
        <strong>{scope.subject?.display ?? scope.subject?.reference ?? ""}</strong>
        {" · "}
        {scope.categories.join(", ")}
      </span>
      {scope.showWithheld ? (
        <Tooltip title={locale.unsupportedHint}>
          <span className="ox-consult-withheld">{locale.withheld(scope.withheldCount)}</span>
        </Tooltip>
      ) : null}
      {props.onChange ? (
        <Button type="link" size="small" onClick={props.onChange}>
          {locale.changeScope}
        </Button>
      ) : null}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Crisis                                                              */
/* ------------------------------------------------------------------ */

/**
 * The crisis interstitial. Replaces the answer; never annotates it.
 *
 * Copy is deliberately plain rather than warm. Warmth here reads as the machine
 * continuing to play a role it needs to exit.
 */
export function CrisisNotice(props: {
  audience: "user" | "third-party";
  lines: readonly CrisisLine[];
  onProtocol?: () => void;
  onPage?: () => void;
}): React.ReactNode {
  const locale = useLocale();

  return (
    <section className="ox-consult-crisis" role="alert" aria-label={locale.crisisTitle}>
      <h3 className="ox-consult-crisis-title">{locale.crisisTitle}</h3>
      <p className="ox-consult-crisis-body">
        {props.audience === "user" ? locale.crisisBodyUser : locale.crisisBodyThirdParty}
      </p>
      <Space wrap>
        {props.onProtocol ? (
          <Button type="primary" danger onClick={props.onProtocol}>
            {locale.crisisProtocol}
          </Button>
        ) : null}
        {props.lines.map((line) =>
          line.number ? (
            <Button key={line.label} href={`tel:${line.number}`}>
              {line.label} · {line.number}
            </Button>
          ) : (
            <Button key={line.label} disabled>
              {line.label}
            </Button>
          ),
        )}
        {props.onPage ? <Button onClick={props.onPage}>{locale.crisisOnCall}</Button> : null}
      </Space>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Disclosure                                                          */
/* ------------------------------------------------------------------ */

/**
 * The model disclosure sheet, structured to HTI-1's 31 source attributes.
 *
 * Renders the gaps as visibly as the answers. A customer who sees "6 of 31
 * attributes answered" has learned something about their vendor that no prose
 * disclosure would have told them, and that is the point of showing the count.
 */
export function DisclosureSheet(props: { disclosure: ModelDisclosure }): React.ReactNode {
  const locale = useLocale();
  const { answered, total } = disclosureCompleteness(props.disclosure);

  return (
    <section className="ox-consult-disclosure" aria-label={locale.disclosureTitle}>
      <header>
        <Text strong>{locale.disclosureTitle}</Text>
        <Text type="secondary"> · {locale.disclosureCompleteness(answered, total)}</Text>
      </header>
      {DISCLOSURE_SECTIONS.map((section) => (
        <div key={section} className="ox-consult-disclosure-section">
          <h4>{DISCLOSURE_LABELS[section]}</h4>
          <dl>
            {disclosureFields(section).map((field) => {
              const value = props.disclosure[field];
              const present = value !== undefined && value !== null && value !== "";
              return (
                <div key={String(field)} data-answered={present}>
                  <dt>{humanise(String(field))}</dt>
                  <dd>
                    {present ? (
                      String(value)
                    ) : (
                      <Text type="secondary">{locale.disclosureUnanswered}</Text>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      ))}
      <Paragraph type="secondary" className="ox-consult-disclaimer">
        {locale.disclaimer}
      </Paragraph>
    </section>
  );
}

function humanise(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/* ------------------------------------------------------------------ */
/* Proposal                                                            */
/* ------------------------------------------------------------------ */

/**
 * Propose → confirm → attribute.
 *
 * Two details make the confirm step real rather than theatre. The diff shows
 * *what changes* rather than restating the proposal, and the default focus is
 * on Discard rather than Confirm — a confirmation people click through
 * reflexively is worse than none, because it launders the model's output as
 * human judgement while adding no scrutiny.
 */
export function ProposalCard(props: { api: ConsultApi }): React.ReactNode {
  const locale = useLocale();
  const { proposal } = props.api;
  if (!proposal) return null;

  return (
    <section className="ox-consult-proposal" aria-label={locale.proposalTitle}>
      <h4>{proposal.summary}</h4>
      <div className="ox-consult-diff" aria-label={locale.proposalDiff}>
        {proposal.replaces ? (
          <del className="ox-consult-diff-removed">{proposal.replaces}</del>
        ) : null}
        <ins className="ox-consult-diff-added">{proposal.content}</ins>
      </div>
      <Space>
        {/* Discard first, and autofocused. Confirm is never the default. */}
        <Button autoFocus onClick={props.api.dismissProposal}>
          {locale.proposalDismiss}
        </Button>
        <Button type="primary" onClick={props.api.confirm}>
          {locale.proposalConfirm}
        </Button>
      </Space>
    </section>
  );
}
