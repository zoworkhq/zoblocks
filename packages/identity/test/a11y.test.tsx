import axe from "axe-core";
import { screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { IdentityProvider } from "../src/IdentityProvider.js";
import { IdentitySet, IdentitySetNotice } from "../src/IdentitySet.js";
import { PatientBanner } from "../src/PatientBanner.js";
import { PatientChip } from "../src/PatientChip.js";
import { __resetBannerRegistry } from "../src/PatientGuard.js";
import * as F from "./fixtures.js";

afterEach(() => __resetBannerRegistry());

async function auditable(node: HTMLElement): Promise<axe.AxeResults> {
  return axe.run(node, {
    // Colour contrast needs a real layout engine and real stylesheets; it is
    // asserted over the token file in CI and in the Playwright suite, not here,
    // where jsdom would report a false pass either way.
    rules: { "color-contrast": { enabled: false } },
  });
}

describe("axe", () => {
  it.each([
    ["a plain banner", <PatientBanner patient={F.amaraA} context="navigation" />],
    ["a deceased banner", <PatientBanner patient={F.deceased} context="navigation" />],
    ["a merged banner", <PatientBanner patient={F.merged} context="navigation" />],
    ["a test-patient banner", <PatientBanner patient={F.testPatient} context="navigation" />],
    ["a sensitive banner", <PatientBanner patient={F.sensitive} context="navigation" />],
    ["a loading banner", <PatientBanner loading context="navigation" />],
    ["an errored banner", <PatientBanner error={new Error("x")} context="navigation" />],
    ["a chip", <PatientChip patient={F.amaraA} />],
  ])("reports no violations for %s", async (_name, ui) => {
    const { container } = F.renderWithPolicy(ui);
    const results = await auditable(container);
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it("reports no violations for a worklist with escalations", async () => {
    const { container, findByRole } = F.renderWithPolicy(
      <IdentitySet>
        <ul>
          <li>
            <PatientChip patient={F.amaraA} />
          </li>
          <li>
            <PatientChip patient={F.amaraB} />
          </li>
        </ul>
        <IdentitySetNotice />
      </IdentitySet>,
    );
    await findByRole("status");
    const results = await auditable(container);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

describe("the accessible contract", () => {
  it("gives the banner exactly one region with one composed name", () => {
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />);
    // A labelled `section`, so the role is implicit rather than asserted with
    // an attribute `header` is not allowed to carry.
    expect(screen.getAllByRole("region")).toHaveLength(1);
  });

  it("hides the avatar from assistive technology inside a banner", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    const avatar = container.querySelector(".zb-avatar");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
  });

  it("spells the identifier label so a screen reader says the letters", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    // Unspaced, every major screen reader pronounces MRN as "mern".
    expect(container.querySelector("section")?.getAttribute("aria-label")).toContain("M R N");
  });

  it("keeps one polite live region and no assertive one", () => {
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
    expect(container.querySelectorAll('[aria-live="assertive"]')).toHaveLength(0);
  });

  it("never puts a name or an identifier behind a title attribute", () => {
    // Hover is not available on touch, not reachable by keyboard, and produces
    // a screen where PHI appears and disappears under a moving mouse.
    const { container } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    for (const el of container.querySelectorAll("[title]")) {
      expect(el.getAttribute("title")).not.toContain("Okonkwo");
      expect(el.getAttribute("title")).not.toContain("123");
    }
  });
});

describe("server rendering", () => {
  it("renders without a DOM", () => {
    const html = renderToStaticMarkup(
      <IdentityProvider now={F.NOW}>
        <PatientBanner patient={F.amaraA} context="navigation" />
      </IdentityProvider>,
    );
    expect(html).toContain("Amara Chinelo Okonkwo");
    expect(html).toContain("08 Mar 1985");
  });

  it("is byte-identical across renders — no hydration flicker", () => {
    // Anything seeded in the swatch hash would show up here as a colour that
    // changes half a second after paint.
    const once = renderToStaticMarkup(
      <IdentityProvider now={F.NOW}>
        <PatientBanner patient={F.amaraA} context="navigation" />
      </IdentityProvider>,
    );
    for (let i = 0; i < 20; i++) {
      const again = renderToStaticMarkup(
        <IdentityProvider now={F.NOW}>
          <PatientBanner patient={F.amaraA} context="navigation" />
        </IdentityProvider>,
      );
      expect(again).toBe(once);
    }
  });

  it("produces the same swatch on the server as in the browser", () => {
    const html = renderToStaticMarkup(
      <IdentityProvider now={F.NOW}>
        <PatientChip patient={F.amaraA} />
      </IdentityProvider>,
    );
    const server = /zb-avatar--sw(\d)/.exec(html)?.[1];
    const { container } = F.renderWithPolicy(<PatientChip patient={F.amaraA} />);
    const client = /zb-avatar--sw(\d)/.exec(container.innerHTML)?.[1];
    expect(server).toBe(client);
  });
});

describe("disclosure leakage", () => {
  it.each(["public", "reception"] as const)(
    "leaks no unmasked identifier into the %s HTML",
    (disclosure) => {
      // Asserted on the string: that is what ends up in a screenshot and in a
      // DOM snapshot sent to an error reporter.
      const html = renderToStaticMarkup(
        <IdentityProvider now={F.NOW} disclosure={disclosure}>
          <PatientBanner patient={F.sensitive} context="navigation" />
        </IdentityProvider>,
      );
      expect(html).not.toContain("123456789");
      expect(html).not.toContain("123 456 789");
    },
  );

  it("leaks no photograph when the policy denies it", () => {
    const html = renderToStaticMarkup(
      <IdentityProvider now={F.NOW} photos="deny">
        <PatientBanner patient={F.withPhoto} context="navigation" />
      </IdentityProvider>,
    );
    expect(html).not.toContain("pacs.invalid");
  });

  it("substitutes a synthetic identity in demo mode", () => {
    const html = renderToStaticMarkup(
      <IdentityProvider now={F.NOW} demoMode>
        <PatientBanner patient={F.amaraA} context="navigation" />
      </IdentityProvider>,
    );
    expect(html).not.toContain("Amara Chinelo Okonkwo");
    expect(html).not.toContain("123 456 789");
    // The shape survives: still a banner, still an identifier of the same
    // length, still the same swatch.
    expect(html).toContain("zb-banner");
  });
});
