import { useState } from "react";
import { Tabs } from "@zoblocks/tabs";

export default function NavigationRealLinksExample() {
  const [currentSection, setCurrentSection] = useState("overview");

  return (
    <section className="space-y-4">
      <Tabs
        as="nav"
        variant="underline"
        aria-label="Project"
        value={currentSection}
        onChange={(value) => setCurrentSection(value)}
        onClick={(event) => {
          event.preventDefault();
        }}
        items={[
          { value: "overview", label: "Overview", href: "/project" },
          {
            value: "issues",
            label: "Issues",
            href: "/project/issues",
            count: 31,
          },
          {
            value: "pulls",
            label: "Pull requests",
            href: "/project/pulls",
            count: 7,
          },
          { value: "actions", label: "Actions", href: "/project/actions" },
          {
            value: "insights",
            label: "Insights",
            href: "/project/insights",
          },
        ]}
      />
    </section>
  );
}
