/**
 * Locale, URL sync, variants and configuration errors.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsLocaleProvider } from "../src/index.js";

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Bravo" },
];

describe("locale", () => {
  it("translates the announced count through a provider", () => {
    render(
      <TabsLocaleProvider locale={{ items: "{count} éléments", itemsOne: "1 élément" }}>
        <Tabs
          as="tabs"
          aria-label="Docs"
          defaultValue="a"
          items={[{ value: "a", label: "Alpha", count: 3 }]}
        />
      </TabsLocaleProvider>,
    );
    expect(screen.getByRole("tab")).toHaveAccessibleName("Alpha, 3 éléments");
  });

  it("lets an instance override the provider", () => {
    render(
      <TabsLocaleProvider locale={{ items: "{count} éléments" }}>
        <Tabs
          as="tabs"
          aria-label="Docs"
          defaultValue="a"
          locale={{ items: "{count} Dateien" }}
          items={[{ value: "a", label: "Alpha", count: 3 }]}
        />
      </TabsLocaleProvider>,
    );
    expect(screen.getByRole("tab")).toHaveAccessibleName("Alpha, 3 Dateien");
  });

  it("translates the close affordance's tooltip", () => {
    render(
      <TabsLocaleProvider locale={{ close: "Fermer {label}" }}>
        <Tabs
          as="tabs"
          aria-label="Docs"
          defaultValue="a"
          items={[{ value: "a", label: "Alpha", closable: true }]}
          editable={{ onClose: () => {} }}
        />
      </TabsLocaleProvider>,
    );
    // A title rather than a name: the affordance is aria-hidden, because an
    // interactive control inside role="tab" is invalid ARIA.
    expect(document.querySelector(".zb-tabs__close")).toHaveAttribute("title", "Fermer Alpha");
  });

  it("nests providers, with the inner one winning", () => {
    render(
      <TabsLocaleProvider locale={{ items: "{count} outer", add: "Outer add" }}>
        <TabsLocaleProvider locale={{ items: "{count} inner" }}>
          <Tabs
            as="tabs"
            aria-label="Docs"
            defaultValue="a"
            items={[{ value: "a", label: "Alpha", count: 2 }]}
            editable={{ onAdd: () => {} }}
          />
        </TabsLocaleProvider>
      </TabsLocaleProvider>,
    );
    expect(screen.getByRole("tab")).toHaveAccessibleName("Alpha, 2 inner");
    // Not overridden by the inner provider, so it falls through to the outer.
    expect(screen.getByRole("button", { name: "Outer add" })).toBeInTheDocument();
  });
});

describe("URL sync", () => {
  const original = window.location.href;
  afterEach(() => {
    window.history.replaceState(null, "", original);
  });

  it("restores the selection from the hash on mount", async () => {
    window.history.replaceState(null, "", "#b");
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} syncTo="hash" />);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Bravo" })).toHaveAttribute("aria-selected", "true"),
    );
  });

  it("writes the selection back to the hash, replacing rather than pushing", async () => {
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} syncTo="hash" />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    // Pushing would make the back button walk through every tab the user
    // glanced at before it leaves the page.
    await waitFor(() => expect(window.location.hash).toBe("#b"));
  });

  it("uses a query parameter when asked", async () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        items={items}
        syncTo="search"
        syncKey="section"
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    await waitFor(() =>
      expect(new URLSearchParams(window.location.search).get("section")).toBe("b"),
    );
  });

  it("reports a URL-driven change with via=url", async () => {
    window.history.replaceState(null, "", "#b");
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        items={items}
        syncTo="hash"
        onChange={onChange}
      />,
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("b", { via: "url" }));
  });

  it("touches the URL not at all when sync is off", async () => {
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Bravo" }));
    expect(window.location.hash).toBe("");
  });
});

describe("variants and layout attributes", () => {
  it.each([
    "segmented",
    "underline",
    "pill",
    "enclosed",
    "rail",
    "ghost",
    "stepper",
    "command",
    "card",
    "stat",
    "unstyled",
  ] as const)("renders variant %s without changing the accessibility tree", (variant) => {
    const { unmount } = render(
      <Tabs as="tabs" aria-label="Docs" variant={variant} defaultValue="a" items={items} />,
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(document.querySelector(`[data-zb-variant="${variant}"]`)).toBeInTheDocument();
    unmount();
  });

  it("resolves the indicator from the variant", () => {
    const { unmount } = render(
      <Tabs as="tabs" aria-label="Docs" variant="segmented" defaultValue="a" items={items} />,
    );
    expect(document.querySelector('[data-zb-indicator="thumb"]')).toBeInTheDocument();
    unmount();

    render(<Tabs as="tabs" aria-label="Docs" variant="pill" defaultValue="a" items={items} />);
    // Wrapping variants get no indicator: there is no continuous path across
    // a line break for one to travel along.
    expect(document.querySelector('[data-zb-indicator="none"]')).toBeInTheDocument();
  });

  it("exposes size and fill as attributes for the stylesheet", () => {
    render(
      <Tabs as="tabs" aria-label="Docs" size="lg" fill="equal" defaultValue="a" items={items} />,
    );
    const root = document.querySelector(".zb-tabs");
    expect(root).toHaveAttribute("data-zb-size", "lg");
    expect(root).toHaveAttribute("data-zb-fill", "equal");
  });

  it("reserves the selected label width so the indicator does not chase a moving target", () => {
    render(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} />);
    expect(
      screen.getByRole("tab", { name: "Alpha" }).querySelector(".zb-tabs__label"),
    ).toHaveAttribute("data-zb-text", "Alpha");
  });
});

describe("configuration errors", () => {
  it("names the mode as the fix when `as` is missing", () => {
    expect(() =>
      // @ts-expect-error deliberately omitting the required prop
      render(<Tabs aria-label="Docs" defaultValue="a" items={items} />),
    ).toThrow(/missing-mode/);
  });

  it("rejects links on a tablist and says why", () => {
    expect(() =>
      render(
        <Tabs
          as="tabs"
          aria-label="Docs"
          defaultValue="a"
          items={[{ value: "a", label: "Alpha", href: "/a" }]}
        />,
      ),
    ).toThrow(/href-without-nav/);
  });

  it("rejects a duplicate value", () => {
    expect(() =>
      render(
        <Tabs
          as="tabs"
          aria-label="Docs"
          defaultValue="a"
          items={[
            { value: "a", label: "Alpha" },
            { value: "a", label: "Also Alpha" },
          ]}
        />,
      ),
    ).toThrow(/duplicate-value/);
  });

  it("rejects a disabled item with no reason", () => {
    expect(() =>
      render(
        <Tabs
          as="tabs"
          aria-label="Docs"
          defaultValue="a"
          items={[
            { value: "a", label: "Alpha" },
            { value: "b", label: "Bravo", disabled: true },
          ]}
        />,
      ),
    ).toThrow(/disabled-without-reason/);
  });

  it("rejects a rich label with no text equivalent", () => {
    expect(() =>
      render(
        <Tabs
          as="tabs"
          aria-label="Docs"
          defaultValue="a"
          items={[{ value: "a", label: <em>Alpha</em> }]}
        />,
      ),
    ).toThrow(/non-string-label-without-text/);
  });

  it("accepts a rich label that supplies textLabel", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        items={[{ value: "a", label: <em>Alpha</em>, textLabel: "Alpha" }]}
      />,
    );
    expect(screen.getByRole("tab")).toBeInTheDocument();
  });

  it("rejects both value and defaultValue", () => {
    expect(() =>
      render(<Tabs as="tabs" aria-label="Docs" value="a" defaultValue="b" items={items} />),
    ).toThrow(/controlled-and-uncontrolled/);
  });

  it("reports exactly one error object, not an AggregateError with no message", () => {
    // Two components validating the same problem produced an AggregateError
    // whose message was the empty string — all the explanation, none of it
    // reachable.
    let caught: unknown;
    try {
      render(<Tabs as="tabs" aria-label="Docs" defaultValue="a" items={items} overflow="wrap" />);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(String((caught as Error).message)).toMatch(/wrap-outside-radiogroup/);
  });
});
