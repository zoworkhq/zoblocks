/**
 * `PatientVerify` and `useWristbandMatch` — the 40% interventions.
 *
 * Adelman et al. (JAMIA 2013), 901,776 ordering sessions: a dismissible
 * ID-verify alert reduced wrong-patient orders with an odds ratio of 0.84; an
 * ID-*reentry* step reduced them with an odds ratio of 0.60. Everyone ships the
 * first. This is the second.
 */

import { identityInitials, type Identity } from "@zoblocks/identity-core";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useIdentityPolicy } from "./IdentityProvider.js";

export type VerifyMode = "initials" | "birth-date";

/** Literal class map. See the note in `states.tsx`. */
const VERIFY_STATE_CLASS = {
  idle: "zb-verify--idle",
  wrong: "zb-verify--wrong",
  confirmed: "zb-verify--confirmed",
} as const;

export interface PatientVerifyProps {
  identity: Identity;
  /**
   * What the clinician is about to do. Named in the prompt, because
   * CONTENT.md §4 says state the consequence rather than asking "are you sure".
   */
  action: string;
  mode?: VerifyMode;
  onConfirm: () => void;
  onCancel?: () => void;
  /** Fired on every failed attempt, so the application can count near misses. */
  onFailure?: (attempt: string) => void;
}

const pad2 = (v = ""): string => v.padStart(2, "0");

/**
 * A typed date of birth as `YYYY-MM-DD`, or `undefined`.
 *
 * The prompt asks for DDMMYYYY, so bare digits are read that way. ISO order is
 * accepted only with separators and the four-digit year first, where it cannot
 * be misread.
 */
function typedBirthDate(entry: string): string | undefined {
  const s = entry.trim();
  const dmy =
    /^(\d{2})(\d{2})(\d{4})$/.exec(s) ?? /^(\d{1,2})[\s/.-]+(\d{1,2})[\s/.-]+(\d{4})$/.exec(s);
  if (dmy) return `${dmy[3]}-${pad2(dmy[2])}-${pad2(dmy[1])}`;
  const ymd = /^(\d{4})[\s/.-]+(\d{1,2})[\s/.-]+(\d{1,2})$/.exec(s);
  if (ymd) return `${ymd[1]}-${pad2(ymd[2])}-${pad2(ymd[3])}`;
  return undefined;
}

export function PatientVerify(props: PatientVerifyProps): ReactNode {
  const { identity, action, mode = "initials", onConfirm, onCancel, onFailure } = props;
  const { policy } = useIdentityPolicy();
  const [entry, setEntry] = useState("");
  const [state, setState] = useState<"idle" | "wrong" | "confirmed">("idle");

  const expected = useMemo(() => {
    // Day precision only. A partial date has no day to check, so it yields ""
    // and never confirms — "1985" typed against "1985" proves nothing.
    if (mode === "birth-date")
      return /^\d{4}-\d{2}-\d{2}/.exec(identity.birthDate?.value ?? "")?.[0] ?? "";
    return identityInitials(identity.name, policy.locale);
  }, [identity, mode, policy.locale]);

  // Birth-date mode with no full date on record can never pass. Offer no
  // field to retype into; say why and point at a check that can work.
  const noDateToCheck = mode === "birth-date" && expected === "";

  const submit = useCallback(() => {
    const given = entry
      .trim()
      .replace(/[\s/-]/g, "")
      .toUpperCase();
    if (!given) return;
    const matched =
      mode === "birth-date" ? typedBirthDate(entry) === expected : given === expected.toUpperCase();
    if (matched) {
      setState("confirmed");
      onConfirm();
      return;
    }
    setState("wrong");
    onFailure?.(given);
  }, [entry, expected, mode, onConfirm, onFailure]);

  const label =
    mode === "birth-date"
      ? "Type this patient's date of birth to continue"
      : "Type this patient's initials to continue";

  return (
    <div
      className={["zb-verify", VERIFY_STATE_CLASS[state]].join(" ")}
      role="alertdialog"
      aria-label={`Confirm the patient before ${action}`}
      data-zb-patient-id={identity.key}
    >
      <span className="zb-verify__rail" aria-hidden="true" />
      <div className="zb-verify__body">
        <p className="zb-verify__title">Confirm the patient before {action}</p>
        <p className="zb-verify__prompt">
          You are about to <strong>{action}</strong>.{" "}
          {noDateToCheck
            ? `${identity.birthDate ? "Date of birth has no day on record" : "Date of birth not recorded"}, so it cannot confirm this patient. Use initials or the wristband instead.`
            : `${label}.`}
        </p>
        <div className="zb-verify__row">
          <div className="zb-verify__who">
            <span className="zb-verify__name">{identity.name.text}</span>
            <span className="zb-verify__detail">
              {[
                identity.birthDate?.text,
                identity.identifiers[0] &&
                  `${identity.identifiers[0].label} ${identity.identifiers[0].text}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          {!noDateToCheck && (
            <>
              <label className="zb-verify__field">
                <span className="zb-visually-hidden">{label}</span>
                <input
                  className="zb-verify__input"
                  value={entry}
                  inputMode={mode === "birth-date" ? "numeric" : "text"}
                  autoComplete="off"
                  maxLength={mode === "birth-date" ? 10 : 4}
                  onChange={(e) => {
                    setEntry(e.target.value);
                    if (state === "wrong") setState("idle");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                  placeholder={mode === "birth-date" ? "DDMMYYYY" : "Initials"}
                />
              </label>
              <button type="button" className="zb-btn zb-btn--primary" onClick={submit}>
                Confirm
              </button>
            </>
          )}
          {onCancel && (
            <button type="button" className="zb-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
        <p className="zb-verify__result" role="status">
          {state === "wrong" &&
            `That does not match the patient on screen. Nothing has been ordered. Check the chart before retrying.`}
          {state === "confirmed" && `Confirmed for ${identity.name.text}.`}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wristband
// ---------------------------------------------------------------------------

export type WristbandVerdict =
  | { kind: "idle" }
  | { kind: "match"; identifier: string; assigner?: string | undefined }
  | { kind: "mismatch"; scanned: string }
  | { kind: "wrong-system"; scanned: string; scannedSystem: string; expectedSystem: string };

export interface ScannedIdentifier {
  value: string;
  /** The assigning system. A right number from the wrong authority is not a match. */
  system?: string;
}

/**
 * Compare a scanned wristband against the displayed patient.
 *
 * Pew found match rates fall to roughly 50% between organisations, which means
 * "the number matched" is not the same claim as "this is the same person"
 * unless the *system* matched too. A right-number-wrong-system scan is
 * therefore a **mismatch**, not a match with a warning — a warning beside a
 * green tick is read as a green tick.
 */
export function useWristbandMatch(identity: Identity | undefined): {
  verdict: WristbandVerdict;
  scan: (scanned: ScannedIdentifier) => WristbandVerdict;
  reset: () => void;
} {
  const [verdict, setVerdict] = useState<WristbandVerdict>({ kind: "idle" });

  const scan = useCallback(
    (scanned: ScannedIdentifier): WristbandVerdict => {
      const normalise = (v: string): string => v.replace(/[\s-]/g, "").toUpperCase();
      const value = normalise(scanned.value);

      if (!identity) {
        const out: WristbandVerdict = { kind: "mismatch", scanned: scanned.value };
        setVerdict(out);
        return out;
      }

      const hit = identity.identifiers.find((id) => normalise(id.raw) === value);
      if (!hit) {
        const out: WristbandVerdict = { kind: "mismatch", scanned: scanned.value };
        setVerdict(out);
        return out;
      }

      if (scanned.system && hit.system && scanned.system !== hit.system) {
        const out: WristbandVerdict = {
          kind: "wrong-system",
          scanned: scanned.value,
          scannedSystem: scanned.system,
          expectedSystem: hit.system,
        };
        setVerdict(out);
        return out;
      }

      const out: WristbandVerdict = { kind: "match", identifier: hit.text, assigner: hit.assigner };
      setVerdict(out);
      return out;
    },
    [identity],
  );

  const reset = useCallback(() => setVerdict({ kind: "idle" }), []);

  return { verdict, scan, reset };
}

/** Human-readable text for a verdict. Exported so applications can reuse it. */
export function wristbandMessage(verdict: WristbandVerdict): string {
  switch (verdict.kind) {
    case "idle":
      return "No wristband scanned.";
    case "match":
      return `Wristband ${verdict.identifier}${verdict.assigner ? ` (${verdict.assigner})` : ""} matches the displayed patient. Two identifiers verified.`;
    case "mismatch":
      return `Wristband ${verdict.scanned} belongs to a different patient. Stop. Do not proceed on this chart.`;
    case "wrong-system":
      return `Number ${verdict.scanned} matches — but it was issued by a different organisation. A right number from the wrong authority is not the same person.`;
    default: {
      const never: never = verdict;
      return never;
    }
  }
}
