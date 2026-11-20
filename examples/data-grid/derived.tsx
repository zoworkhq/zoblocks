import { useState } from "react";
import type { GridSort } from "@/lib/zoblocks-grid";
import { CASELOAD, DemoGrid, Example } from "./_shared/shared";

export default function SortingByAModel() {
  const [sort, setSort] = useState<GridSort | null>({ key: "risk", direction: "descending" });
  return (
    <Example>
      <DemoGrid rows={CASELOAD} sort={sort} onSortChange={setSort} />
    </Example>
  );
}
