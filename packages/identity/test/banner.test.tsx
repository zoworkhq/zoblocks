import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PatientBanner } from "../src/PatientBanner.js";
import { __resetBannerRegistry } from "../src/PatientGuard.js";
import * as F from "./fixtures.js";

afterEach(() => __resetBannerRegistry());

const TWO = [{ kind: "mrn" }, { kind: "nhs" }] as const;

describe("PatientBanner — the basics", () => {
  it("renders one region whose accessible name is the whole person", () => {
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />);
    const region = screen.getByRole("region");
    // Not seven fragments. One name, in the order a human would say it.
    expect(region).toHaveAccessibleName(
      "Patient: Amara Chinelo Okonkwo, born 8 March 1985, age 41 y, M R N 123, 456, 789, St Aidan's. Active.",
    );
  });

  it("publishes which patient it is showing", () => {
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />);
    // E2E tests and audit tooling assert on this at the moment of an order.
    expect(screen.getByRole("region")).toHaveAttribute("data-ox-patient-id", "pat-4471");
  });

  it("renders the date of birth unambiguously", () => {
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />);
    expect(screen.getByText("08 Mar 1985")).toBeInTheDocument();
    expect(screen.queryByText("08/03/1985")).not.toBeInTheDocument();
  });

  it("says Active rather than saying nothing", () => {
    // An active patient and a patient whose status failed to load must not
    // look identical.
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("groups the identifier and names its issuer", () => {
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />);
    expect(screen.getByText("123 456 789")).toBeInTheDocument();
    expect(screen.getByText("St Aidan's")).toBeInTheDocument();
  });

  it("flags an identifier that fails its check digit", () => {
    F.renderWithPolicy(<PatientBanner patient={F.badCheckDigit} context="navigation" />);
    expect(screen.getByTitle("This identifier fails its check digit")).toBeInTheDocument();
  });
});

describe("PatientBanner — Patient.gender", () => {
  it("renders the sex parameter for clinical use, labelled", () => {
    F.renderWithPolicy(<PatientBanner patient={F.withSpcu} context="navigation" />);
    expect(screen.getByText("SPCU")).toBeInTheDocument();
    expect(screen.getByText("female-typical")).toBeInTheDocument();
  });

  it("never renders administrative gender", () => {
    // The fixture has gender: "male" and an SPCU of female-typical. A banner
    // that rendered a bare "M" would mislead a prescriber into the wrong
    // reference range.
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.withSpcu} context="navigation" />,
    );
    expect(container.textContent).not.toMatch(/\bmale\b/);
    expect(container.querySelector('[data-ox-field="gender"]')).toBeNull();
  });
});

describe("PatientBanner — identity is atomic", () => {
  it("renders a skeleton, never a half-identity", () => {
    const { container } = F.renderWithPolicy(<PatientBanner loading context="navigation" />);
    expect(container.querySelector(".ox-banner--loading")).toBeInTheDocument();
    expect(screen.getByText("Loading patient")).toBeInTheDocument();
    // A name with a placeholder identifier reads as a complete record.
    expect(container.textContent).not.toContain("Okonkwo");
    expect(container.textContent).not.toContain("—");
  });

  it("marks the loading state busy", () => {
    const { container } = F.renderWithPolicy(<PatientBanner loading context="navigation" />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("says plainly that nothing below is confirmed when the load failed", () => {
    F.renderWithPolicy(<PatientBanner error={new Error("network")} context="navigation" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not load the patient record");
    // CONTENT.md §5: name what failed, and say whether what is on screen is
    // complete.
    expect(alert).toHaveTextContent("Do not act on it");
    // And never leak the underlying error, which may carry PHI into a log.
    expect(alert).not.toHaveTextContent("network");
  });
});

describe("PatientBanner — four states, not one pill", () => {
  it("renders deceased with the date and a frozen age", () => {
    F.renderWithPolicy(<PatientBanner patient={F.deceased} context="navigation" />);
    expect(screen.getByText(/Deceased 12 Mar 2024/)).toBeInTheDocument();
    expect(screen.getByText("63 y at death")).toBeInTheDocument();
  });

  it("says what inactive means rather than leaving it as a word", () => {
    F.renderWithPolicy(<PatientBanner patient={F.inactive} context="navigation" />);
    expect(screen.getByText(/not receiving care from this service/)).toBeInTheDocument();
  });

  it("renders a merged record as merged, not as inactive", () => {
    F.renderWithPolicy(<PatientBanner patient={F.merged} context="navigation" />);
    expect(screen.getByText(/care is recorded elsewhere/)).toBeInTheDocument();
    expect(screen.queryByText(/Inactive/)).not.toBeInTheDocument();
  });

  it("makes a test patient unmistakable", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.testPatient} context="navigation" />,
    );
    expect(screen.getByText(/TEST PATIENT — not a person/)).toBeInTheDocument();
    expect(container.querySelector(".ox-banner--test")).toBeInTheDocument();
  });

  it("gives every state a word and an icon, never colour alone", () => {
    for (const p of [F.deceased, F.inactive, F.merged, F.testPatient, F.sensitive]) {
      const { container, unmount } = F.renderWithPolicy(
        <PatientBanner patient={p} context="navigation" />,
      );
      const tag = container.querySelector("[data-ox-state]");
      expect(tag).toBeTruthy();
      // A word survives forced-colors, monochrome printing, and the roughly
      // one in twelve men who cannot separate red from green.
      expect((tag?.textContent ?? "").replace(/[^\w]/g, "").length).toBeGreaterThan(3);
      unmount();
      __resetBannerRegistry();
    }
  });
});

describe("PatientBanner — sensitivity and disclosure", () => {
  it("withholds the programme and says it is doing so", () => {
    F.renderWithPolicy(<PatientBanner patient={F.sensitive} context="navigation" />);
    expect(screen.getByText(/Programme and care team withheld/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal" })).toBeInTheDocument();
  });

  it("fires the reveal callback and never logs anything itself", async () => {
    const onSensitiveReveal = vi.fn();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    F.renderWithPolicy(<PatientBanner patient={F.sensitive} context="navigation" />, {
      onSensitiveReveal,
    });
    screen.getByRole("button", { name: "Reveal" }).click();
    await waitFor(() => expect(onSensitiveReveal).toHaveBeenCalledTimes(1));
    expect(onSensitiveReveal.mock.calls[0]?.[0]).toMatchObject({
      patientId: "pat-7710",
      codes: expect.arrayContaining(["ETH", "PSY"]),
    });
    // The application owns the audit trail. A component that logged PHI from a
    // browser would violate ARCHITECTURE §9.
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("masks the identifier at reception", () => {
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />, {
      disclosure: "reception",
    });
    expect(screen.getByText("••••••789")).toBeInTheDocument();
    expect(screen.queryByText("123 456 789")).not.toBeInTheDocument();
  });

  it("leaks nothing sensitive into the rendered HTML at reception level", () => {
    // Asserted on the string, because that is what ends up in a screenshot and
    // in a DOM snapshot sent to an error reporter.
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.sensitive} context="navigation" />,
      { disclosure: "reception" },
    );
    const html = container.innerHTML;
    expect(html).not.toContain("123456789");
    expect(html).not.toContain(">ETH<");
  });

  it("does not withhold at full disclosure", () => {
    F.renderWithPolicy(<PatientBanner patient={F.sensitive} context="navigation" />, {
      disclosure: "full",
    });
    expect(screen.queryByRole("button", { name: "Reveal" })).not.toBeInTheDocument();
  });
});

describe("PatientBanner — fields", () => {
  it("reports which fields it rendered", () => {
    F.renderWithPolicy(
      <PatientBanner
        patient={F.amaraA}
        context="navigation"
        fields={["name", "dob", "identifier"]}
      />,
    );
    expect(screen.getByRole("region")).toHaveAttribute("data-ox-fields", "name,dob,identifier");
  });

  it("omits a field the caller did not ask for", () => {
    F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" fields={["name", "dob"]} />,
    );
    expect(screen.queryByText("123 456 789")).not.toBeInTheDocument();
  });

  it("tags every field with a drop class so the container query can act", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.withNhs} context="navigation" ward="4B / bay 2" />,
    );
    // The ward is the first thing to go; the identifier is the last.
    expect(container.querySelector('[data-ox-field="ward"]')?.className).toContain("ox-drop-4");
    expect(container.querySelector('[data-ox-field="identifier"]')?.className).toContain(
      "ox-drop-1",
    );
  });

  it("never applies a truncation class to a name or an identifier", () => {
    // A truncated MRN is not a shorter MRN, it is a different number.
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    for (const sel of [".ox-banner__name", '[data-ox-field="identifier"]']) {
      const el = container.querySelector(sel) as HTMLElement | null;
      expect(el?.className ?? "").not.toMatch(/truncate|ellipsis/);
    }
  });

  it("renders both identifiers when the caller asks for two", () => {
    F.renderWithPolicy(<PatientBanner patient={F.withNhs} context="action" identifiers={TWO} />);
    const region = screen.getByRole("region");
    expect(within(region).getByText("123 456 789")).toBeInTheDocument();
    expect(within(region).getByText("943 476 5919")).toBeInTheDocument();
  });
});

describe("PatientBanner — the patient changed and nobody said so", () => {
  it("stays silent on first render", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    // Announcing a page load the user already knows about is noise.
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("");
  });

  it("announces politely when the displayed patient changes", async () => {
    const { container, rerender } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    rerender(<PatientBanner patient={F.devraj} context="navigation" />);
    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain(
        "Now viewing Devraj Anand Iyer",
      ),
    );
    // Polite, not assertive: it must not interrupt a value being read.
    expect(container.querySelector('[aria-live="assertive"]')).toBeNull();
  });

  it("carries no identifier into the announcement", async () => {
    const { container, rerender } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    rerender(<PatientBanner patient={F.devraj} context="navigation" />);
    await waitFor(() => {
      const live = container.querySelector('[aria-live="polite"]')?.textContent ?? "";
      expect(live).toContain("Devraj");
      // A live region is announced out loud, possibly in a shared space.
      expect(live).not.toContain("771");
    });
  });
});
