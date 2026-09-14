import {
  DEFAULT_IDENTIFIER_SYSTEMS,
  IdentityCache,
  type IdentifierSystemSpec,
  type IdentityPolicy,
} from "@zoblocks/identity-core";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  IdentityProvider,
  useIdentityPolicy,
  type IdentityProviderProps,
} from "../src/IdentityProvider.js";
import { PatientBanner } from "../src/PatientBanner.js";
import { __resetBannerRegistry } from "../src/PatientGuard.js";
import * as F from "./fixtures.js";

afterEach(() => {
  __resetBannerRegistry();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function Probe({ seen }: { seen: IdentityPolicy[] }): ReactNode {
  seen.push(useIdentityPolicy().policy);
  return null;
}

function tree(props: Partial<IdentityProviderProps>, children: ReactNode): ReactNode {
  return <IdentityProvider {...(props as IdentityProviderProps)}>{children}</IdentityProvider>;
}

describe("IdentityProvider — a stable policy", () => {
  it("keeps one policy and one clock when systems and callbacks are passed inline", () => {
    const clear = vi.spyOn(IdentityCache.prototype, "clear");
    const seen: IdentityPolicy[] = [];
    const inline = () =>
      tree(
        {
          identifierSystems: DEFAULT_IDENTIFIER_SYSTEMS.map((s) => ({ ...s })),
          onSensitiveReveal: () => {},
          onIdentifierCopy: () => {},
        },
        <Probe seen={seen} />,
      );

    const { rerender } = render(inline());
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-01-01T00:00:00Z"));
    rerender(inline());
    rerender(inline());

    expect(seen.length).toBeGreaterThanOrEqual(3);
    expect(seen.at(-1)).toBe(seen[0]);
    expect(seen.at(-1)?.now.getUTCFullYear()).not.toBe(2031);
    expect(clear).not.toHaveBeenCalled();
  });

  it("calls the latest reveal callback without rebuilding the policy", () => {
    const first = vi.fn();
    const second = vi.fn();
    const seen: IdentityPolicy[] = [];
    const banner = (
      <>
        <PatientBanner patient={F.sensitive} context="navigation" />
        <Probe seen={seen} />
      </>
    );
    const { rerender } = render(tree({ now: F.NOW, onSensitiveReveal: first }, banner));
    rerender(tree({ now: F.NOW, onSensitiveReveal: second }, banner));

    screen.getByRole("button", { name: "Reveal" }).click();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(seen.at(-1)).toBe(seen[0]);
  });

  it("sends identifier copies to the latest callback, and offers none when none was given", () => {
    const first = vi.fn();
    const second = vi.fn();
    let ctx: ReturnType<typeof useIdentityPolicy> | undefined;
    function Grab(): ReactNode {
      ctx = useIdentityPolicy();
      return null;
    }
    const { rerender } = render(tree({ now: F.NOW }, <Grab />));
    expect(ctx?.onIdentifierCopy).toBeUndefined();

    rerender(tree({ now: F.NOW, onIdentifierCopy: first }, <Grab />));
    rerender(tree({ now: F.NOW, onIdentifierCopy: second }, <Grab />));
    const event = { patientId: "pat-4471", kind: "mrn", at: F.NOW.toISOString() };
    ctx?.onIdentifierCopy?.(event);
    expect(second).toHaveBeenCalledWith(event);
    expect(first).not.toHaveBeenCalled();
  });

  it("re-resolves and clears the cache when the disclosure really changes", () => {
    const clear = vi.spyOn(IdentityCache.prototype, "clear");
    const banner = <PatientBanner patient={F.amaraA} context="navigation" />;
    const { rerender } = render(tree({ now: F.NOW }, banner));
    expect(screen.getByText("123 456 789")).toBeInTheDocument();

    rerender(tree({ now: F.NOW, disclosure: "reception" }, banner));
    expect(screen.getByText("••••••789")).toBeInTheDocument();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it("re-resolves when a system changes but its kind does not", () => {
    const relabelled: IdentifierSystemSpec[] = DEFAULT_IDENTIFIER_SYSTEMS.map((s) =>
      s.kind === "mrn" ? { ...s, label: "Hospital no." } : s,
    );
    const banner = <PatientBanner patient={F.amaraA} context="navigation" />;
    const { rerender } = render(tree({ now: F.NOW }, banner));
    expect(screen.queryByText(/Hospital no\./)).not.toBeInTheDocument();

    rerender(tree({ now: F.NOW, identifierSystems: relabelled }, banner));
    expect(screen.getByText(/Hospital no\./)).toBeInTheDocument();
  });

  it("re-resolves a new validator even under the same labels", () => {
    const seen: IdentityPolicy[] = [];
    const withCheck = (checkDigit: (raw: string) => boolean) =>
      DEFAULT_IDENTIFIER_SYSTEMS.map((s) => ({ ...s, checkDigit }));
    const accept = () => true;
    const { rerender } = render(
      tree({ now: F.NOW, identifierSystems: withCheck(accept) }, <Probe seen={seen} />),
    );
    rerender(tree({ now: F.NOW, identifierSystems: withCheck(accept) }, <Probe seen={seen} />));
    expect(seen.at(-1)).toBe(seen[0]);

    rerender(
      tree({ now: F.NOW, identifierSystems: withCheck(() => false) }, <Probe seen={seen} />),
    );
    expect(seen.at(-1)).not.toBe(seen[0]);
    expect(seen.at(-1)?.version).not.toBe(seen[0]?.version);
  });

  it("recomputes ages when the injected clock moves", () => {
    const banner = <PatientBanner patient={F.amaraA} context="navigation" />;
    const { rerender } = render(tree({ now: F.NOW }, banner));
    expect(screen.getByText(/41 y/)).toBeInTheDocument();

    rerender(tree({ now: new Date("2030-08-16T09:00:00Z") }, banner));
    expect(screen.getByText(/45 y/)).toBeInTheDocument();
  });
});
