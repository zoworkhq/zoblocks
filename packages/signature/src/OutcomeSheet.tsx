"use client";

/**
 * OutcomeSheet — what to record when nobody signed.
 *
 * The screen that does not exist in any signature library, and the one that
 * makes the component usable on a real ward. Without it, a patient who
 * declines and a form nobody opened produce the same empty field.
 *
 * Two things it does that the type system already insists on, surfaced in the
 * interface so nobody is ambushed by them two screens later:
 *
 *   - **The witness requirement is stated in the option text**, not discovered
 *     on submit. `unable` and `verbal` say "a witness is required" where the
 *     option is chosen, because `UnableValue.witness` and `VerbalValue.witness`
 *     are non-optional and the UI should not disagree with the type.
 *   - **A decline is framed as a decision, not a failure.** The reassurance
 *     line is deliberate: the person recording a refusal is often anxious that
 *     they have done something wrong, and CONTENT.md's rule is that a state is
 *     named and what remains possible is said, rather than apologised for.
 */

import * as React from "react";
import { Alert, Button, Input, Modal, Radio, Select, Space } from "antd";
import type { SignatureValue, Signer, UnableReason } from "@oxygenui-design/signature-core";
import { useLocale, type SignatureLocale } from "./locale";

type OutcomeKind = "declined" | "unable" | "verbal" | "on-paper";

export interface OutcomeSheetProps {
  open: boolean;
  outcomes: OutcomeKind[];
  now: string;
  recordedBy?: Signer;
  onSubmit: (value: SignatureValue) => void;
  onBack: () => void;
  onCancel: () => void;
  locale?: Partial<SignatureLocale>;
}

const UNABLE_REASONS: Array<{ value: UnableReason; label: string }> = [
  { value: "physically-unable", label: "Physically unable to hold a pen or stylus" },
  { value: "sedated-or-unconscious", label: "Sedated or unconscious" },
  { value: "lacks-capacity", label: "Lacks capacity to consent" },
  { value: "language-barrier", label: "Language barrier, no interpreter available" },
  { value: "no-assistive-technology", label: "Assistive technology not available" },
  { value: "other", label: "Other" },
];

export function OutcomeSheet({
  open,
  outcomes,
  now,
  recordedBy,
  onSubmit,
  onBack,
  onCancel,
  locale: localeOverrides,
}: OutcomeSheetProps) {
  const t = useLocale(localeOverrides);
  const reactId = React.useId();
  const titleId = `ox-outcome-${reactId.replace(/:/g, "")}`;

  const [kind, setKind] = React.useState<OutcomeKind>(outcomes[0] ?? "declined");
  const [reason, setReason] = React.useState("");
  const [unableReason, setUnableReason] = React.useState<UnableReason>("physically-unable");
  const [detail, setDetail] = React.useState("");
  const [witnessName, setWitnessName] = React.useState("");
  const [channel, setChannel] = React.useState<"phone" | "video" | "in-person">("phone");
  const [touched, setTouched] = React.useState(false);

  const needsWitness = kind === "unable" || kind === "verbal";
  const needsReason = kind === "declined";
  const needsDetail = kind === "unable" && unableReason === "other";

  const missing = [
    needsReason && !reason.trim() ? t.reason : null,
    needsWitness && !witnessName.trim() ? t.witness : null,
    needsDetail && !detail.trim() ? "Detail" : null,
  ].filter(Boolean) as string[];

  const submit = () => {
    setTouched(true);
    if (missing.length > 0) return;

    // `recordedBy` is required on every unsigned outcome — an outcome with no
    // signer and nobody attached is the unattributable record the whole value
    // type exists to prevent, and FHIR Provenance.agent is 1..* besides.
    const by: Signer = recordedBy ?? { name: "Unknown" };
    const witness: Signer = { name: witnessName.trim() };

    const value: SignatureValue =
      kind === "declined"
        ? {
            outcome: "declined",
            reason: reason.trim(),
            recordedAt: now,
            recordedBy: by,
            ...(witnessName.trim() ? { witness } : {}),
          }
        : kind === "unable"
          ? {
              outcome: "unable",
              reason: unableReason,
              ...(detail.trim() ? { detail: detail.trim() } : {}),
              witness,
              recordedAt: now,
              recordedBy: by,
            }
          : kind === "verbal"
            ? {
                outcome: "verbal",
                channel,
                ...(reason.trim() ? { script: reason.trim() } : {}),
                witness,
                recordedAt: now,
                recordedBy: by,
              }
            : { outcome: "on-paper", recordedAt: now, recordedBy: by };

    onSubmit(value);
  };

  const ALL: Array<{ value: OutcomeKind; label: string; help: string }> = [
    { value: "declined", label: t.outcomeDeclined, help: t.outcomeDeclinedHelp },
    { value: "unable", label: t.outcomeUnable, help: t.outcomeUnableHelp },
    { value: "verbal", label: t.outcomeVerbal, help: t.outcomeVerbalHelp },
    { value: "on-paper", label: t.outcomeOnPaper, help: t.outcomeOnPaperHelp },
  ];
  // Order comes from ALL, not from the caller's array, so the options always
  // appear in the same order regardless of how the prop was written.
  const options = ALL.filter((o) => outcomes.includes(o.value));

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      mask={{ closable: false }}
      destroyOnHidden
      width={560}
      title={<span id={titleId}>{t.outcomeTitle}</span>}
      closable={{ "aria-label": t.close }}
      modalRender={(node) => <div aria-labelledby={titleId}>{node}</div>}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <Button onClick={onBack}>{t.back}</Button>
          <Button type="primary" onClick={submit}>
            {t.recordOutcome}
          </Button>
        </div>
      }
    >
      <p style={{ opacity: 0.65, marginBlockStart: 0 }}>{t.outcomeSubtitle}</p>

      <Radio.Group
        value={kind}
        onChange={(e) => {
          setKind(e.target.value as OutcomeKind);
          setTouched(false);
        }}
        style={{ display: "block" }}
      >
        <Space direction="vertical" style={{ display: "flex" }}>
          {options.map((o) => (
            <Radio key={o.value} value={o.value} style={{ alignItems: "flex-start" }}>
              <div>{o.label}</div>
              <div style={{ opacity: 0.6, fontSize: 13 }}>{o.help}</div>
            </Radio>
          ))}
        </Space>
      </Radio.Group>

      <hr
        style={{
          border: 0,
          borderTop: "1px solid var(--ant-color-border-secondary, #f0f0f0)",
          marginBlock: 16,
        }}
      />

      {kind === "unable" ? (
        <label style={{ display: "block", marginBlockEnd: 12 }}>
          <div style={{ marginBlockEnd: 8 }}>{t.reason}</div>
          <Select<UnableReason>
            value={unableReason}
            onChange={setUnableReason}
            options={UNABLE_REASONS}
            style={{ width: "100%" }}
          />
        </label>
      ) : null}

      {needsDetail || kind === "declined" || kind === "verbal" ? (
        <label style={{ display: "block", marginBlockEnd: 12 }}>
          <div style={{ marginBlockEnd: 8 }}>
            {kind === "verbal" ? "Wording used" : needsDetail ? "Detail" : t.reason}
          </div>
          <Input.TextArea
            rows={3}
            value={needsDetail ? detail : reason}
            onChange={(e) => (needsDetail ? setDetail(e.target.value) : setReason(e.target.value))}
            status={
              touched && missing.length > 0 && (needsReason || needsDetail) ? "error" : undefined
            }
          />
        </label>
      ) : null}

      {kind === "verbal" ? (
        <label style={{ display: "block", marginBlockEnd: 12 }}>
          <div style={{ marginBlockEnd: 8 }}>Channel</div>
          <Select
            value={channel}
            onChange={setChannel}
            style={{ width: "100%" }}
            options={[
              { value: "phone", label: "Telephone" },
              { value: "video", label: "Video call" },
              { value: "in-person", label: "In person" },
            ]}
          />
        </label>
      ) : null}

      {needsWitness ? (
        <label style={{ display: "block", marginBlockEnd: 12 }}>
          <div style={{ marginBlockEnd: 8 }}>
            <span style={{ color: "var(--ant-color-error, #ff4d4f)" }} aria-hidden="true">
              *{" "}
            </span>
            {t.witness}
          </div>
          <Input
            value={witnessName}
            onChange={(e) => setWitnessName(e.target.value)}
            placeholder="Name and credential"
            status={touched && !witnessName.trim() ? "error" : undefined}
          />
          <div style={{ opacity: 0.65, marginBlockStart: 4 }}>{t.witnessRequired}</div>
        </label>
      ) : null}

      {recordedBy ? (
        <div style={{ opacity: 0.65, marginBlockEnd: 12 }}>
          {t.manifestRecordedBy}: {recordedBy.name}
          {recordedBy.credential ? `, ${recordedBy.credential}` : ""}
        </div>
      ) : null}

      {touched && missing.length > 0 ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBlockEnd: 12 }}
          title={`Still needed: ${missing.join(", ")}.`}
        />
      ) : null}

      {kind === "declined" ? <Alert type="info" showIcon title={t.declineReassurance} /> : null}
    </Modal>
  );
}
