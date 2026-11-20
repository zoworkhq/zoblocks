import { ClinicalStatus } from "@/components/zoblocks/clinical-status";
import { results } from "./_shared/observations";

export default function GridAffix() {
  return (
    <table className="border-collapse text-[13px]">
      <tbody>
        {results.map((row) => (
          <tr key={row.analyte} className="border-b border-black/10 last:border-0">
            <td className="py-1.5 pr-4 opacity-70">{row.analyte}</td>
            <td className="py-1.5 pr-4 font-mono tabular-nums">{row.value}</td>
            <td className="py-1.5">
              <ClinicalStatus
                scale="result-status"
                step={row.status}
                shape="affix"
                density="compact"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
