import { policy, resolveIdentity } from "@zoblocks/identity-core";
import { renderHook, act } from "@testing-library/react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PatientVerify, useWristbandMatch, wristbandMessage } from "../src/Verify.js";
import * as F from "./fixtures.js";

const P = policy({ now: F.NOW });
const amara = resolveIdentity(F.amaraA, P);
const withNhs = resolveIdentity(F.withNhs, P);

describe("PatientVerify — the ID-reentry step", () => {
  it("names the consequence rather than asking whether the user is sure", async () => {
    F.renderWithPolicy(
      <PatientVerify identity={amara} action="ordering Clozapine 25 mg" onConfirm={() => {}} />,
    );
    // Named in the heading and again in the prompt — a clinician who skimmed
    // the title still meets it before the input.
    expect(screen.getAllByText(/ordering Clozapine 25 mg/).length).toBeGreaterThanOrEqual(2);
    // CONTENT.md §4: "are you sure?" asks the reader to re-derive the
    // consequence they were already unsure about.
    expect(document.body.textContent?.toLowerCase()).not.toContain("are you sure");
  });

  it("confirms on the right initials", async () => {
    const onConfirm = vi.fn();
    F.renderWithPolicy(<PatientVerify identity={amara} action="ordering" onConfirm={onConfirm} />);
    await userEvent.type(screen.getByRole("textbox"), "AO");
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Confirmed for Amara Chinelo Okonkwo");
  });

  it("refuses the wrong initials and says nothing was ordered", async () => {
    const onConfirm = vi.fn();
    const onFailure = vi.fn();
    F.renderWithPolicy(
      <PatientVerify
        identity={amara}
        action="ordering"
        onConfirm={onConfirm}
        onFailure={onFailure}
      />,
    );
    await userEvent.type(screen.getByRole("textbox"), "AL");
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledWith("AL");
    expect(screen.getByRole("status")).toHaveTextContent("Nothing has been ordered");
  });

  it("is case- and whitespace-insensitive, because a clinician is typing fast", async () => {
    const onConfirm = vi.fn();
    F.renderWithPolicy(<PatientVerify identity={amara} action="ordering" onConfirm={onConfirm} />);
    await userEvent.type(screen.getByRole("textbox"), " ao ");
    await userEvent.keyboard("{Enter}");
    expect(onConfirm).toHaveBeenCalled();
  });

  it("submits on Enter", async () => {
    const onConfirm = vi.fn();
    F.renderWithPolicy(<PatientVerify identity={amara} action="ordering" onConfirm={onConfirm} />);
    await userEvent.type(screen.getByRole("textbox"), "AO{Enter}");
    expect(onConfirm).toHaveBeenCalled();
  });

  it("does nothing on an empty submission", async () => {
    const onConfirm = vi.fn();
    const onFailure = vi.fn();
    F.renderWithPolicy(
      <PatientVerify
        identity={amara}
        action="ordering"
        onConfirm={onConfirm}
        onFailure={onFailure}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("clears the failure state as soon as the user types again", async () => {
    F.renderWithPolicy(<PatientVerify identity={amara} action="ordering" onConfirm={() => {}} />);
    await userEvent.type(screen.getByRole("textbox"), "XX");
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByRole("status")).toHaveTextContent("does not match");
    await userEvent.type(screen.getByRole("textbox"), "A");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("supports date-of-birth re-entry", async () => {
    const onConfirm = vi.fn();
    F.renderWithPolicy(
      <PatientVerify identity={amara} action="ordering" mode="birth-date" onConfirm={onConfirm} />,
    );
    await userEvent.type(screen.getByRole("textbox"), "1985-03-08");
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it.each(["08031985", "08/03/1985", "08-03-1985", "08.03.1985", "08 03 1985", "8/3/1985"])(
    "confirms a date of birth typed as prompted (%s)",
    async (typed) => {
      const onConfirm = vi.fn();
      F.renderWithPolicy(
        <PatientVerify
          identity={amara}
          action="ordering"
          mode="birth-date"
          onConfirm={onConfirm}
        />,
      );
      expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "DDMMYYYY");
      await userEvent.type(screen.getByRole("textbox"), typed);
      await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
      expect(onConfirm).toHaveBeenCalled();
    },
  );

  it.each(["19850308", "03081985", "08031986", "0803198"])(
    "refuses a date of birth that is not this patient's in DDMMYYYY (%s)",
    async (typed) => {
      const onConfirm = vi.fn();
      F.renderWithPolicy(
        <PatientVerify
          identity={amara}
          action="ordering"
          mode="birth-date"
          onConfirm={onConfirm}
        />,
      );
      await userEvent.type(screen.getByRole("textbox"), typed);
      await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
      expect(onConfirm).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["1985-03", "Mar 1985"],
    ["1985", "1985"],
  ])("offers no date-of-birth field when the record has no day (%s)", (birthDate, shown) => {
    // A field that can never match leaves staff retyping a correct answer.
    // Say why, and point at a check that can work.
    const partial = resolveIdentity(F.patient({ birthDate }), P);
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    F.renderWithPolicy(
      <PatientVerify
        identity={partial}
        action="ordering"
        mode="birth-date"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm" })).not.toBeInTheDocument();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent(shown);
    expect(dialog).toHaveTextContent("Date of birth has no day on record");
    expect(dialog).toHaveTextContent(/initials or the wristband/);
    screen.getByRole("button", { name: "Cancel" }).click();
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("offers no date-of-birth field when no date of birth is recorded", () => {
    const record = F.patient();
    delete record.birthDate;
    const none = resolveIdentity(record, P);
    F.renderWithPolicy(
      <PatientVerify identity={none} action="ordering" mode="birth-date" onConfirm={() => {}} />,
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Date of birth not recorded");
  });

  it("still offers the field for a date of birth recorded with a time", async () => {
    const onConfirm = vi.fn();
    const timed = resolveIdentity(F.patient({ birthDate: "1985-03-08T14:30:00Z" }), P);
    F.renderWithPolicy(
      <PatientVerify identity={timed} action="ordering" mode="birth-date" onConfirm={onConfirm} />,
    );
    await userEvent.type(screen.getByRole("textbox"), "08031985");
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("announces the result to assistive technology", () => {
    F.renderWithPolicy(<PatientVerify identity={amara} action="ordering" onConfirm={() => {}} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveAccessibleName(
      "Confirm the patient before ordering",
    );
  });

  it("shows the patient it is asking about", () => {
    F.renderWithPolicy(<PatientVerify identity={amara} action="ordering" onConfirm={() => {}} />);
    expect(screen.getByText("Amara Chinelo Okonkwo")).toBeInTheDocument();
    expect(screen.getByText(/08 Mar 1985/)).toBeInTheDocument();
  });

  it("labels the input for a screen reader", () => {
    F.renderWithPolicy(<PatientVerify identity={amara} action="ordering" onConfirm={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveAccessibleName(/initials/i);
  });
});

describe("useWristbandMatch", () => {
  it("matches the right band", () => {
    const { result } = renderHook(() => useWristbandMatch(amara));
    act(() => {
      result.current.scan({ value: "123456789" });
    });
    expect(result.current.verdict.kind).toBe("match");
  });

  it("tolerates the separators a scanner emits", () => {
    const { result } = renderHook(() => useWristbandMatch(amara));
    act(() => {
      result.current.scan({ value: "123-456-789" });
    });
    expect(result.current.verdict.kind).toBe("match");
  });

  it("rejects a different patient's band", () => {
    const { result } = renderHook(() => useWristbandMatch(amara));
    act(() => {
      result.current.scan({ value: "402118776" });
    });
    expect(result.current.verdict.kind).toBe("mismatch");
  });

  it("treats a right number from the wrong authority as a mismatch, not a warning", () => {
    // Pew found match rates fall to ~50% between organisations. "The number
    // matched" is not "this is the same person" unless the system matched too,
    // and a warning beside a green tick gets read as a green tick.
    const { result } = renderHook(() => useWristbandMatch(withNhs));
    act(() => {
      result.current.scan({ value: "123456789", system: "urn:oid:9.9.9.9" });
    });
    expect(result.current.verdict.kind).toBe("wrong-system");
    expect(wristbandMessage(result.current.verdict)).toContain("wrong authority");
  });

  it("matches when the system agrees", () => {
    const { result } = renderHook(() => useWristbandMatch(withNhs));
    act(() => {
      result.current.scan({ value: "9434765919", system: F.NHS });
    });
    expect(result.current.verdict.kind).toBe("match");
  });

  it("is a mismatch when there is no patient on screen", () => {
    const { result } = renderHook(() => useWristbandMatch(undefined));
    act(() => {
      result.current.scan({ value: "123456789" });
    });
    expect(result.current.verdict.kind).toBe("mismatch");
  });

  it("resets", () => {
    const { result } = renderHook(() => useWristbandMatch(amara));
    act(() => {
      result.current.scan({ value: "123456789" });
    });
    act(() => result.current.reset());
    expect(result.current.verdict.kind).toBe("idle");
  });

  it("returns the verdict synchronously as well as through state", () => {
    const { result } = renderHook(() => useWristbandMatch(amara));
    let returned: ReturnType<typeof result.current.scan> | undefined;
    act(() => {
      returned = result.current.scan({ value: "123456789" });
    });
    // A barcode handler usually needs the answer in the same tick.
    expect(returned?.kind).toBe("match");
  });
});

describe("wristbandMessage", () => {
  it("says stop, plainly, on a mismatch", () => {
    expect(wristbandMessage({ kind: "mismatch", scanned: "402118776" })).toContain("Stop");
    expect(wristbandMessage({ kind: "mismatch", scanned: "402118776" })).toContain(
      "Do not proceed on this chart",
    );
  });
  it("covers every verdict", () => {
    expect(wristbandMessage({ kind: "idle" })).toBeTruthy();
    expect(wristbandMessage({ kind: "match", identifier: "123 456 789" })).toContain(
      "Two identifiers verified",
    );
  });
});
