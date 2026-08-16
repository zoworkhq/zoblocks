"use client";

/**
 * SignatureModal — the signing dialog.
 *
 * Built on antd's `Modal` and `Tabs`, which give a real focus trap, ESC
 * handling, `role="tablist"` with roving tabindex, and arrow-key navigation.
 * They do not give the following, all of which are closed by hand here because
 * antd ships no accessibility documentation and its maintainers' stated
 * position on WCAG is "no plans yet":
 *
 *   1. **A dialog name.** `aria-labelledby` is wired only when `title` is
 *      passed. Our header is richer than a string, so we pass a `title` node
 *      *and* an explicit `aria-labelledby` via `modalRender`.
 *   2. **Sane initial focus.** antd's trap opens focus on an invisible
 *      sentinel `<div tabIndex={0}>` — an unlabelled landing spot for a
 *      screen-reader user. `afterOpenChange` moves it to the first required
 *      field, so tabbing forward follows the order the dialog is read in.
 *   3. **Tab/panel wiring.** `aria-controls` and `aria-labelledby` are emitted
 *      only when `<Tabs id>` is set. Omit it and the relationship is invisible
 *      to assistive technology, so `id` is always passed.
 *   4. **A localised close label.** antd hardcodes English `aria-label="Close"`,
 *      bypassing its own locale system.
 *
 * The Draw pane is deliberately *not* destroyed when hidden. antd would throw
 * the pane away on tab change, and with it the strokes — so someone who glances
 * at the Type tab and comes back finds their signature gone.
 */

import * as React from "react";
import { Alert, Button, Input, Modal, Select, Tabs, Upload } from "antd";
import type { InputRef } from "antd";
import {
  assessInk,
  isAffirmative,
  toInk,
  type Capacity,
  type CaptureMethod,
  type SignatureMeaning,
  type SignatureValue,
  type Signer,
  type Stroke,
  type Subject,
} from "@oxygenui-design/signature-core";
import { SignaturePad } from "./SignaturePad";
import { OutcomeSheet } from "./OutcomeSheet";
import { useLocale, type SignatureLocale } from "./locale";
import { renderTypedSignature, readImageFile } from "./typed";
import { rasterise } from "./rasterise";

export interface SignatureModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (value: SignatureValue) => void;

  /** ISO 8601, from the server. The component never reads the clock. */
  now: string;

  meaning?: SignatureMeaning;
  attestation?: React.ReactNode;
  subject?: Subject;
  /** Pre-fills the identity block when the host already knows who is signing. */
  signer?: Partial<Signer>;
  capacities?: Capacity[];
  methods?: CaptureMethod[];
  outcomes?: Array<"declined" | "unable" | "verbal" | "on-paper">;
  recordedBy?: Signer;
  documentHash?: string;
  captureBiometrics?: boolean;

  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  locale?: Partial<SignatureLocale>;
  onAuditEvent?: (event: { type: string; at: string; detail?: string }) => void;
}

/** Real ink colours, not tokens: these are baked into the archived PNG. */
const INK_HEX = { black: "#141414", blue: "#1d39c4" } as const;

const TYPE_STYLES = ["formal", "script", "plain"] as const;
type TypeStyle = (typeof TYPE_STYLES)[number];

export function SignatureModal({
  open,
  onCancel,
  onSubmit,
  now,
  meaning = "consent",
  attestation,
  subject,
  signer: signerDefaults,
  capacities = ["self", "parent", "proxy", "legal-representative"],
  methods = ["draw", "type", "upload"],
  outcomes = ["declined", "unable"],
  recordedBy,
  documentHash,
  captureBiometrics,
  title,
  subtitle,
  locale: localeOverrides,
  onAuditEvent,
}: SignatureModalProps) {
  const t = useLocale(localeOverrides);
  const reactId = React.useId();
  const base = `ox-sig-modal-${reactId.replace(/:/g, "")}`;
  const titleId = `${base}-title`;
  const tabsId = `${base}-tabs`;

  const [method, setMethod] = React.useState<CaptureMethod>(methods[0] ?? "draw");
  // Focused when the dialog opens; see `focusName` below.
  const nameRef = React.useRef<InputRef>(null);
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const [typedName, setTypedName] = React.useState("");
  const [typeStyle, setTypeStyle] = React.useState<TypeStyle>("formal");
  const [uploaded, setUploaded] = React.useState<{
    dataUrl: string;
    width: number;
    height: number;
  } | null>(null);
  const [name, setName] = React.useState(signerDefaults?.name ?? "");
  const [capacity, setCapacity] = React.useState<Capacity>(capacities[0] ?? "self");
  const [showOutcomes, setShowOutcomes] = React.useState(false);
  const [tooLittleInk, setTooLittleInk] = React.useState(false);
  // Black or blue. Some institutions still require blue to distinguish an
  // original from a photocopy, and the convention followed people into
  // software; it costs nothing to honour and is jarring to be denied.
  const [inkColour, setInkColour] = React.useState<"black" | "blue">("black");

  /*
   * Put focus on the first required field when the dialog opens.
   *
   * antd lands focus on an invisible sentinel `<div tabIndex={0}>`, which is
   * an unlabelled place for a screen-reader user to start. It used to be moved
   * to the active tab, which was better but still wrong: the name field sits
   * *above* the tablist, so a keyboard user starting there had to cycle the
   * whole dialog — past the pad, the actions and the close button — to reach
   * the first thing they have to fill in. Landing on the name makes forward
   * tabbing follow the order the dialog is read in.
   *
   * Called from two places on purpose. `afterOpenChange` is the correct hook
   * in a browser, because it runs after the focus trap has claimed focus — but
   * it fires on the end of the open transition, and an environment that never
   * runs the transition never fires it. jsdom 30 is such an environment, and
   * the regression it caused was silent: the dialog opened, everything
   * rendered, and focus simply stayed on the trigger. The effect below covers
   * that. Both target the same element, so whichever runs last is harmless.
   */
  const focusName = React.useCallback(() => {
    nameRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    // A frame later: the modal body mounts before antd's trap moves focus, so
    // focusing synchronously here would just be overridden.
    const frame = requestAnimationFrame(focusName);
    return () => cancelAnimationFrame(frame);
  }, [open, focusName]);

  const audit = React.useCallback(
    (type: string, detail?: string) => onAuditEvent?.({ type, at: now, detail }),
    [now, onAuditEvent],
  );

  // Every opening starts clean. On a shared bedside tablet, carrying a previous
  // patient's ink into the next signing is a disclosure, not a convenience.
  React.useEffect(() => {
    if (!open) return;
    setStrokes([]);
    setTypedName("");
    setUploaded(null);
    setShowOutcomes(false);
    setTooLittleInk(false);
    setName(signerDefaults?.name ?? "");
    setMethod(methods[0] ?? "draw");
    setInkColour("black");
    audit("opened");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Assessed from the strokes rather than tracked separately: a stray tap
  // produces strokes but not a signature, and the two must not diverge.
  const hasMark =
    method === "draw"
      ? assessInk(strokes).ok
      : method === "type"
        ? typedName.trim().length > 1
        : uploaded !== null;

  const canSubmit = hasMark && name.trim().length > 0;

  const [committing, setCommitting] = React.useState(false);

  const submit = async () => {
    if (!canSubmit || committing) {
      if (method === "draw" && !canSubmit) setTooLittleInk(true);
      return;
    }
    setCommitting(true);

    const ink =
      method === "draw"
        ? toInk(strokes)
        : method === "type"
          ? renderTypedSignature(typedName, typeStyle)
          : {
              strokes: [],
              svg: "",
              // No geometry to draw, so SignatureInk falls through to the
              // <img>. The data URL came from our own canvas re-encode, so it
              // is a bitmap rather than markup.
              render: {
                viewBox: `0 0 ${uploaded?.width ?? 0} ${uploaded?.height ?? 0}`,
                paths: [],
              },
              ...(uploaded?.dataUrl ? { png: uploaded.dataUrl } : {}),
              bounds: { x: 0, y: 0, width: uploaded?.width ?? 0, height: uploaded?.height ?? 0 },
            };

    /*
     * The PNG is produced here rather than in the engine, because rasterising
     * needs a canvas and the engine has to run on a server.
     *
     * It is not optional decoration: `Signature.data` in the FHIR mapping *is*
     * this PNG, so without it a drawn or typed signature produces a FHIR
     * Signature element with no payload. A failure is swallowed rather than
     * blocking the commit — a signature recorded without its raster is
     * recoverable from the stroke model, whereas a signature the person could
     * not complete is not.
     */
    let png: string | undefined;
    try {
      png = await rasterise(ink.svg, { color: INK_HEX[inkColour] });
    } catch {
      png = undefined;
    }

    const value: SignatureValue = {
      outcome: "signed",
      method,
      ink: png ? { ...ink, png } : ink,
      signer: { ...signerDefaults, name: name.trim() },
      capacity,
      meaning,
      ...(typeof attestation === "string" ? { attestation } : {}),
      // Set whenever the signature is given in a representative capacity — the
      // record has to say who it is for, not just who held the stylus.
      ...(capacity !== "self" && subject ? { onBehalfOf: subject } : {}),
      ...(documentHash ? { documentHash } : {}),
      recordedAt: now,
      ...(recordedBy ? { recordedBy } : {}),
      provenance: {
        method,
        ...(method === "draw" ? { strokeCount: strokes.length } : {}),
        ...(captureBiometrics ? {} : {}),
      },
    };

    audit("signed", method);
    setCommitting(false);
    onSubmit(value);
  };

  const items = methods.map((m) => ({
    key: m,
    label: m === "draw" ? t.methodDraw : m === "type" ? t.methodType : t.methodUpload,
    // Never destroy the Draw pane: antd would throw the strokes away, so a
    // glance at another tab would silently erase the signature.
    destroyOnHidden: false,
    children:
      m === "draw" ? (
        <>
          <div
            role="radiogroup"
            aria-label={t.inkColour}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBlockEnd: 8 }}
          >
            <span
              style={{ fontSize: 12, color: "var(--ant-color-text-description, rgba(0,0,0,0.45))" }}
            >
              {t.inkColour}
            </span>
            {(["black", "blue"] as const).map((colour) => (
              <button
                key={colour}
                type="button"
                role="radio"
                aria-checked={inkColour === colour}
                aria-label={t.ink[colour]}
                onClick={() => setInkColour(colour)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  // 24px minimum, per SC 2.5.8.
                  minHeight: 24,
                  padding: "2px 8px",
                  borderRadius: "var(--ant-border-radius, 6px)",
                  border: `1px solid ${
                    inkColour === colour
                      ? "var(--ant-color-primary, #1677ff)"
                      : "var(--ant-color-border, #d9d9d9)"
                  }`,
                  background: "transparent",
                  font: "inherit",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: INK_HEX[colour],
                    border: "1px solid var(--ant-color-border, #d9d9d9)",
                  }}
                />
                {/* Named, never colour alone — the swatch is decoration. */}
                {t.ink[colour]}
              </button>
            ))}
          </div>
          <SignaturePad
            height={190}
            hideLabel
            label={t.padLabel}
            locale={localeOverrides}
            ink={INK_HEX[inkColour]}
            error={tooLittleInk ? t.tooLittleInk : undefined}
            onChange={(next) => {
              setStrokes(next);
              setTooLittleInk(false);
            }}
          />
        </>
      ) : m === "type" ? (
        <TypePane
          value={typedName}
          onChange={setTypedName}
          style={typeStyle}
          onStyleChange={setTypeStyle}
          t={t}
        />
      ) : (
        <UploadPane onFile={setUploaded} current={uploaded} t={t} />
      ),
  }));

  if (showOutcomes) {
    return (
      <OutcomeSheet
        open={open}
        outcomes={outcomes}
        now={now}
        recordedBy={recordedBy}
        locale={localeOverrides}
        onBack={() => setShowOutcomes(false)}
        onCancel={onCancel}
        onSubmit={(value) => {
          audit(value.outcome);
          onSubmit(value);
        }}
      />
    );
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      // A signing dialog should not close because somebody brushed the
      // backdrop — WCAG 3.3.4 wants a legal commitment confirmed, and losing
      // a half-finished signature to a stray tap is the opposite.
      mask={{ closable: false }}
      destroyOnHidden
      width={640}
      title={<span id={titleId}>{title ?? "Signature"}</span>}
      closable={{ "aria-label": t.close }}
      afterOpenChange={(isOpen) => {
        // Runs when the open transition ends, which is after antd's focus
        // trap has claimed focus — so this is the call that wins in a real
        // browser. See `focusName` for why it is not the only one.
        if (isOpen) focusName();
      }}
      modalRender={(node) => (
        <div
          aria-labelledby={titleId}
          aria-describedby={attestation ? `${base}-attestation` : undefined}
        >
          {node}
        </div>
      )}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          {outcomes.length > 0 ? (
            <Button type="link" onClick={() => setShowOutcomes(true)}>
              {t.cantSign}
            </Button>
          ) : (
            <span />
          )}
          <span style={{ display: "flex", gap: 8 }}>
            <Button onClick={onCancel}>{t.cancel}</Button>
            <Button
              type="primary"
              onClick={() => void submit()}
              disabled={!canSubmit}
              loading={committing}
            >
              {t.sign}
            </Button>
          </span>
        </div>
      }
    >
      {subtitle ? (
        <div style={{ marginBlockEnd: 16, opacity: 0.65, marginBlockStart: -8 }}>{subtitle}</div>
      ) : null}

      {attestation ? (
        <Alert
          id={`${base}-attestation`}
          type="info"
          showIcon
          style={{ marginBlockEnd: 16 }}
          title={t.attestationTitle}
          description={attestation}
        />
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBlockEnd: 16 }}>
        <label>
          <div style={{ marginBlockEnd: 8 }}>
            <span style={{ color: "var(--ant-color-error, #ff4d4f)" }} aria-hidden="true">
              *{" "}
            </span>
            {t.fullName}
          </div>
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
          />
        </label>
        <label>
          <div style={{ marginBlockEnd: 8 }}>
            <span style={{ color: "var(--ant-color-error, #ff4d4f)" }} aria-hidden="true">
              *{" "}
            </span>
            {t.signingAs}
          </div>
          <Select<Capacity>
            value={capacity}
            onChange={setCapacity}
            style={{ width: "100%" }}
            options={capacities.map((c) => ({ value: c, label: t.capacity[c] ?? c }))}
          />
        </label>
      </div>

      <Tabs
        // Without an id, antd emits no aria-controls or aria-labelledby and the
        // tab/panel relationship is invisible to assistive technology.
        id={tabsId}
        activeKey={method}
        onChange={(key) => {
          setMethod(key as CaptureMethod);
          audit("method-changed", key);
        }}
        items={items}
      />
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The typed pane — the path that makes this component conform at Level A.
 *
 * The field is **never pre-filled**, and that is a legal requirement rather
 * than a preference. Every authority on typed signatures turns on intent to
 * sign, and the one case that went the other way — *Cunningham v. Zurich* —
 * failed precisely because nothing showed the name "was typed purposefully
 * rather than generated automatically". An autofilled name is that fact
 * pattern. The label says "type your name **to sign**" for the same reason.
 */
function TypePane({
  value,
  onChange,
  style,
  onStyleChange,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  style: TypeStyle;
  onStyleChange: (s: TypeStyle) => void;
  t: SignatureLocale;
}) {
  return (
    <div>
      <label>
        <div style={{ marginBlockEnd: 8 }}>{t.typeLabel}</div>
        <Input
          size="large"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.typePlaceholder}
          // Autofill is exactly what Cunningham punished. The person signing
          // must type it.
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
        />
      </label>
      <div style={{ marginBlock: "4px 16px", opacity: 0.65 }}>{t.typeHelp}</div>

      <div style={{ border: "1px solid var(--ant-color-border, #d9d9d9)", borderRadius: 8 }}>
        <div
          role="group"
          aria-label={t.typeStyle}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "8px 12px",
            borderBottom: "1px solid var(--ant-color-border-secondary, #f0f0f0)",
          }}
        >
          <span style={{ opacity: 0.65, fontSize: 12 }}>{t.typeStyle}</span>
          {TYPE_STYLES.map((s) => (
            <Button
              key={s}
              size="small"
              type={s === style ? "primary" : "default"}
              onClick={() => onStyleChange(s)}
              aria-pressed={s === style}
            >
              {s}
            </Button>
          ))}
        </div>
        <div className="ox-signature__typed" data-style={style}>
          {value || <span style={{ opacity: 0.3 }}>{t.typePlaceholder}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * The upload pane.
 *
 * `Upload.Dragger` rather than plain `Upload`, deliberately: antd's `Upload`
 * renders `role="button"` inside a `<button>`, which is nested interactive
 * content and a real WCAG failure it ships today. The dragger is a drop zone
 * and sidesteps it.
 *
 * `beforeUpload` returns false so nothing is ever transmitted — this component
 * makes no network calls, which is lint-enforced across the repository.
 */
function UploadPane({
  onFile,
  current,
  t,
}: {
  onFile: (v: { dataUrl: string; width: number; height: number } | null) => void;
  current: { dataUrl: string } | null;
  t: SignatureLocale;
}) {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div>
      <Upload.Dragger
        accept="image/png,image/jpeg"
        maxCount={1}
        showUploadList={false}
        beforeUpload={(file) => {
          setError(null);
          if (file.size > 2 * 1024 * 1024) {
            setError("That image is larger than 2 MB.");
            return Upload.LIST_IGNORE;
          }
          void readImageFile(file)
            .then(onFile)
            .catch(() => setError("That file could not be read as an image."));
          // false, not LIST_IGNORE: the file is handled entirely in the
          // browser and never sent anywhere.
          return false;
        }}
      >
        <p style={{ fontSize: 40, margin: 0, color: "var(--ant-color-primary, #1677ff)" }}>⬆</p>
        <p style={{ fontSize: 16, marginBlock: 12 }}>{t.uploadPrompt}</p>
        <p style={{ opacity: 0.65, margin: 0 }}>{t.uploadHint}</p>
      </Upload.Dragger>

      {current ? (
        <div
          style={{
            marginBlockStart: 16,
            padding: 12,
            border: "1px solid var(--ant-color-border, #d9d9d9)",
            borderRadius: 8,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.dataUrl}
            alt="The signature image you uploaded"
            style={{ maxWidth: "100%", maxHeight: 120 }}
          />
        </div>
      ) : null}

      {error ? (
        <Alert type="error" showIcon style={{ marginBlockStart: 16 }} title={error} />
      ) : null}

      <Alert type="warning" showIcon style={{ marginBlockStart: 16 }} title={t.uploadWarning} />
    </div>
  );
}

export { isAffirmative };
