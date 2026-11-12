import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import sdk from "@stackblitz/sdk";
import { ExampleBlock } from "@/components/site/docs/example-block";
import { CodeBlock } from "@/components/site/docs/code-block";

vi.mock("@stackblitz/sdk", () => ({ default: { openProject: vi.fn() } }));

afterEach(cleanup);

const code = `import { Switch } from "@/components/zoblocks/switch";\n\nexport default function Example() {\n  return <Switch label="Smoker" />;\n}`;

describe("ExampleBlock", () => {
  it("shows the code under its file name when there is no live preview", () => {
    render(
      <ExampleBlock component="switch" id="basic" title="Basic use" description="d" code={code} />,
    );
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByText("BasicUse.tsx")).toBeInTheDocument();
    expect(screen.getByLabelText("Basic use code")).toBeVisible();
  });

  it("switches between preview and code when there is one", () => {
    render(
      <ExampleBlock
        component="switch"
        id="basic"
        title="Basic"
        description="d"
        code={code}
        preview={<p>live switch</p>}
      />,
    );
    const preview = screen.getByRole("tab", { name: "preview" });
    const codeTab = screen.getByRole("tab", { name: "code" });
    expect(preview).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("live switch")).toBeVisible();

    fireEvent.click(codeTab);
    expect(codeTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("live switch")).not.toBeVisible();
    expect(screen.getByLabelText("Basic code")).toBeVisible();
  });

  it("opens a runnable example in StackBlitz from the card bar", () => {
    vi.mocked(sdk.openProject).mockClear();
    render(
      <ExampleBlock component="switch" id="tones" title="Tones" description="d" code={code} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open the Tones example in StackBlitz" }));
    expect(sdk.openProject).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "create-react-app",
        files: expect.objectContaining({
          "src/Example.tsx": expect.stringContaining('from "@zoblocks/react"'),
        }),
      }),
      { openFile: "src/Example.tsx", newWindow: true },
    );
  });

  it("offers no StackBlitz button on an example that cannot run", () => {
    render(
      <ExampleBlock component="switch" id="basic" title="Basic" description="d" code={code} />,
    );
    expect(screen.queryByRole("button", { name: /StackBlitz/ })).toBeNull();
  });
});

describe("CodeBlock", () => {
  it("numbers long code and leaves short code bare", () => {
    const { container, rerender } = render(<CodeBlock code={code} file="a.tsx" />);
    expect(container.querySelectorAll("[aria-hidden='true'].select-none")).toHaveLength(5);
    rerender(<CodeBlock code="npx @zoblocks/cli add switch" lang="sh" file="Terminal" />);
    expect(container.querySelectorAll("[aria-hidden='true'].select-none")).toHaveLength(0);
  });
});

describe("example previews", () => {
  it("only preview examples that exist in the catalogue", async () => {
    const { EXAMPLE_PREVIEWS } = await import("@/components/site/docs/example-registry");
    const { CATALOG } = await import("@/lib/generated/catalog");
    for (const [name, previews] of Object.entries(EXAMPLE_PREVIEWS)) {
      const ids = (CATALOG.find((c) => c.name === name)?.examples ?? []).map((e) => e.id);
      for (const id of Object.keys(previews)) {
        expect(ids, `${name} has no example "${id}"`).toContain(id);
      }
    }
  });

  it("previews every loader, Tabs, Switch, Accordion, Clinical Status, Chart Context Menu, Signature, Date Picker, Data Grid, Care Timeline and Recorder example", async () => {
    const { EXAMPLE_PREVIEWS } = await import("@/components/site/docs/example-registry");
    const { CATALOG } = await import("@/lib/generated/catalog");
    for (const name of [
      "pulse-loader",
      "rhythm-loader",
      "breath-loader",
      "helix-loader",
      "infusion-loader",
      "tabs",
      "switch",
      "accordion",
      "clinical-status",
      "chart-context-menu",
      "signature",
      "date-picker",
      "data-grid",
      "care-timeline",
      "recorder",
    ]) {
      const ids = (CATALOG.find((c) => c.name === name)?.examples ?? []).map((e) => e.id);
      expect(ids.length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(EXAMPLE_PREVIEWS[name] ?? {}).sort()).toEqual([...ids].sort());
    }
  });
});
