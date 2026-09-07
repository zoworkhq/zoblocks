/**
 * SignatureBlock — the attestation a reader acts on.
 *
 * `SignatureManifest` is tested as a *record*: does it carry every field 21
 * CFR §11.50 requires. This component answers a different question, for a
 * reader who is not auditing anything — did the right person sign this — and
 * the assertions follow that: the lines that establish standing must be
 * present, and an unsigned document must be impossible to mistake for a signed
 * one.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignatureBlock, type SignatureValue } from "../src/index";

const NOW = "2026-08-16T14:36:02.000Z";

const INK = {
  strokes: [],
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><text y="40">A Rao</text></svg>',
  render: {
    viewBox: "0 0 200 60",
    paths: [],
    text: { value: "A Rao", x: 16, y: 40, fontSize: 44, fontFamily: "serif" },
  },
  bounds: { x: 0, y: 0, width: 200, height: 60 },
};

const SIGNED: SignatureValue = {
  outcome: "signed",
  method: "draw",
  ink: INK,
  signer: {
    name: "Dr Anita Rao",
    credential: "MBBS, MRCP",
    role: "Consultant Cardiologist",
    register: "GMC",
    identifier: "7412589",
  },
  capacity: "self",
  meaning: "author",
  recordedAt: NOW,
  provenance: { method: "draw" },
};

describe("what establishes that the right person signed", () => {
  it("prints the name and the qualification together", () => {
    render(<SignatureBlock value={SIGNED} />);
    expect(screen.getByText(/Dr Anita Rao/)).toBeInTheDocument();
    expect(screen.getByText(/MBBS, MRCP/)).toBeInTheDocument();
  });

  /**
   * The role is the line a reader actually uses.
   *
   * A foundation doctor and a consultant may both be "Dr A Rao"; a credential
   * is a qualification somebody keeps for life, and the role is what gave them
   * the standing to sign *this*. Without it the block says somebody signed and
   * not whether they were entitled to.
   */
  it("states the role held at the time of signing", () => {
    render(<SignatureBlock value={SIGNED} />);
    expect(screen.getByText("Consultant Cardiologist")).toBeInTheDocument();
  });

  /**
   * The register travels with the number, because a bare number is not a
   * credential — the reader cannot tell which body to check it against.
   * "7412589" identifies nobody; "GMC 7412589" is a lookup.
   */
  it("names the register beside the registration number", () => {
    render(<SignatureBlock value={SIGNED} />);
    expect(screen.getByText("GMC 7412589")).toBeInTheDocument();
  });

  it("states what the signature meant, which §11.50(a)(3) requires", () => {
    render(<SignatureBlock value={SIGNED} />);
    expect(screen.getByText(/Authorship/)).toBeInTheDocument();
  });

  it("leaves out lines it was not given, rather than printing empty labels", () => {
    render(<SignatureBlock value={{ ...SIGNED, signer: { name: "Dr Anita Rao" } }} />);
    expect(screen.queryByText("Consultant Cardiologist")).not.toBeInTheDocument();
    expect(screen.queryByText(/GMC/)).not.toBeInTheDocument();
  });

  /**
   * The ink's accessible name is whose signature it is and when — the
   * equivalent purpose under SC 1.1.1. A description of the strokes serves
   * nobody, and the strokes are not the information.
   */
  it("names the ink by whose it is and when", () => {
    render(<SignatureBlock value={SIGNED} />);
    expect(screen.getByRole("img", { name: /Dr Anita Rao/ })).toBeInTheDocument();
  });
});

describe("an unsigned document cannot be mistaken for a signed one", () => {
  const unsigned: readonly SignatureValue[] = [
    {
      outcome: "declined",
      reason: "Wants to discuss with her daughter first.",
      recordedAt: NOW,
      recordedBy: { name: "A. Okafor", credential: "RN" },
    },
    {
      outcome: "pending",
      recordedAt: NOW,
      recordedBy: { name: "A. Okafor", credential: "RN" },
    },
    {
      outcome: "revoked",
      revokedAt: NOW,
      reason: "Superseded.",
      recordedAt: NOW,
      recordedBy: { name: "A. Okafor", credential: "RN" },
    },
  ];

  for (const value of unsigned) {
    it(`says so plainly for "${value.outcome}"`, () => {
      const { container } = render(<SignatureBlock value={value} />);

      // The words, not a colour and not an absence.
      expect(screen.getByText(/Not signed/i)).toBeInTheDocument();

      /*
       * And it does not draw the shape of a signature. A decline rendered as a
       * rule with a name under it is how a reader skims a letter and comes
       * away believing it was signed — which is the failure this component
       * exists to prevent, not a styling preference.
       */
      expect(container.querySelector(".zb-signature-block__rule")).toBeNull();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  }

  it("carries the reason through, because the reason is the record", () => {
    render(<SignatureBlock value={unsigned[0]!} />);
    expect(screen.getByText(/discuss with her daughter/)).toBeInTheDocument();
  });
});

describe("integrity is shown only when it was checked", () => {
  /**
   * An absent check and a passing check are different facts.
   *
   * A block that shows a tick whenever nobody supplied a verdict is a block
   * that reassures the reader about something nobody measured.
   */
  it("says nothing when the host did not check", () => {
    const { container } = render(<SignatureBlock value={SIGNED} />);
    expect(container.querySelector(".zb-signature-block__integrity")).toBeNull();
  });

  it("marks and names both verdicts, so monochrome print still reads", () => {
    const pass = render(<SignatureBlock value={SIGNED} verified />);
    expect(pass.container.querySelector(".zb-signature-block__integrity")).not.toBeNull();
    pass.unmount();

    const fail = render(<SignatureBlock value={SIGNED} verified={false} />);
    expect(fail.container.querySelector(".zb-signature-block__integrity--failed")).not.toBeNull();
  });
});

describe("the document decides the organisation, not the signature", () => {
  it("renders the organisation the host supplies", () => {
    render(<SignatureBlock value={SIGNED} organisation="Cardiology · Northwind Health" />);
    expect(screen.getByText("Cardiology · Northwind Health")).toBeInTheDocument();
  });

  it("renders a caption above the rule", () => {
    render(<SignatureBlock value={SIGNED} caption="Discharging clinician" />);
    expect(screen.getByText("Discharging clinician")).toBeInTheDocument();
  });
});
