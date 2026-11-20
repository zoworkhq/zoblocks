import type { ReactNode } from "react";
import {
  renderTypedSignature,
  type SignatureValue,
  type SignedValue,
  type Signer,
} from "@zoblocks/signature";

export const NOW = "2026-11-05T12:00:00.000Z";
export const RECORDED_AT = "2026-11-05T11:45:00.000Z";
export const REVOKED_AT = "2026-11-05T11:55:00.000Z";
export const SUBJECT = { display: "Randall Josh", reference: "Patient/4471902" };
export const ATTESTATION =
  "I have read the information about this procedure, I have had the chance to ask questions, and I agree to go ahead.";
export const RECORDER: Signer = { name: "A. Okafor", credential: "RN" };

export const patientSignature: SignedValue = {
  outcome: "signed",
  method: "type",
  ink: renderTypedSignature("Josh Randall"),
  signer: { name: "Josh Randall" },
  capacity: "self",
  meaning: "consent",
  attestation: ATTESTATION,
  recordedAt: RECORDED_AT,
  recordedBy: RECORDER,
  provenance: { method: "type" },
};

export function outcomeLabel(value: SignatureValue): string {
  switch (value.outcome) {
    case "signed":
      return "signed";
    case "declined":
      return "declined";
    case "unable":
      return "unable";
    case "verbal":
      return "verbal";
    case "on-paper":
      return "on-paper";
    case "pending":
      return "pending";
    case "revoked":
      return "revoked";
  }
}

/** Lays an example out in a column. The page around it supplies the frame and the heading. */
export function Example({ children }: { children: ReactNode }) {
  return <div className="grid w-full gap-4">{children}</div>;
}
