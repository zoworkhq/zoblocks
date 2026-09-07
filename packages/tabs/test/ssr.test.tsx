/**
 * Server rendering.
 *
 * The brief claims the strip is correct before hydration, and that claim is
 * worth a test rather than a sentence: the registry is filled by a layout
 * effect, which never runs on the server, so anything derived from it is
 * absent in the server HTML. Two things must survive that anyway — the roving
 * tab stop and the painted selection — or a keyboard user who reaches the page
 * before the JavaScript lands has a strip with no entry point and no visible
 * selected tab.
 *
 * `renderToString` also exercises the `typeof window === "undefined"` guards
 * for real, rather than by faking a global.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Tabs } from "../src/index.js";

const items = [
  { value: "personal", label: "Personal", children: <p>Personal panel</p> },
  { value: "shared", label: "Shared", count: 6, children: <p>Shared panel</p> },
];

function serverHtml(ui: React.ReactElement): string {
  return renderToString(ui);
}

describe("server-rendered markup", () => {
  it("renders without touching window", () => {
    const html = serverHtml(
      <Tabs
        as="tabs"
        variant="segmented"
        aria-label="Document scope"
        defaultValue="personal"
        items={items}
      />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Document scope"');
    expect(html).toContain('role="tab"');
  });

  it("marks the selected tab, so selection is visible before hydration", () => {
    const html = serverHtml(
      <Tabs as="tabs" aria-label="Docs" defaultValue="shared" items={items} />,
    );
    // `data-zb-selected` is what the stylesheet paints against while
    // `:not([data-zb-measured])` holds the animated indicator back.
    expect(html).toMatch(/data-zb-value="shared"[^>]*data-zb-selected="true"/);
  });

  it("emits exactly one tab stop in the strip", () => {
    const html = serverHtml(
      <Tabs as="tabs" aria-label="Docs" defaultValue="shared" items={items} />,
    );
    // Count only within triggers — the panel legitimately carries its own
    // tabindex="0" when it has no focusable content. Without this the whole
    // strip would be tabindex="-1" until hydration: an unreachable control on
    // a slow connection.
    const triggerStops = (html.match(/role="tab"[^>]*tabindex="0"/g) ?? []).length;
    expect(triggerStops).toBe(1);
  });

  it("does not mark the list measured, so the indicator stays hidden until it is placed", () => {
    const html = serverHtml(
      <Tabs
        as="tabs"
        variant="underline"
        aria-label="Docs"
        defaultValue="personal"
        items={items}
      />,
    );
    expect(html).not.toContain("data-zb-measured");
  });

  it("carries the announced count into the server HTML", () => {
    const html = serverHtml(
      <Tabs as="tabs" aria-label="Docs" defaultValue="personal" items={items} />,
    );
    expect(html).toContain("Shared, 6 items");
  });

  it("renders real anchors in nav mode", () => {
    const html = serverHtml(
      <Tabs
        as="nav"
        aria-label="Settings"
        defaultValue="account"
        items={[
          { value: "account", label: "Account", href: "/account" },
          { value: "billing", label: "Billing", href: "/billing" },
        ]}
      />,
    );
    expect(html).toContain("<nav");
    expect(html).toContain('href="/account"');
    expect(html).toContain('aria-current="page"');
  });

  it("renders a radiogroup with aria-checked", () => {
    const html = serverHtml(
      <Tabs
        as="radiogroup"
        aria-label="Range"
        defaultValue="7d"
        items={[
          { value: "7d", label: "7 days" },
          { value: "30d", label: "30 days" },
        ]}
      />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-checked="true"');
  });

  it("renders the selected panel and omits the others", () => {
    const html = serverHtml(
      <Tabs as="tabs" aria-label="Docs" defaultValue="personal" items={items} />,
    );
    expect(html).toContain("Personal panel");
    expect(html).not.toContain("Shared panel");
  });

  it("omits aria-controls, because the panel id is not resolvable yet", () => {
    // The panel registry is populated by an effect. Pointing at an element
    // that the server HTML cannot guarantee exists would be a dangling
    // reference — worse than none.
    const html = serverHtml(
      <Tabs as="tabs" aria-label="Docs" defaultValue="personal" items={items} />,
    );
    expect(html).not.toContain("aria-controls");
  });

  it("survives syncTo with no window to read", () => {
    expect(() =>
      serverHtml(
        <Tabs as="tabs" aria-label="Docs" defaultValue="personal" items={items} syncTo="hash" />,
      ),
    ).not.toThrow();
  });

  it("still refuses an invalid configuration on the server", () => {
    // A tablist of links must not be something that only fails in the browser.
    expect(() =>
      serverHtml(
        <Tabs
          as="tabs"
          aria-label="Docs"
          defaultValue="a"
          items={[{ value: "a", label: "Alpha", href: "/a" }]}
        />,
      ),
    ).toThrow(/href-without-nav/);
  });

  it("refuses a missing mode on the server too", () => {
    expect(() =>
      // @ts-expect-error deliberately omitting the required prop
      serverHtml(<Tabs aria-label="Docs" defaultValue="personal" items={items} />),
    ).toThrow(/missing-mode/);
  });
});
