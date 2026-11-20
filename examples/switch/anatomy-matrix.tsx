import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

const COLUMNS = [
  { size: "large", checked: false },
  { size: "large", checked: true },
  { size: "default", checked: false },
  { size: "default", checked: true },
] as const;

const ROWS = [
  { key: "plain", label: "plain", props: {} },
  {
    key: "labelled",
    label: "labelled track",
    props: { appearance: "labeled" as const, stateLabels: "active-inactive" as const },
  },
  { key: "readonly", label: "read-only", props: { readOnly: true } },
  { key: "disabled", label: "disabled", props: { disabled: true } },
];

export default function AnatomyMatrixDemo() {
  return (
    <DemoSection>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse">
          <thead>
            <tr>
              <th className="w-24" />
              {COLUMNS.map((column) => (
                <th
                  key={`${column.size}-${String(column.checked)}`}
                  className="px-3 pb-2 text-xs font-medium text-[var(--zb-text-muted)]"
                >
                  {column.size} · {column.checked ? "on" : "off"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th className="py-4 pr-3 text-left align-middle text-xs font-medium text-[var(--zb-text-muted)]">
                  {row.label}
                </th>
                {COLUMNS.map((column) => (
                  <td
                    key={`${row.key}-${column.size}-${String(column.checked)}`}
                    className="px-3 py-4"
                  >
                    <Switch
                      label="Label"
                      size={column.size}
                      checked={column.checked}
                      showState={false}
                      {...row.props}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoSection>
  );
}
