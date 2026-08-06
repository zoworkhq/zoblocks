import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  SaveStatus,
  UnsavedGuardProvider,
  useConfirmLeave,
  useUnsavedWork,
  type DirtySurface,
} from "./unsaved-guard";

function Editor({ surface }: { surface: DirtySurface }) {
  useUnsavedWork(surface);
  return null;
}

function LeaveButton({ onResult }: { onResult: (ok: boolean) => void }) {
  const confirmLeave = useConfirmLeave();
  return (
    <button type="button" onClick={async () => onResult(await confirmLeave("switch patient"))}>
      Leave
    </button>
  );
}

const NOTE = (saveState: DirtySurface["saveState"]): DirtySurface => ({
  id: "note-1",
  description: "Progress note",
  saveState,
});

describe("UnsavedGuardProvider", () => {
  /**
   * Registration must reach a fixed point.
   *
   * Every editing component re-registers on each render — that is the intended
   * calling pattern, and the surface object is a fresh literal each time. If
   * registering feeds back into the context value, the provider and its
   * consumers spin: render → register → setState → new context → effect →
   * register. It does not throw; it exhausts memory, so nothing catches it
   * except a render counter.
   */
  it("settles instead of re-registering forever", () => {
    let renders = 0;
    function CountingEditor() {
      renders += 1;
      // A fresh object every render, as a real form would produce.
      useUnsavedWork({ id: "note-1", description: "Progress note", saveState: "failed" });
      return null;
    }

    render(
      <UnsavedGuardProvider>
        <CountingEditor />
      </UnsavedGuardProvider>,
    );

    expect(renders).toBeLessThan(10);
  });

  it("settles with several surfaces registered at once", () => {
    let renders = 0;
    function CountingEditor({ id }: { id: string }) {
      renders += 1;
      useUnsavedWork({ id, description: `Note ${id}`, saveState: "saving" });
      return null;
    }

    render(
      <UnsavedGuardProvider>
        <CountingEditor id="a" />
        <CountingEditor id="b" />
        <CountingEditor id="c" />
      </UnsavedGuardProvider>,
    );

    expect(renders).toBeLessThan(30);
  });

  it("lets a clean surface be left without a prompt", async () => {
    const onResult = vi.fn();
    render(
      <UnsavedGuardProvider>
        <Editor surface={NOTE("clean")} />
        <LeaveButton onResult={onResult} />
      </UnsavedGuardProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    expect(onResult).toHaveBeenCalledWith(true);
  });

  /**
   * "Work whose autosave is FAILING must block, because the draft exists
   * nowhere but this tab." A soft notice here loses the note.
   */
  it("blocks on a failed autosave rather than warning and continuing", async () => {
    const onResult = vi.fn();
    render(
      <UnsavedGuardProvider>
        <Editor surface={NOTE("failed")} />
        <LeaveButton onResult={onResult} />
      </UnsavedGuardProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    expect(onResult).not.toHaveBeenCalled();
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  });

  it("blocks while a save is still in flight", async () => {
    const onResult = vi.fn();
    render(
      <UnsavedGuardProvider>
        <Editor surface={NOTE("saving")} />
        <LeaveButton onResult={onResult} />
      </UnsavedGuardProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    expect(onResult).not.toHaveBeenCalled();
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
  });

  it("names what would be lost, in the user's terms", async () => {
    render(
      <UnsavedGuardProvider>
        <Editor surface={NOTE("failed")} />
        <LeaveButton onResult={vi.fn()} />
      </UnsavedGuardProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    expect((await screen.findByRole("alertdialog")).textContent).toContain("Progress note");
  });

  it("states the intent that triggered the prompt", async () => {
    render(
      <UnsavedGuardProvider>
        <Editor surface={NOTE("failed")} />
        <LeaveButton onResult={vi.fn()} />
      </UnsavedGuardProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    expect((await screen.findByRole("alertdialog")).textContent).toMatch(/switch patient/i);
  });

  it("resolves false when the user stays", async () => {
    const onResult = vi.fn();
    render(
      <UnsavedGuardProvider>
        <Editor surface={NOTE("failed")} />
        <LeaveButton onResult={onResult} />
      </UnsavedGuardProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /stay|cancel|keep editing/i }),
    );
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it("stops tracking a surface once it unmounts", async () => {
    const onResult = vi.fn();
    const { rerender } = render(
      <UnsavedGuardProvider>
        <Editor surface={NOTE("failed")} />
        <LeaveButton onResult={onResult} />
      </UnsavedGuardProvider>,
    );

    rerender(
      <UnsavedGuardProvider>
        <LeaveButton onResult={onResult} />
      </UnsavedGuardProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    expect(onResult).toHaveBeenCalledWith(true);
  });

  /** Without a provider the hook must not throw — it degrades to permitting. */
  it("does not crash when used outside a provider", async () => {
    const onResult = vi.fn();
    render(<LeaveButton onResult={onResult} />);
    await userEvent.click(screen.getByRole("button", { name: /leave/i }));
    expect(onResult).toHaveBeenCalledWith(true);
  });
});

describe("SaveStatus", () => {
  /**
   * "A silent autosave failure lets a clinician write for twenty minutes
   * believing their note is filed."
   */
  it("announces a failed save assertively", () => {
    render(<SaveStatus state="failed" />);
    const status = screen.getByRole("status");
    expect(status.textContent).toMatch(/not saved|failed|could not save/i);
    // The explicit aria-live overrides the polite default that role="status"
    // otherwise implies — without it, a failed autosave waits its turn.
    expect(status).toHaveAttribute("aria-live", "assertive");
  });

  it("does not interrupt for the states that are merely informational", () => {
    for (const state of ["saving", "saved"] as const) {
      render(<SaveStatus state={state} />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
      cleanup();
    }
  });

  it("does not announce a clean state", () => {
    const view = render(<SaveStatus state="clean" />);
    expect((view.container.textContent ?? "").trim()).toBe("");
  });

  it("keeps saving, saved, and failed distinguishable", () => {
    const texts = (["saving", "saved", "failed"] as const).map(
      (state) => render(<SaveStatus state={state} />).container.textContent,
    );
    expect(new Set(texts).size).toBe(3);
  });

  it("shows when the work was last saved", () => {
    const view = render(<SaveStatus state="saved" lastSavedLabel="Saved 09:14" />);
    expect(view.container.textContent).toContain("Saved 09:14");
  });
});
