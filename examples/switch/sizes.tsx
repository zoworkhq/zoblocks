import DemoSection from "./_shared/DemoSection";
import { Switch } from "@/components/zoblocks/switch";

const ROWS = [
  { bed: "12", who: "A. Lovelace", npo: true, falls: false },
  { bed: "13", who: "G. Hopper", npo: false, falls: true },
];

export default function FlowsheetToPhoneDemo() {
  return (
    <DemoSection>
      <div className="overflow-hidden rounded-lg border border-[var(--zb-border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--zb-border)] text-start">
              <th className="px-3 py-2 font-medium">Bed</th>
              <th className="px-3 py-2 font-medium">Patient</th>
              <th className="px-3 py-2 font-medium">NPO</th>
              <th className="px-3 py-2 font-medium">Falls</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.bed} className="border-b border-[var(--zb-border)] last:border-0">
                <td className="px-3 py-2">{row.bed}</td>
                <td className="px-3 py-2">{row.who}</td>
                <td className="px-3 py-2">
                  <Switch
                    size="micro"
                    tone="caution"
                    checked={row.npo}
                    showState={false}
                    aria-label={`Nil by mouth — ${row.who}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <Switch
                    size="micro"
                    checked={row.falls}
                    showState={false}
                    aria-label={`Falls risk — ${row.who}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Switch
        label="Share my records with my GP"
        description="Your GP surgery can see your hospital notes. You can change this at any time, and it will not affect your care."
        appearance="row"
        audience="patient"
        checked
      />
    </DemoSection>
  );
}
