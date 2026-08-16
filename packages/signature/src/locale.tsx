"use client";

/**
 * Every string the component can show.
 *
 * Externalised in full rather than sprinkled through the components, for two
 * reasons. The obvious one is translation. The less obvious one is that antd's
 * own close button carries a hardcoded English `aria-label="Close"` that
 * bypasses its locale system entirely, so a component that wants to be
 * genuinely localisable has to own its accessible names rather than inherit
 * them.
 *
 * The wording follows CONTENT.md. Two rules do most of the work here:
 *
 *   - **Absence is stated, never punctuated.** "Not signed" and "Declined to
 *     sign" are different facts and are written as such; neither is ever a dash.
 *   - **A control says what will happen.** "Sign and continue", not "Done" —
 *     WCAG 3.3.4 asks a legal commitment to be confirmed rather than merely
 *     completed, and a button that names the commitment is what confirmation
 *     looks like.
 */

import * as React from "react";

export interface SignatureLocale {
  /* Pad */
  padLabel: string;
  drawHere: string;
  undo: string;
  redo: string;
  clear: string;
  announceCaptured: (strokes: number) => string;
  announceUndone: (strokes: number) => string;
  announceCleared: string;

  /* Methods */
  methodDraw: string;
  methodType: string;
  methodUpload: string;
  typeLabel: string;
  typeHelp: string;
  typePlaceholder: string;
  typeStyle: string;
  inkColour: string;
  ink: { black: string; blue: string };
  uploadPrompt: string;
  uploadHint: string;
  uploadWarning: string;

  /* Identity */
  fullName: string;
  signingAs: string;
  capacity: Record<string, string>;
  attestationTitle: string;

  /* Actions */
  sign: string;
  cancel: string;
  close: string;
  cantSign: string;
  back: string;

  /* Outcomes */
  outcomeTitle: string;
  outcomeSubtitle: string;
  outcomeDeclined: string;
  outcomeDeclinedHelp: string;
  outcomeUnable: string;
  outcomeUnableHelp: string;
  outcomeVerbal: string;
  outcomeVerbalHelp: string;
  outcomeOnPaper: string;
  outcomeOnPaperHelp: string;
  reason: string;
  witness: string;
  witnessRequired: string;
  recordOutcome: string;
  declineReassurance: string;

  /* Field + manifest */
  addSignature: string;
  notSigned: string;
  view: string;
  change: string;
  signedOn: string;
  meaning: Record<string, string>;
  manifestStatement: string;
  manifestMethod: string;
  manifestRecordedBy: string;
  manifestIntegrity: string;
  manifestGraphicalOnly: string;
  manifestGraphicalNote: string;
  statusDeclined: string;
  statusUnable: string;
  statusVerbal: string;
  statusOnPaper: string;
  statusPending: string;
  statusRevoked: string;
  tooLittleInk: string;
  required: string;
}

export const DEFAULT_LOCALE: SignatureLocale = {
  padLabel: "Signature",
  drawHere: "Draw your signature here",
  undo: "Undo last stroke",
  redo: "Redo stroke",
  clear: "Clear signature",
  announceCaptured: (n) => `Signature captured, ${n} ${n === 1 ? "stroke" : "strokes"}.`,
  announceUndone: (n) => (n === 0 ? "Signature cleared." : `Stroke removed, ${n} remaining.`),
  announceCleared: "Signature cleared.",

  methodDraw: "Draw",
  methodType: "Type",
  methodUpload: "Upload",
  typeLabel: "Type your name to sign",
  // The sentence that removes the hesitation pushing people back to the
  // inaccessible tab. It is also true: ESIGN defines a signature by intent,
  // not by technique.
  typeHelp: "Typing your name here has the same legal effect as signing by hand.",
  typePlaceholder: "Your full name",
  typeStyle: "Style",
  inkColour: "Ink",
  ink: { black: "Black", blue: "Blue" },
  uploadPrompt: "Click or drag an image of your signature here",
  uploadHint: "PNG or JPEG, up to 2 MB. Location data is removed automatically.",
  uploadWarning:
    "An uploaded image cannot be checked against the person signing. Your organisation may require a witness.",

  fullName: "Full name",
  signingAs: "Signing as",
  capacity: {
    self: "The patient",
    parent: "Parent or guardian",
    proxy: "Healthcare proxy",
    "legal-representative": "Legal representative",
    clinician: "Clinician",
    witness: "Witness",
    interpreter: "Interpreter",
  },
  attestationTitle: "What you are signing",

  sign: "Sign and continue",
  cancel: "Cancel",
  // Distinct from "Cancel" on purpose. antd's close affordance and the footer
  // button both dismiss the dialog, and giving them the same accessible name
  // means a screen-reader user hears "Cancel button" twice with no way to tell
  // which is which. Naming the consequence is also more useful than naming the
  // widget.
  close: "Close without signing",
  cantSign: "Can't sign?",
  back: "Back",

  outcomeTitle: "Record what happened instead",
  outcomeSubtitle: "This is recorded in the chart either way.",
  outcomeDeclined: "The patient declined to sign",
  outcomeDeclinedHelp: "They read it and chose not to agree.",
  outcomeUnable: "The patient is unable to sign",
  outcomeUnableHelp: "Physically or cognitively unable right now. A witness is required.",
  outcomeVerbal: "Consent was given verbally",
  outcomeVerbalHelp: "By phone or video. A witness is required.",
  outcomeOnPaper: "Signed on paper",
  outcomeOnPaperHelp: "A wet signature was taken and will be scanned.",
  reason: "Reason",
  witness: "Witness",
  witnessRequired: "A witness is required for this outcome.",
  recordOutcome: "Record",
  // A decline is a decision, not a dead end, and the interface should not make
  // the person recording it feel they have failed.
  declineReassurance:
    "A decline is not a dead end. The care team will see it on the chart and can revisit the conversation.",

  addSignature: "Add signature",
  notSigned: "Not signed",
  view: "View",
  change: "Change",
  signedOn: "Signed",
  meaning: {
    consent: "Consent — agreement to what is described",
    author: "Authorship — this entry is mine",
    coauthor: "Co-authorship",
    verification: "Verification — I have checked this",
    validation: "Validation",
    witness: "Witness — I observed the signing",
    interpreter: "Interpretation — I conveyed this in another language",
    review: "Review",
  },
  manifestStatement: "Statement signed",
  manifestMethod: "Method",
  manifestRecordedBy: "Recorded by",
  manifestIntegrity: "Integrity",
  manifestGraphicalOnly: "Graphical only",
  manifestGraphicalNote: "Image of a mark. Not a cryptographic signature.",
  statusDeclined: "Declined",
  statusUnable: "Unable to sign",
  statusVerbal: "Consented verbally",
  statusOnPaper: "Signed on paper",
  statusPending: "Awaiting countersignature",
  statusRevoked: "Consent withdrawn",
  tooLittleInk: "That is too small to be a signature. Please sign across the line.",
  required: "A signature is required before this form can be submitted.",
};

const LocaleContext = React.createContext<Partial<SignatureLocale> | undefined>(undefined);

/** Supply locale overrides to every Signature below this point. */
export function SignatureLocaleProvider({
  value,
  children,
}: {
  value: Partial<SignatureLocale>;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(overrides?: Partial<SignatureLocale>): SignatureLocale {
  const fromContext = React.useContext(LocaleContext);
  return React.useMemo(
    () => ({ ...DEFAULT_LOCALE, ...fromContext, ...overrides }),
    [fromContext, overrides],
  );
}
