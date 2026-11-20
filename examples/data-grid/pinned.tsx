import { CASELOAD, DemoGrid, Example, WIDE_COLUMNS } from "./_shared/shared";

export default function PinnedIdentity() {
  return (
    <Example>
      <div className="min-w-0 max-w-3xl">
        <DemoGrid rows={CASELOAD} columns={WIDE_COLUMNS} pinnedColumns={1} maxHeight="18rem" />
      </div>
    </Example>
  );
}
