import { Tabs } from "@zoblocks/tabs";

const THEMES = ["light", "dark", "high-contrast"] as const;
const DENSITIES = ["patient", "standard", "clinical"] as const;

export default function ThemeDensityExample() {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {THEMES.map((theme) =>
          DENSITIES.map((density) => (
            <div
              key={theme + density}
              data-zb-theme={theme}
              data-zb-density={density}
              className="min-w-0 space-y-4 rounded-xl border border-current/20 bg-[var(--zb-surface-raised)] p-4 text-[var(--zb-text)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold capitalize">{theme.replace("-", " ")}</h3>
                <span className="text-xs text-[var(--zb-text-muted)] capitalize">
                  {density} density
                </span>
              </div>

              <Tabs
                as="radiogroup"
                variant="segmented"
                aria-label="Scope"
                defaultValue="personal"
                items={[
                  { value: "personal", label: "Personal" },
                  { value: "shared", label: "Shared" },
                ]}
              />

              <Tabs
                as="tabs"
                variant="underline"
                aria-label="Results"
                defaultValue="labs"
                items={[
                  {
                    value: "labs",
                    label: "Labs",
                    count: 2,
                    tone: "critical",
                  },
                  { value: "meds", label: "Meds", count: 9 },
                ]}
              />
            </div>
          )),
        )}
      </div>
    </section>
  );
}
