/**
 * Timeline — the primitive.
 *
 * Two things are asserted here that a rendering test would not reach: that the
 * markup is the one a screen reader needs, and that the antd surface behaves
 * the way an antd call site expects. The parity of the *type* surface is a
 * separate file (`test/timeline-parity.test.ts`), because that one reads antd
 * itself and fails when antd renames something.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { itMeetsTheContract } from "../../../test/contract";
import { Timeline } from "./timeline";

const ITEMS = [
  { key: "a", title: "0.2.0", content: "Signature and Identity." },
  { key: "b", title: "0.1.0", content: "Five loaders." },
];

itMeetsTheContract("Timeline", () => <Timeline aria-label="Release history" items={ITEMS} />);

describe("markup a screen reader can use", () => {
  it("is an ordered list, because a chronology is ordered", () => {
    render(<Timeline aria-label="Release history" items={ITEMS} />);
    const list = screen.getByRole("list", { name: "Release history" });
    expect(list.tagName).toBe("OL");
  });

  it("states role=list, which Safari removes when list-style is none", () => {
    // Not redundant in practice: Safari drops list semantics from a list with
    // list-style: none, and VoiceOver then announces neither the list nor its
    // item count. A future cleanup that deletes this attribute should have to
    // delete this test on purpose.
    render(<Timeline aria-label="Release history" items={ITEMS} />);
    expect(screen.getByRole("list").getAttribute("role")).toBe("list");
  });

  it("names the list, which antd offers no way to do", () => {
    render(<Timeline aria-labelledby="heading" items={ITEMS} />);
    expect(screen.getByRole("list").getAttribute("aria-labelledby")).toBe("heading");
  });

  it("claims no arrow keys, because browse mode reads a list with them", () => {
    const { container } = render(<Timeline aria-label="Release history" items={ITEMS} />);
    expect(container.querySelectorAll("[tabindex]")).toHaveLength(0);
    expect(container.querySelector("[role='listitem'][tabindex]")).toBeNull();
  });
});

describe("Ant Design v6 parity, in behaviour", () => {
  it("resolves an unset mode to start, as antd 6.6.0's source does", () => {
    // The documentation table says `end`. The source falls back to `'start'`.
    // This follows the source; timeline-parity.test.ts pins the discrepancy.
    const { container } = render(<Timeline aria-label="t" items={ITEMS} />);
    expect(container.querySelector("ol")?.className).toContain("ox-timeline--start");
  });

  it("treats v5's left and right as v6's start and end", () => {
    const { container, rerender } = render(<Timeline aria-label="t" mode="left" items={ITEMS} />);
    expect(container.querySelector("ol")?.className).toContain("ox-timeline--start");
    rerender(<Timeline aria-label="t" mode="right" items={ITEMS} />);
    expect(container.querySelector("ol")?.className).toContain("ox-timeline--end");
  });

  it("accepts the v5 item spellings alongside the v6 ones", () => {
    render(
      <Timeline
        aria-label="t"
        items={[{ key: "a", label: "Title", children: "Body", dot: <span>●</span> }]}
      />,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("reads <Timeline.Item> children into the same tree as items", () => {
    render(
      <Timeline aria-label="t">
        <Timeline.Item key="a" title="From children" content="Body" />
      </Timeline>,
    );
    expect(screen.getByText("From children")).toBeInTheDocument();
  });

  it("reverses without inventing a current step", () => {
    // antd hardcodes current to the last item and dots that item's rail. With
    // reverse the dot lands on the oldest event in the chart. There is no
    // current here, so reversing only reverses.
    const { container } = render(<Timeline aria-label="t" reverse items={ITEMS} />);
    expect(container.querySelectorAll("li")[0]?.textContent).toContain("0.1.0");
    expect(container.querySelector("[data-loading]")).toBeNull();
  });

  it("appends a pending item, the way v5 asked for one", () => {
    render(<Timeline aria-label="t" items={ITEMS} pending="Loading more" />);
    expect(screen.getByText("Loading more")).toBeInTheDocument();
  });

  it("maps the four preset colours to semantic tokens, not palette values", () => {
    // A component reaching past --ox-status-critical to a hex would ignore
    // every brand override, which is the rule the token lint enforces
    // elsewhere and this is its one place in a props API.
    const { container } = render(
      <Timeline aria-label="t" items={[{ key: "a", title: "x", color: "red" }]} />,
    );
    expect(container.querySelector<HTMLElement>(".ox-timeline__node")?.style.color).toContain(
      "--ox-status-critical",
    );
  });

  it("passes an unrecognised colour through untouched", () => {
    const { container } = render(
      <Timeline aria-label="t" items={[{ key: "a", title: "x", color: "#123456" }]} />,
    );
    expect(container.querySelector<HTMLElement>(".ox-timeline__node")?.style.color).toBe(
      "rgb(18, 52, 86)",
    );
  });

  it("exposes antd's semantic slots for classNames and styles", () => {
    const { container } = render(
      <Timeline
        aria-label="t"
        items={ITEMS}
        classNames={{ root: "custom-root", itemTitle: "custom-title" }}
        styles={{ itemIcon: { opacity: 0.5 } }}
      />,
    );
    expect(container.querySelector(".custom-root")).not.toBeNull();
    expect(container.querySelector(".custom-title")).not.toBeNull();
    expect(container.querySelector<HTMLElement>(".ox-timeline__node")?.style.opacity).toBe("0.5");
  });

  it("rebuilds the whole class table when a caller supplies prefixCls", () => {
    // antd's escape hatch, and it has to reach every part rather than only the
    // root — a half-renamed tree is a component that renders unstyled in the
    // one configuration nobody tests.
    const { container } = render(<Timeline aria-label="t" items={ITEMS} prefixCls="my-tl" />);
    expect(container.querySelector(".my-tl")).not.toBeNull();
    expect(container.querySelector(".my-tl__item")).not.toBeNull();
    expect(container.querySelector(".my-tl__node")).not.toBeNull();
    expect(container.querySelector(".my-tl__title")).not.toBeNull();
    expect(container.querySelector(".ox-timeline__item")).toBeNull();
  });

  it("accepts titleSpan as a length as well as a ratio", () => {
    const { container } = render(<Timeline aria-label="t" items={ITEMS} titleSpan="12rem" />);
    expect(container.querySelector("ol")?.getAttribute("style")).toContain("12rem");
  });

  it("merges root styles from the slot table and the style prop", () => {
    const { container } = render(
      <Timeline
        aria-label="t"
        items={ITEMS}
        styles={{ root: { gap: "2rem" } }}
        style={{ opacity: 0.9 }}
      />,
    );
    const style = container.querySelector<HTMLElement>("ol")?.style;
    expect(style?.gap).toBe("2rem");
    expect(style?.opacity).toBe("0.9");
  });

  it("takes a bare pending flag as well as a pending node", () => {
    // v5 accepted `pending` as a boolean and as content. Both still work.
    const { container } = render(<Timeline aria-label="t" items={ITEMS} pending />);
    expect(container.querySelectorAll("li")).toHaveLength(3);
    expect(container.querySelector("[data-loading]")).not.toBeNull();
  });

  it("keeps an item's own className and per-slot overrides", () => {
    const { container } = render(
      <Timeline
        aria-label="t"
        items={[
          {
            key: "a",
            title: "x",
            className: "mine",
            classNames: { itemTitle: "my-title" },
            styles: { itemContent: { color: "red" } },
            content: "body",
          },
        ]}
      />,
    );
    expect(container.querySelector("li.mine")).not.toBeNull();
    expect(container.querySelector(".my-title")).not.toBeNull();
    expect(container.querySelector<HTMLElement>(".ox-timeline__content")?.style.color).toBe("red");
  });

  it("survives a child that is not an element", () => {
    // `{condition && <Timeline.Item/>}` puts `false` in the children list, and
    // a chronology that throws on it is a chronology nobody can render
    // conditionally.
    const { container } = render(
      <Timeline aria-label="t">
        {false}
        {"text"}
        <Timeline.Item key="a" title="Real" />
      </Timeline>,
    );
    expect(container.querySelectorAll("li")).toHaveLength(1);
  });

  it("reads both halves of v5's position vocabulary", () => {
    const { container } = render(
      <Timeline
        aria-label="t"
        mode="alternate"
        items={[
          { key: "a", title: "left", position: "left" },
          { key: "b", title: "right", position: "right" },
          { key: "c", title: "end", position: "end" },
        ]}
      />,
    );
    const items = [...container.querySelectorAll("li")];
    expect(items[0]?.className).toContain("ox-timeline__item--start");
    expect(items[1]?.className).toContain("ox-timeline__item--end");
    expect(items[2]?.className).toContain("ox-timeline__item--end");
  });

  it("prefers v6's placement over v5's position when both are given", () => {
    const { container } = render(
      <Timeline
        aria-label="t"
        mode="alternate"
        items={[{ key: "a", title: "x", placement: "start", position: "right" }]}
      />,
    );
    expect(container.querySelector("li")?.className).toContain("ox-timeline__item--start");
  });

  it("falls back to the index when neither the element nor the props carry a key", () => {
    // React would warn on a keyless list and the warning is the only symptom;
    // a chronology rendered from a map has to be keyable either way.
    const { container } = render(
      <Timeline aria-label="t" items={[{ title: "one" }, { title: "two" }]} />,
    );
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("takes an item key off the props when the element has none", () => {
    const { container } = render(
      <Timeline aria-label="t">
        <Timeline.Item title="one" />
        <Timeline.Item title="two" />
      </Timeline>,
    );
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("renders nothing for a Timeline.Item used outside a Timeline", () => {
    // antd's own Item is a no-op whose props the parent harvests. Rendering it
    // directly has to be harmless rather than an error.
    const { container } = render(<Timeline.Item title="Orphan" />);
    expect(container.textContent).toBe("");
  });

  it("sets titleSpan as a custom property rather than a hardcoded width", () => {
    const { container } = render(<Timeline aria-label="t" items={ITEMS} titleSpan={8} />);
    expect(container.querySelector("ol")?.getAttribute("style")).toContain(
      "--ox-timeline-title-span",
    );
  });
});
