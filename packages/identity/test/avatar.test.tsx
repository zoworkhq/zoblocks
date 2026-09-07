import { policy, resolveIdentity } from "@zoblocks/identity-core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BannerAvatar, IdentityAvatar } from "../src/IdentityAvatar.js";
import * as F from "./fixtures.js";

const P = policy({ now: F.NOW });
const ALLOW = policy({ now: F.NOW, photos: "allow" });

function av(patient = F.amaraA, p = P) {
  return resolveIdentity(patient, p);
}

describe("IdentityAvatar", () => {
  it("renders one element — the whole performance argument", () => {
    const { container } = render(<IdentityAvatar identity={av()} size={32} />);
    const root = container.firstElementChild;
    expect(root?.tagName).toBe("SPAN");
    // Initials-only avatars are a single node. At 5,000 rows the difference
    // between one and three is 10,000 elements of decoration.
    expect(container.querySelectorAll("*")).toHaveLength(1);
  });

  it("is hidden from assistive technology by default", () => {
    const { container } = render(<IdentityAvatar identity={av()} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    // No alt text naming the patient: that is noise, and a small PHI leak into
    // anything that scrapes alt attributes.
    expect(container.querySelector("[alt]")).toBeNull();
  });

  it("exposes a role and label only when the caller supplies one", () => {
    render(<IdentityAvatar identity={av()} label="Patient: Amara Chinelo Okonkwo" />);
    expect(screen.getByRole("img", { name: "Patient: Amara Chinelo Okonkwo" })).toBeInTheDocument();
  });

  it("carries the swatch as a class, never as an inline colour", () => {
    // Inline styles would need `unsafe-inline` in the CSP. ARCHITECTURE §9 says
    // components must work under a strict policy.
    const { container } = render(<IdentityAvatar identity={av()} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toMatch(/zb-avatar--sw[1-6]/);
    expect(root.getAttribute("style") ?? "").not.toMatch(/color|background-color/);
  });

  it("renders the same swatch for the same record every time", () => {
    const a = render(<IdentityAvatar identity={av()} />).container.firstElementChild?.className;
    const b = render(<IdentityAvatar identity={av()} />).container.firstElementChild?.className;
    expect(a).toBe(b);
  });

  describe("the five absences", () => {
    it("distinguishes all five in the DOM", () => {
      const kinds = ["present", "none-on-file", "unavailable", "withheld", "loading"] as const;
      const seen = new Set<string>();
      for (const kind of kinds) {
        const photo =
          kind === "present"
            ? ({ kind, src: "https://pacs.invalid/x.png" } as const)
            : kind === "withheld"
              ? ({ kind, reason: "policy" } as const)
              : ({ kind } as const);
        const { container } = render(<IdentityAvatar identity={av()} photo={photo} />);
        const el = container.firstElementChild as HTMLElement;
        expect(el.dataset.zbPhoto).toBe(kind);
        seen.add(`${el.dataset.zbPhoto}|${el.className}`);
      }
      // Five states, five distinct renderings. This is the test that fails the
      // day someone "simplifies" the fallback to always show initials.
      expect(seen.size).toBe(5);
    });

    it("does not confuse no-photo-on-file with a failed load", () => {
      const none = render(<IdentityAvatar identity={av()} photo={{ kind: "none-on-file" }} />)
        .container.firstElementChild as HTMLElement;
      const failed = render(<IdentityAvatar identity={av()} photo={{ kind: "unavailable" }} />)
        .container.firstElementChild as HTMLElement;
      expect(none.className).not.toBe(failed.className);
    });

    it("reports withheld when the record has a photo and the policy denies it", () => {
      const { container } = render(<IdentityAvatar identity={av(F.withPhoto, P)} />);
      expect((container.firstElementChild as HTMLElement).dataset.zbPhoto).toBe("withheld");
    });

    it("reports none-on-file when there is genuinely no photo, even under deny", () => {
      const { container } = render(<IdentityAvatar identity={av(F.amaraA, P)} />);
      expect((container.firstElementChild as HTMLElement).dataset.zbPhoto).toBe("none-on-file");
    });
  });

  it("marks a deceased record without relying on colour alone", () => {
    const { container } = render(<IdentityAvatar identity={av(F.deceased)} />);
    expect((container.firstElementChild as HTMLElement).className).toContain("zb-avatar--deceased");
  });

  it("marks a test record", () => {
    const { container } = render(<IdentityAvatar identity={av(F.testPatient)} />);
    expect((container.firstElementChild as HTMLElement).className).toContain("zb-avatar--test");
  });

  it("uses container-query sizing by default", () => {
    const { container } = render(<IdentityAvatar identity={av()} />);
    expect((container.firstElementChild as HTMLElement).className).toContain("zb-avatar--auto");
  });

  it("renders script-correct initials", () => {
    const han = av(
      F.patient({ id: "pat-6650", name: [{ use: "official", given: ["美琳"], family: "陳" }] }),
    );
    render(<IdentityAvatar identity={han} />);
    expect(screen.getByText("陳")).toBeInTheDocument();
  });
});

describe("BannerAvatar", () => {
  it("uses a real img so onError exists", () => {
    const { container } = render(<BannerAvatar identity={av(F.withPhoto, ALLOW)} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://pacs.invalid/p/4471.png");
  });

  it("hardens the image request", () => {
    const { container } = render(<BannerAvatar identity={av(F.withPhoto, ALLOW)} />);
    const img = container.querySelector("img");
    // A signed photo URL must never reach a third party's Referer log.
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(img).toHaveAttribute("crossorigin", "anonymous");
    // The banner is above the fold and is a safety control — the opposite of
    // the framework default.
    expect(img?.getAttribute("fetchpriority")).toBe("high");
    expect(img).toHaveAttribute("alt", "");
  });

  it("reports a load failure to the caller", () => {
    const onPhotoError = vi.fn();
    const { container } = render(
      <BannerAvatar identity={av(F.withPhoto, ALLOW)} onPhotoError={onPhotoError} />,
    );
    const img = container.querySelector("img");
    img?.dispatchEvent(new Event("error"));
    expect(onPhotoError).toHaveBeenCalled();
  });

  it("falls back to the single-node renderer when there is no photograph", () => {
    const { container } = render(<BannerAvatar identity={av(F.amaraA, ALLOW)} />);
    expect(container.querySelector("img")).toBeNull();
    expect((container.firstElementChild as HTMLElement).dataset.zbPhoto).toBe("none-on-file");
  });
});
