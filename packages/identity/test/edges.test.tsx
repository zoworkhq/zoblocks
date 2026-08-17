/**
 * The rendering paths the feature suites do not reach.
 *
 * Mostly the ones a real application hits on a bad day: a chip dropped in with
 * no provider, a photograph that 404s, a set whose membership churns, a
 * disclosure level nobody set. The exhaustiveness `default` branches are here
 * too — they are unreachable today, and the test's job is to prove that adding
 * a case without handling it would be caught.
 */

import {
  policy,
  resolveIdentity,
  type Identity,
  type IdentityState,
} from "@oxygenui-design/identity-core";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IdentityAvatar } from "../src/IdentityAvatar.js";
import { IdentitySet, IdentitySetNotice } from "../src/IdentitySet.js";
import { PatientBanner } from "../src/PatientBanner.js";
import { PatientChip } from "../src/PatientChip.js";
import { __resetBannerRegistry } from "../src/PatientGuard.js";
import { StateTags, describeState, railTone } from "../src/states.js";
import { wristbandMessage } from "../src/Verify.js";
import * as F from "./fixtures.js";

afterEach(() => __resetBannerRegistry());

const P = policy({ now: F.NOW });
const amara = resolveIdentity(F.amaraA, P);

describe("no provider at all", () => {
  it("renders a chip with a sensible default policy", () => {
    // A Storybook story, or a test that did not wrap the tree. It should render
    // rather than explode, and it should deny photographs while doing so.
    render(<PatientChip patient={F.amaraA} />);
    expect(screen.getByText("A. Okonkwo")).toBeInTheDocument();
  });

  it("renders a banner with a sensible default policy", () => {
    render(<PatientBanner patient={F.amaraA} context="navigation" />);
    expect(screen.getByRole("region")).toHaveAccessibleName(/Amara Chinelo Okonkwo/);
  });

  it("denies photographs by default, with no provider to say otherwise", () => {
    const { container } = render(<PatientBanner patient={F.withPhoto} context="navigation" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[data-ox-photo="withheld"]')).toBeInTheDocument();
  });
});

describe("IdentityAvatar — the remaining shapes", () => {
  it("wraps a swatch index that exceeds the palette rather than rendering untinted", () => {
    // A caller-supplied `swatchCount` above six would otherwise produce a class
    // that does not exist, and an untinted circle looks like a loading state.
    const wide = resolveIdentity(F.amaraA, policy({ now: F.NOW, swatchCount: 24 }));
    const { container } = render(<IdentityAvatar identity={{ ...wide, swatch: 19 }} />);
    expect((container.firstElementChild as HTMLElement).className).toMatch(/ox-avatar--sw[1-6]\b/);
  });

  it("accepts every documented size", () => {
    for (const size of [20, 24, 32, 40, 56, "auto"] as const) {
      const { container, unmount } = render(<IdentityAvatar identity={amara} size={size} />);
      const cls = (container.firstElementChild as HTMLElement).className;
      expect(cls).toContain(size === "auto" ? "ox-avatar--auto" : `ox-avatar--${size}`);
      unmount();
    }
  });

  it("merges a caller className without dropping its own", () => {
    const { container } = render(<IdentityAvatar identity={amara} className="mine" />);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain("mine");
    expect(cls).toContain("ox-avatar");
  });

  it("carries a caller style through", () => {
    const { container } = render(
      <IdentityAvatar identity={amara} style={{ marginInlineStart: "4px" }} />,
    );
    expect((container.firstElementChild as HTMLElement).style.marginInlineStart).toBe("4px");
  });
});

describe("PatientBanner — the remaining paths", () => {
  it("degrades to the unavailable state when the photograph fails to load", async () => {
    // The distinction the whole five-state design exists for: a photo that
    // exists and did not arrive is not a record with no photo.
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.withPhoto} context="navigation" />,
      { photos: "allow" },
    );
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    img?.dispatchEvent(new Event("error"));
    await waitFor(() =>
      expect(container.querySelector('[data-ox-photo="unavailable"]')).toBeInTheDocument(),
    );
  });

  it("renders the ward when the caller supplies one", () => {
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" ward="4B / bay 2" />);
    expect(screen.getByText("4B / bay 2")).toBeInTheDocument();
  });

  it("omits the ward field when the caller supplies none", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    expect(container.querySelector('[data-ox-field="ward"]')).toBeNull();
  });

  it("renders caller actions", () => {
    F.renderWithPolicy(
      <PatientBanner
        patient={F.amaraA}
        context="navigation"
        actions={<button type="button">Switch patient</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Switch patient" })).toBeInTheDocument();
  });

  it("fires the caller's onReveal alongside the provider callback", () => {
    const onReveal = vi.fn();
    const onSensitiveReveal = vi.fn();
    F.renderWithPolicy(
      <PatientBanner patient={F.sensitive} context="navigation" onReveal={onReveal} />,
      { onSensitiveReveal },
    );
    screen.getByRole("button", { name: "Reveal" }).click();
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(onSensitiveReveal).toHaveBeenCalledTimes(1);
  });

  it("names the sensitivity categories only after the glass is broken", async () => {
    F.renderWithPolicy(<PatientBanner patient={F.sensitive} context="navigation" />);
    // Before: the reader knows the record is sensitive, not what kind.
    expect(screen.getByText(/This record carries sensitivity labels/)).toBeInTheDocument();
    expect(screen.queryByText(/Substance use/)).not.toBeInTheDocument();

    screen.getByRole("button", { name: "Reveal" }).click();

    await waitFor(() =>
      expect(screen.getByText(/Sensitivity: Substance use, Psychiatry/)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: "Reveal" })).not.toBeInTheDocument();
  });

  it("names the categories outright at full disclosure, with nothing to reveal", () => {
    F.renderWithPolicy(<PatientBanner patient={F.sensitive} context="navigation" />, {
      disclosure: "full",
    });
    expect(screen.getByText(/Substance use/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reveal" })).not.toBeInTheDocument();
  });

  it("renders gender identity and recorded sex when asked, each labelled", () => {
    const p = F.patient({
      id: "pat-gi",
      extension: [
        {
          url: "http://hl7.org/fhir/StructureDefinition/individual-genderIdentity",
          extension: [
            {
              url: "value",
              valueCodeableConcept: { coding: [{ code: "nb", display: "Non-binary" }] },
            },
          ],
        },
        {
          url: "http://hl7.org/fhir/StructureDefinition/individual-recordedSexOrGender",
          extension: [
            { url: "value", valueCodeableConcept: { coding: [{ code: "F", display: "Female" }] } },
          ],
        },
      ],
    });
    F.renderWithPolicy(
      <PatientBanner
        patient={p}
        context="navigation"
        fields={["name", "gender-identity", "recorded-sex-or-gender"]}
      />,
    );
    expect(screen.getByText("Gender identity")).toBeInTheDocument();
    expect(screen.getByText("Non-binary")).toBeInTheDocument();
    expect(screen.getByText("Recorded sex")).toBeInTheDocument();
  });

  it("keeps the caller className", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" className="mine" />,
    );
    expect(container.querySelector(".ox-banner.mine")).toBeInTheDocument();
  });

  it("falls back to the record's own identifiers when the requested kinds are absent", () => {
    // A caller asked for an NHS number the record does not carry. Rendering
    // nothing would silently drop the second identifier `context="action"`
    // exists to guarantee.
    F.renderWithPolicy(
      <PatientBanner
        patient={F.amaraA}
        context="action"
        identifiers={[{ kind: "nhs" }, { kind: "abha" }]}
      />,
    );
    expect(screen.getByText("123 456 789")).toBeInTheDocument();
  });
});

describe("PatientChip — the remaining paths", () => {
  it("accepts a pre-resolved identity without a patient", () => {
    F.renderWithPolicy(<PatientChip identity={amara} />);
    expect(screen.getByText("A. Okonkwo")).toBeInTheDocument();
  });

  it("keeps the caller className", () => {
    const { container } = F.renderWithPolicy(<PatientChip patient={F.amaraA} className="mine" />);
    expect(container.querySelector(".ox-chip.mine")).toBeInTheDocument();
  });

  it("keeps the caller className on the loading skeleton too", () => {
    const { container } = F.renderWithPolicy(<PatientChip className="mine" />);
    expect(container.querySelector(".ox-chip--loading.mine")).toBeInTheDocument();
  });

  it("renders a mononym without an initial-and-dot", () => {
    const p = F.patient({ id: "mono", name: [{ use: "official", given: ["Suryanto"] }] });
    F.renderWithPolicy(<PatientChip patient={p} />);
    expect(screen.getByText("Suryanto")).toBeInTheDocument();
  });

  it("renders a family-name-only record", () => {
    const p = F.patient({ id: "fam", name: [{ use: "official", family: "Okonkwo" }] });
    F.renderWithPolicy(<PatientChip patient={p} />);
    expect(screen.getByText("Okonkwo")).toBeInTheDocument();
  });
});

describe("IdentitySet — churn and idempotence", () => {
  it("re-registering an unchanged identity does not disturb the plan", async () => {
    const onDisambiguate = vi.fn();
    const { rerender } = F.renderWithPolicy(
      <IdentitySet onDisambiguate={onDisambiguate}>
        <PatientChip patient={F.amaraA} />
        <PatientChip patient={F.amaraB} />
      </IdentitySet>,
    );
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].escalated).toBe(2));
    const before = onDisambiguate.mock.calls.length;

    // Same patients, same objects — the resolution cache returns the same
    // Identity, so nothing should change.
    rerender(
      <IdentitySet onDisambiguate={onDisambiguate}>
        <PatientChip patient={F.amaraA} />
        <PatientChip patient={F.amaraB} />
      </IdentitySet>,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(onDisambiguate.mock.calls.length).toBe(before);
  });

  it("removes a member when its chip unmounts", async () => {
    // The deregister path. A ward list is not static — patients are discharged,
    // filters change — and a set that kept ghosts would keep escalating a
    // confusability that no longer exists on screen.
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

    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].total).toBe(1));
    expect(onDisambiguate.mock.calls.at(-1)?.[0].escalated).toBe(0);
  });

  it("survives every member unmounting", async () => {
    const onDisambiguate = vi.fn();
    const { rerender } = F.renderWithPolicy(
      <IdentitySet onDisambiguate={onDisambiguate}>
        <PatientChip patient={F.amaraA} />
        <PatientChip patient={F.amaraB} />
      </IdentitySet>,
    );
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].total).toBe(2));

    rerender(<IdentitySet onDisambiguate={onDisambiguate}>{null}</IdentitySet>);
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].total).toBe(0));
  });

  it("renders no notice outside a set", () => {
    const { container } = F.renderWithPolicy(<IdentitySetNotice />);
    expect(container.querySelector(".ox-identity-notice")).toBeNull();
  });

  it("renders no notice when the only collision is a shared swatch", async () => {
    // Two people sharing one of six colours is expected. A notice that fires on
    // it is a notice nobody reads.
    const { container } = F.renderWithPolicy(
      <IdentitySet>
        <PatientChip patient={F.ada} />
        <PatientChip patient={F.devraj} />
        <IdentitySetNotice />
      </IdentitySet>,
    );
    await waitFor(() => expect(screen.getByText("A. Lovelace")).toBeInTheDocument());
    expect(container.querySelector(".ox-identity-notice")).toBeNull();
  });
});

describe("the last reachable branches", () => {
  it("forces the photograph on a chip when the ladder asks for it", async () => {
    // Two records with the same name, the same date of birth and no identifier
    // to tell them apart: the ladder reaches its final rung and asks for the
    // photograph, which the chip has to honour.
    const twin = (id: string) =>
      F.patient({
        id,
        name: [{ use: "official", given: ["Baby"], family: "Ferreira" }],
        birthDate: "2026-08-15",
        identifier: [],
      });
    const { container } = F.renderWithPolicy(
      <IdentitySet>
        <PatientChip patient={twin("z1")} />
        <PatientChip patient={twin("z2")} />
      </IdentitySet>,
    );
    await waitFor(() => expect(container.querySelectorAll("[data-ox-escalated]").length).toBe(2));
    // The policy still denies photographs, so what it renders is the honest
    // "none on file" — a request, never an override of site policy.
    expect(container.querySelectorAll('[data-ox-photo="none-on-file"]').length).toBe(2);
  });

  it("renders a cancel button on the verification only when the caller wants one", async () => {
    const { PatientVerify } = await import("../src/Verify.js");
    const onCancel = vi.fn();
    const { rerender } = F.renderWithPolicy(
      <PatientVerify identity={amara} action="ordering" onConfirm={() => {}} />,
    );
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    rerender(
      <PatientVerify identity={amara} action="ordering" onConfirm={() => {}} onCancel={onCancel} />,
    );
    screen.getByRole("button", { name: "Cancel" }).click();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("tolerates a set whose members unmount twice", async () => {
    const onDisambiguate = vi.fn();
    const { rerender } = F.renderWithPolicy(
      <IdentitySet onDisambiguate={onDisambiguate}>
        <PatientChip patient={F.amaraA} />
        <PatientChip patient={F.amaraB} />
      </IdentitySet>,
    );
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].escalated).toBe(2));
    rerender(<IdentitySet onDisambiguate={onDisambiguate}>{null}</IdentitySet>);
    rerender(<IdentitySet onDisambiguate={onDisambiguate}>{null}</IdentitySet>);
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].total).toBe(0));
  });
});

describe("disclosure reduces the fields, not only the identifiers", () => {
  it("shows only a short name at waiting-room level", () => {
    // The level exists so a named person can recognise themselves being called.
    // Anything past that is readable by whoever else is in the room.
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
      { disclosure: "public" },
    );
    expect(screen.getByText("A. Okonkwo")).toBeInTheDocument();
    expect(container.textContent).not.toContain("Amara Chinelo Okonkwo");
  });

  it("withholds the date of birth, the age and the clinical sex in public", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.withSpcu} context="navigation" />,
      { disclosure: "public" },
    );
    expect(container.textContent).not.toContain("08 Mar 1985");
    expect(container.textContent).not.toContain("female-typical");
    expect(container.querySelector('[data-ox-field="dob"]')).toBeNull();
    expect(container.querySelector('[data-ox-field="identifier"]')).toBeNull();
  });

  it("withholds them from the accessible name too", () => {
    // Reducing the pixels and leaving the label intact would hand a
    // screen-reader user exactly what the level was built to withhold.
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />, {
      disclosure: "public",
    });
    const label = screen.getByRole("region").getAttribute("aria-label") ?? "";
    expect(label).toContain("A. Okonkwo");
    expect(label).not.toContain("Amara Chinelo");
    expect(label).not.toContain("8 March 1985");
    expect(label).not.toContain("M R N");
  });

  it("gives reception the date of birth and a masked identifier, but not the clinical sex", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.withSpcu} context="navigation" />,
      { disclosure: "reception" },
    );
    expect(container.textContent).toContain("08 Mar 1985");
    expect(container.textContent).not.toContain("female-typical");
    expect(container.textContent).not.toContain("41 y");
  });

  it("gives a clinician everything", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.withSpcu} context="navigation" />,
      { disclosure: "clinical" },
    );
    expect(container.textContent).toContain("female-typical");
    expect(container.textContent).toContain("08 Mar 1985");
  });

  it("keeps a mononym whole even in the short form", () => {
    const p = F.patient({ id: "mono", name: [{ use: "official", given: ["Suryanto"] }] });
    F.renderWithPolicy(<PatientBanner patient={p} context="navigation" />, {
      disclosure: "public",
    });
    expect(screen.getByText("Suryanto")).toBeInTheDocument();
  });
});

describe("exhaustiveness", () => {
  it("describes every state the engine can produce", () => {
    const states: IdentityState[] = [
      { kind: "inactive" },
      { kind: "deceased" },
      { kind: "merged", into: { reference: "Patient/x" } },
      { kind: "test" },
      { kind: "restricted", codes: ["ETH"] },
    ];
    for (const s of states) {
      const r = describeState(s);
      expect(r.text.length).toBeGreaterThan(3);
      expect(r.icon.length).toBeGreaterThan(0);
    }
  });

  it("describes a deceased state with no recorded date", () => {
    expect(describeState({ kind: "deceased" }).text).toBe("Deceased");
  });

  it("picks a rail tone for every state, and none for a plain record", () => {
    const tone = (states: IdentityState[]): string => railTone({ ...amara, states } as Identity);
    expect(tone([])).toBe("none");
    expect(tone([{ kind: "inactive" }])).toBe("neutral");
    expect(tone([{ kind: "deceased" }])).toBe("neutral");
    expect(tone([{ kind: "test" }])).toBe("warn");
    expect(tone([{ kind: "merged", into: { reference: "x" } }])).toBe("warn");
    expect(tone([{ kind: "restricted", codes: ["PSY"] }])).toBe("restricted");
    // Restriction outranks everything else on the rail.
    expect(tone([{ kind: "deceased" }, { kind: "restricted", codes: ["PSY"] }])).toBe("restricted");
  });

  it("renders nothing for a plain record unless asked for Active", () => {
    const { container } = render(<StateTags identity={amara} />);
    expect(container.firstElementChild).toBeNull();
  });

  it("covers every wristband verdict", () => {
    expect(wristbandMessage({ kind: "idle" })).toBeTruthy();
    expect(wristbandMessage({ kind: "match", identifier: "1", assigner: "St Aidan's" })).toContain(
      "St Aidan's",
    );
    expect(wristbandMessage({ kind: "match", identifier: "1" })).not.toContain("undefined");
    expect(wristbandMessage({ kind: "mismatch", scanned: "2" })).toBeTruthy();
    expect(
      wristbandMessage({
        kind: "wrong-system",
        scanned: "1",
        scannedSystem: "a",
        expectedSystem: "b",
      }),
    ).toBeTruthy();
  });
});

describe("the library writes nothing to the console", () => {
  it("stays silent across every component and state", () => {
    const spies = (["log", "warn", "error", "info", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    for (const p of [F.amaraA, F.deceased, F.merged, F.testPatient, F.sensitive, F.withPhoto]) {
      const { unmount } = F.renderWithPolicy(
        <>
          <PatientBanner patient={p} context="navigation" />
          <PatientChip patient={p} />
        </>,
      );
      unmount();
      __resetBannerRegistry();
    }
    for (const s of spies) {
      // React itself would log a key warning or an act warning here, so this
      // asserts the suite is clean as well as the library.
      expect(s).not.toHaveBeenCalled();
      s.mockRestore();
    }
  });
});

describe("re-render paths the feature suites do not reach", () => {
  it("does not announce a switch when the same patient re-renders", async () => {
    // The banner's announcer fires on a patient *change*. A new Patient object
    // describing the same person resolves to the same identity key, and
    // announcing that would talk over a screen-reader user for nothing.
    const { rerender } = F.renderWithPolicy(<PatientBanner patient={F.ada} context="navigation" />);
    await waitFor(() => expect(screen.getByRole("region")).toBeInTheDocument());

    // A structurally identical copy — a fresh object from a refetch.
    rerender(<PatientBanner patient={{ ...F.ada }} context="navigation" />);
    await new Promise((r) => setTimeout(r, 200));

    const live = [...document.querySelectorAll("[aria-live]")]
      .map((n) => n.textContent ?? "")
      .join(" ");
    expect(live).not.toMatch(/now showing/i);
  });

  it("tolerates the same patient appearing twice in one set", async () => {
    // Two chips, one person — a worklist that lists an encounter and its
    // follow-up. Both register the identical memoised Identity, and both
    // deregister the same key on unmount. Neither the duplicate registration
    // nor the second removal may disturb the map.
    const onDisambiguate = vi.fn();
    const { rerender } = F.renderWithPolicy(
      <IdentitySet onDisambiguate={onDisambiguate}>
        <PatientChip patient={F.ada} />
        <PatientChip patient={F.ada} />
      </IdentitySet>,
    );
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].total).toBe(1));

    rerender(<IdentitySet onDisambiguate={onDisambiguate}>{null}</IdentitySet>);
    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].total).toBe(0));
  });

  it("adds the date of birth when two records share a name entirely", async () => {
    // Rung 1 of the ladder is skipped when the given names already match, so
    // the date of birth is the first thing that tells these two apart.
    const onDisambiguate = vi.fn();
    const older = F.patient({
      id: "pat-7001",
      name: [{ use: "official", given: ["Rosa"], family: "Iyer" }],
      birthDate: "1948-02-11",
      identifier: [{ system: F.MRN, value: "770112001" }],
    });
    const younger = F.patient({
      id: "pat-7002",
      name: [{ use: "official", given: ["Rosa"], family: "Iyer" }],
      birthDate: "1991-07-04",
      identifier: [{ system: F.MRN, value: "770112002" }],
    });

    const { container } = F.renderWithPolicy(
      <IdentitySet onDisambiguate={onDisambiguate}>
        <PatientChip patient={older} />
        <PatientChip patient={younger} />
      </IdentitySet>,
    );

    await waitFor(() => expect(onDisambiguate.mock.calls.at(-1)?.[0].escalated).toBe(2));
    await waitFor(() => {
      // Both dates on screen, because one without the other identifies nobody.
      expect(container.textContent).toMatch(/1948/);
      expect(container.textContent).toMatch(/1991/);
    });
  });
});
