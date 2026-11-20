import { Tabs } from "@zoblocks/tabs";

function OrderPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
      <p className="text-sm">{children}</p>
    </div>
  );
}

export default function UnderlineVariantExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        variant="underline"
        aria-label="Order"
        defaultValue="summary"
        items={[
          {
            value: "summary",
            label: "Summary",
            children: (
              <OrderPanel>
                <strong>Summary</strong> — Order #4471, placed 12 Aug.
              </OrderPanel>
            ),
          },
          {
            value: "lines",
            label: "Line items",
            count: 24,
            children: (
              <OrderPanel>
                <strong>Line items</strong> — 24 rows.
              </OrderPanel>
            ),
          },
          {
            value: "ship",
            label: "Shipments",
            count: 3,
            children: (
              <OrderPanel>
                <strong>Shipments</strong> — 3 in transit.
              </OrderPanel>
            ),
          },
          {
            value: "returns",
            label: "Returns",
            count: 1,
            tone: "high",
            children: (
              <OrderPanel>
                <strong>Returns</strong> — 1 open RMA.
              </OrderPanel>
            ),
          },
          {
            value: "invoices",
            label: "Invoices",
            children: (
              <OrderPanel>
                <strong>Invoices</strong>
              </OrderPanel>
            ),
          },
          {
            value: "audit",
            label: "Audit log",
            children: (
              <OrderPanel>
                <strong>Audit log</strong>
              </OrderPanel>
            ),
          },
        ]}
      />
    </section>
  );
}
