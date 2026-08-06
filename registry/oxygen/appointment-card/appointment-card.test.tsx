import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { appointments } from "@oxygenui-design/fixtures";
import { AppointmentCard } from "./appointment-card";
import { itMeetsTheContract } from "../../../test/contract";

const TZ = "Asia/Kolkata";

describe("AppointmentCard", () => {
  itMeetsTheContract("booked", () => (
    <AppointmentCard appointment={appointments.booked} timeZone={TZ} />
  ));

  /**
   * "Defaulting to the browser's zone is how a clinic in one region books a
   * patient in another for the wrong hour." The zone is a required prop, so
   * the same appointment must read differently in two zones.
   */
  it("renders the time in the zone it was given, not the runtime's", () => {
    const kolkata = render(
      <AppointmentCard appointment={appointments.booked} timeZone="Asia/Kolkata" />,
    ).container.textContent;
    const losAngeles = render(
      <AppointmentCard appointment={appointments.booked} timeZone="America/Los_Angeles" />,
    ).container.textContent;
    expect(kolkata).not.toEqual(losAngeles);
  });

  it("shows a time rather than a bare date", () => {
    const view = render(<AppointmentCard appointment={appointments.booked} timeZone={TZ} />);
    expect(view.container.textContent).toMatch(/\d{1,2}:\d{2}/);
  });

  it("distinguishes a cancelled appointment from a booked one", () => {
    const booked = render(<AppointmentCard appointment={appointments.booked} timeZone={TZ} />)
      .container.textContent;
    const cancelled = render(<AppointmentCard appointment={appointments.cancelled} timeZone={TZ} />)
      .container.textContent;
    expect(booked).not.toEqual(cancelled);
    expect(cancelled).toMatch(/cancel/i);
  });

  it("marks a no-show as a no-show", () => {
    const view = render(<AppointmentCard appointment={appointments.noShow} timeZone={TZ} />);
    expect(view.container.textContent).toMatch(/no.?show|did not attend|missed/i);
  });

  it("marks a virtual appointment as virtual", () => {
    const view = render(<AppointmentCard appointment={appointments.virtual} timeZone={TZ} />);
    expect(view.container.textContent).toMatch(/virtual|video|telehealth|remote|online/i);
  });

  it("calls back with the appointment when selected", async () => {
    const onSelect = vi.fn();
    render(<AppointmentCard appointment={appointments.booked} timeZone={TZ} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(appointments.booked);
  });

  it("renders a missing appointment as absent rather than blank", () => {
    const view = render(<AppointmentCard appointment={undefined} timeZone={TZ} />);
    const text = view.container.textContent ?? "";
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("Invalid Date");
  });

  it("renders a loading state without inventing a time", () => {
    const view = render(<AppointmentCard appointment={undefined} timeZone={TZ} loading />);
    expect(view.container.textContent).not.toContain("Invalid Date");
  });
});
