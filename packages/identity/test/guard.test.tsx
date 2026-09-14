import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PatientBanner } from "../src/PatientBanner.js";
import {
  PatientGuard,
  __resetBannerRegistry,
  onBannerViolation,
  useDisplayedPatient,
} from "../src/PatientGuard.js";
import * as F from "./fixtures.js";

afterEach(() => __resetBannerRegistry());

describe("PatientGuard", () => {
  it("renders its children when the patients agree", () => {
    F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation">
        {null}
      </PatientBanner>,
    );
    // A guard outside a banner has nothing to compare against and renders.
    F.renderWithPolicy(
      <PatientGuard expect="pat-4471">
        <p>order form</p>
      </PatientGuard>,
    );
    expect(screen.getByText("order form")).toBeInTheDocument();
  });

  it("refuses to render its children when the chart on screen is someone else", () => {
    F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation">
        <PatientGuard expect="pat-2210" expectName="Ada Lovelace">
          <p>order form</p>
        </PatientGuard>
      </PatientBanner>,
    );
    expect(screen.queryByText("order form")).not.toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Wrong patient");
    // Names both people and states that nothing happened, per CONTENT.md §4.
    expect(alert).toHaveTextContent("Ada Lovelace");
    expect(alert).toHaveTextContent("Amara Chinelo Okonkwo");
    expect(alert).toHaveTextContent("Nothing has been submitted");
    expect(alert.textContent?.toLowerCase()).not.toContain("are you sure");
  });

  it("tells the application about the near miss", () => {
    const onMismatch = vi.fn();
    F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation">
        <PatientGuard expect="pat-2210" onMismatch={onMismatch}>
          <p>order form</p>
        </PatientGuard>
      </PatientBanner>,
    );
    expect(onMismatch).toHaveBeenCalledWith(
      expect.objectContaining({ expected: "pat-2210", displayed: "pat-4471" }),
    );
  });

  it("refuses in every environment, not only in development builds", () => {
    // A wrong-patient mismatch is not a developer-experience concern that gets
    // compiled out of a production bundle. It refuses the same way in both.
    F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation">
        <PatientGuard expect="pat-2210">
          <p>order form</p>
        </PatientGuard>
      </PatientBanner>,
    );
    expect(screen.queryByText("order form")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveAttribute("data-zb-guard", "mismatch");
  });

  it("accepts a caller-supplied fallback", () => {
    F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation">
        <PatientGuard expect="pat-2210" fallback={(i) => <p>blocked: {i.displayedName}</p>}>
          <p>order form</p>
        </PatientGuard>
      </PatientBanner>,
    );
    expect(screen.getByText("blocked: Amara Chinelo Okonkwo")).toBeInTheDocument();
  });
});

describe("useDisplayedPatient", () => {
  it("reports the patient the banner in scope is showing", () => {
    function Probe() {
      const p = useDisplayedPatient();
      return <p data-testid="probe">{p?.name.text ?? "none"}</p>;
    }
    F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation">
        <Probe />
      </PatientBanner>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("Amara Chinelo Okonkwo");
  });

  it("is null outside a banner", () => {
    function Probe() {
      const p = useDisplayedPatient();
      return <p data-testid="probe">{p?.name.text ?? "none"}</p>;
    }
    F.renderWithPolicy(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("none");
  });
});

describe("one banner per screen", () => {
  it("reports the violation to the application and still renders the record", () => {
    const handler = vi.fn();
    onBannerViolation(handler);
    F.renderWithPolicy(
      <>
        <PatientBanner patient={F.amaraA} context="navigation" />
        <PatientBanner patient={F.devraj} context="navigation" />
      </>,
    );
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      kind: "duplicate-banner",
      displayed: "pat-9038",
      other: "pat-4471",
    });
    expect(String(handler.mock.calls[0]?.[0].message)).toContain("Two PatientBanners");
    // A hard crash here would take the whole record down, which is worse than
    // an ambiguous header the application has been told about.
    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("writes nothing to the console — that path carries PHI onward", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    F.renderWithPolicy(
      <>
        <PatientBanner patient={F.amaraA} context="navigation" />
        <PatientBanner patient={F.devraj} context="navigation" />
      </>,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("allows a second banner after the first unmounts", () => {
    const handler = vi.fn();
    onBannerViolation(handler);
    const { unmount } = F.renderWithPolicy(
      <PatientBanner patient={F.amaraA} context="navigation" />,
    );
    unmount();
    F.renderWithPolicy(<PatientBanner patient={F.devraj} context="navigation" />);
    expect(handler).not.toHaveBeenCalled();
  });

  it("counts banners per patient, so unmounting one of two does not forget the patient", () => {
    const handler = vi.fn();
    onBannerViolation(handler);
    const first = F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />);
    F.renderWithPolicy(<PatientBanner patient={F.amaraA} context="navigation" />);
    expect(handler).not.toHaveBeenCalled();

    first.unmount();
    F.renderWithPolicy(<PatientBanner patient={F.devraj} context="navigation" />);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      displayed: "pat-9038",
      other: "pat-4471",
    });
  });

  it("unsubscribes cleanly", () => {
    const handler = vi.fn();
    const off = onBannerViolation(handler);
    off();
    F.renderWithPolicy(
      <>
        <PatientBanner patient={F.amaraA} context="navigation" />
        <PatientBanner patient={F.devraj} context="navigation" />
      </>,
    );
    expect(handler).not.toHaveBeenCalled();
  });
});
