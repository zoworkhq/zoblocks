import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IdentitySet, IdentitySetNotice } from "../src/IdentitySet.js";
import { PatientChip } from "../src/PatientChip.js";
import * as F from "./fixtures.js";

function rows(patients: ReturnType<typeof F.patient>[], onDisambiguate?: () => void) {
  return F.renderWithPolicy(
    <IdentitySet {...(onDisambiguate ? { onDisambiguate } : {})}>
      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            <PatientChip patient={p} />
          </li>
        ))}
      </ul>
      <IdentitySetNotice />
    </IdentitySet>,
  );
}

describe("PatientChip — on its own", () => {
  it("shows the compact form when there is nothing to be confused with", () => {
    F.renderWithPolicy(<PatientChip patient={F.amaraA} />);
    expect(screen.getByText("A. Okonkwo")).toBeInTheDocument();
  });

  it("carries the whole person in one accessible string", () => {
    const { container } = F.renderWithPolicy(<PatientChip patient={F.amaraA} />);
    expect(container.querySelector(".ox-visually-hidden")?.textContent).toContain(
      "Patient: Amara Chinelo Okonkwo",
    );
  });

  it("publishes which patient it references", () => {
    const { container } = F.renderWithPolicy(<PatientChip patient={F.amaraA} />);
    expect(container.querySelector("[data-ox-patient-id]")).toHaveAttribute(
      "data-ox-patient-id",
      "pat-4471",
    );
  });

  it("renders a skeleton rather than a partial identity", () => {
    const { container } = F.renderWithPolicy(<PatientChip />);
    expect(container.querySelector(".ox-patient-chip--loading")).toBeInTheDocument();
    expect(screen.getByText("Loading patient")).toBeInTheDocument();
  });

  it("fills the inline axis on request, for worklists", () => {
    const { container } = F.renderWithPolicy(<PatientChip patient={F.amaraA} block />);
    expect(container.querySelector(".ox-patient-chip--block")).toBeInTheDocument();
  });

  it("keeps the block modifier while loading, so a list does not reflow", () => {
    // The skeleton is the widest a row ever is in a real list. If it hugs its
    // content and the loaded row fills the axis, every row jumps sideways the
    // moment the data lands.
    const { container } = F.renderWithPolicy(<PatientChip block />);
    const chip = container.querySelector(".ox-patient-chip--loading");
    expect(chip).toHaveClass("ox-patient-chip--block");
  });

  it("stays out of the accordion's badge namespace", () => {
    // `.ox-chip` belongs to Accordion's severity badge. A chip that renders it
    // inherits a border, a background and text padding on a box that has to
    // hold an avatar. See test/css-namespace.test.ts.
    const { container } = F.renderWithPolicy(<PatientChip patient={F.amaraA} />);
    expect(container.querySelector(".ox-chip")).toBeNull();
    expect(container.querySelector(".ox-patient-chip")).toBeInTheDocument();
  });

  it("keeps a mononym whole", () => {
    F.renderWithPolicy(
      <PatientChip
        patient={F.patient({ id: "m", name: [{ use: "official", given: ["Suryanto"] }] })}
      />,
    );
    expect(screen.getByText("Suryanto")).toBeInTheDocument();
  });

  it("shows the chosen name, not the legal one", () => {
    F.renderWithPolicy(<PatientChip patient={F.chosenName} />);
    expect(screen.getByText("R. Ferreira")).toBeInTheDocument();
    const { container } = F.renderWithPolicy(<PatientChip patient={F.chosenName} />);
    expect(container.textContent).not.toContain("Robert James");
  });

  it("can hide the avatar for a dense table", () => {
    const { container } = F.renderWithPolicy(<PatientChip patient={F.amaraA} hideAvatar />);
    expect(container.querySelector(".ox-avatar")).toBeNull();
  });

  it("stays within the DOM node budget", () => {
    // Avatar + wrapper + text wrapper + name = 4. The performance budget in the
    // brief is "no more than 4 nodes per chip".
    const { container } = F.renderWithPolicy(<PatientChip patient={F.amaraA} />);
    const chip = container.querySelector(".ox-patient-chip") as HTMLElement;
    const visible = [...chip.querySelectorAll("*")].filter(
      (el) => !el.classList.contains("ox-visually-hidden"),
    );
    expect(visible.length).toBeLessThanOrEqual(4);
  });
});

describe("PatientChip — inside an IdentitySet", () => {
  it("leaves a list with no collisions untouched", async () => {
    rows([F.ada, F.devraj]);
    await waitFor(() => {
      expect(screen.getByText("A. Lovelace")).toBeInTheDocument();
      expect(screen.getByText("D. Iyer")).toBeInTheDocument();
    });
  });

  it("expands the given name when two people share a surname", async () => {
    rows([F.amaraA, F.amaraB]);
    await waitFor(() => {
      expect(screen.getByText("Amara Chinelo Okonkwo")).toBeInTheDocument();
      expect(screen.getByText("Amara Nkechi Okonkwo")).toBeInTheDocument();
    });
    // Both are now distinguishable without reading anything else.
    expect(screen.queryByText("A. Okonkwo")).not.toBeInTheDocument();
  });

  it("adds the identifier for twins who share a surname and a date of birth", async () => {
    rows([F.twinA, F.twinB]);
    await waitFor(() => {
      expect(screen.getByText(/MRN 880 112 003/)).toBeInTheDocument();
      expect(screen.getByText(/MRN 880 112 004/)).toBeInTheDocument();
    });
  });

  it("does not escalate a row that has nothing to be confused with", async () => {
    const { container } = rows([F.amaraA, F.amaraB, F.ada]);
    await waitFor(() => expect(screen.getByText("Amara Chinelo Okonkwo")).toBeInTheDocument());
    // Ada may share a swatch, which escalates quietly; what must not happen is
    // her row being marked as a name collision.
    const adaRow = [...container.querySelectorAll(".ox-patient-chip")].find((c) =>
      c.textContent?.includes("Lovelace"),
    );
    expect(adaRow?.getAttribute("data-ox-escalated")).toBeNull();
  });

  it("raises a list-level notice that names the count and the action", async () => {
    rows([F.amaraA, F.amaraB, F.ada]);
    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent(/patients on this list have a similar name/);
    expect(notice).toHaveTextContent(/Confirm date of birth before acting/);
    // CONTENT.md §4: never "are you sure?".
    expect(notice.textContent?.toLowerCase()).not.toContain("are you sure");
  });

  it("raises no notice for a clean list", async () => {
    rows([F.ada, F.devraj]);
    await waitFor(() => expect(screen.getByText("A. Lovelace")).toBeInTheDocument());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("tells the application what it found", async () => {
    const onDisambiguate = vi.fn();
    rows([F.amaraA, F.amaraB], onDisambiguate);
    await waitFor(() => {
      const last = onDisambiguate.mock.calls.at(-1)?.[0];
      expect(last?.escalated).toBe(2);
    });
  });

  it("deregisters a row when it unmounts", async () => {
    const onDisambiguate = vi.fn();
    const { rerender } = F.renderWithPolicy(
      <IdentitySet onDisambiguate={onDisambiguate}>
        <PatientChip patient={F.amaraA} />
        <PatientChip patient={F.amaraB} />
      </IdentitySet>,
    );
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].escalated).toBe(2));

    rerender(
      <IdentitySet onDisambiguate={onDisambiguate}>
        <PatientChip patient={F.amaraA} />
      </IdentitySet>,
    );
    // The collision is gone because the other row left the screen — which is
    // the right scope: the question is what a reader can confuse *now*.
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].escalated).toBe(0));
  });

  it("settles rather than re-rendering forever", async () => {
    const onDisambiguate = vi.fn();
    rows([F.amaraA, F.amaraB, F.ada, F.devraj, F.twinA, F.twinB], onDisambiguate);
    await waitFor(() => expect(onDisambiguate.mock.calls.length).toBeGreaterThan(0));

    // Poll until the count stops moving, rather than sampling after a fixed
    // window: on a slow CI runner a fixed wait can land mid-flight and fail for
    // reasons that have nothing to do with convergence.
    const countAfterQuietPeriod = async (): Promise<number> => {
      for (let i = 0; i < 100; i++) {
        const before = onDisambiguate.mock.calls.length;
        await new Promise((r) => setTimeout(r, 20));
        if (onDisambiguate.mock.calls.length === before) return before;
      }
      throw new Error("IdentitySet never stopped re-rendering");
    };

    // Identity objects are memoised by the resolution cache, so registration is
    // reference-stable and the set converges to a fixed point.
    const settled = await countAfterQuietPeriod();
    await new Promise((r) => setTimeout(r, 50));
    expect(onDisambiguate.mock.calls.length).toBe(settled);
  });

  it("announces the escalation to a screen reader too", async () => {
    const { container } = rows([F.amaraA, F.amaraB]);
    await waitFor(() => {
      const hidden = [...container.querySelectorAll(".ox-visually-hidden")]
        .map((n) => n.textContent)
        .join(" ");
      expect(hidden).toContain("Similar name on this list");
    });
  });
});

describe("PatientChip — states", () => {
  it("shows the visible state tag only when asked", () => {
    const plain = F.renderWithPolicy(<PatientChip patient={F.deceased} />);
    expect(plain.container.querySelector("[data-ox-state]")).toBeNull();
    const withStates = F.renderWithPolicy(<PatientChip patient={F.deceased} showStates />);
    expect(withStates.container.querySelector('[data-ox-state="deceased"]')).toBeInTheDocument();
  });

  it("always names the state in the accessible label, even when the tag is hidden", () => {
    // A screen-reader user must not be the only person on the team who does not
    // know the patient has died. `showStates` is a density control, not a
    // disclosure one.
    const { container } = F.renderWithPolicy(<PatientChip patient={F.deceased} />);
    expect(container.querySelector(".ox-visually-hidden")?.textContent).toContain("Deceased");
  });
});

describe("IdentitySet — enabled", () => {
  it("escalates by default", () => {
    const { container } = rows([F.amaraA, F.amaraB]);
    expect(container.querySelectorAll(".ox-patient-chip--escalated")).toHaveLength(2);
  });

  it("escalates nothing when the pass is turned off", () => {
    const { container } = F.renderWithPolicy(
      <IdentitySet enabled={false}>
        <ul>
          {[F.amaraA, F.amaraB].map((p) => (
            <li key={p.id}>
              <PatientChip patient={p} />
            </li>
          ))}
        </ul>
        <IdentitySetNotice />
      </IdentitySet>,
    );
    expect(container.querySelector(".ox-patient-chip--escalated")).toBeNull();
    expect(container.querySelectorAll(".ox-patient-chip")).toHaveLength(2);
  });

  it("keeps the same DOM nodes when the pass is toggled", async () => {
    /*
     * The reason `enabled` exists rather than callers wrapping the list in a
     * ternary. Swapping `<IdentitySet>` for a bare list unmounts every row, so
     * the browser has no before-state to transition from and the escalation
     * appears to snap into place — on the one component whose whole purpose is
     * to make a reader slow down and look again.
     *
     * Node identity is the assertion because it is what the browser uses: same
     * element, so `transition` runs; new element, so it cannot.
     */
    const { container, rerender } = F.renderWithPolicy(
      <IdentitySet enabled>
        <ul>
          {[F.amaraA, F.amaraB].map((p) => (
            <li key={p.id}>
              <PatientChip patient={p} />
            </li>
          ))}
        </ul>
      </IdentitySet>,
    );

    const before = container.querySelector(".ox-patient-chip");
    expect(before).toHaveClass("ox-patient-chip--escalated");

    rerender(
      <IdentitySet enabled={false}>
        <ul>
          {[F.amaraA, F.amaraB].map((p) => (
            <li key={p.id}>
              <PatientChip patient={p} />
            </li>
          ))}
        </ul>
      </IdentitySet>,
    );

    await waitFor(() => {
      const after = container.querySelector(".ox-patient-chip");
      expect(after).toBe(before);
      expect(after).not.toHaveClass("ox-patient-chip--escalated");
    });
  });

  it("suppresses the list notice too, not just the rows", () => {
    const { container } = F.renderWithPolicy(
      <IdentitySet enabled={false}>
        <ul>
          {[F.amaraA, F.amaraB].map((p) => (
            <li key={p.id}>
              <PatientChip patient={p} />
            </li>
          ))}
        </ul>
        <IdentitySetNotice />
      </IdentitySet>,
    );
    expect(container.querySelector(".ox-identity-notice")).toBeNull();
  });
});
