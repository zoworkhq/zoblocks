import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { itemsByIds, priceLabel } from "@/lib/market/catalogue";
import { heldIncludingRevoked } from "@/lib/market/entitlements";
import { EmptyState, PageHeader, Panel, StatusChip, buttonClasses } from "@/components/ui";

export const metadata = { title: "Purchases" };

/**
 * What this organisation owns, and what it paid.
 *
 * Withdrawn entitlements are listed rather than hidden, with the reason. A
 * purchase that silently disappears from this screen is indistinguishable from
 * one that never happened — and the question a customer actually arrives with
 * after a refund is "what happened to the pack we bought", which a missing row
 * cannot answer.
 *
 * Receipts live here rather than in the buyer's inbox, because the purchase
 * belongs to the organisation. A designer who has left still bought it.
 */
export default async function PurchasesPage() {
  const member = await requireMember();
  const data = scoped(member.orgId);

  const entitlements = await heldIncludingRevoked(member.orgId);
  const items = await itemsByIds(entitlements.map((e) => e.itemId));
  const byId = new Map(items.map((item) => [item._id.toHexString(), item]));

  const orders = await data.orders.find().sort({ createdAt: -1 }).toArray();

  if (entitlements.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Marketplace" title="Purchases" />
        <EmptyState
          title="Nothing bought yet"
          body="Packs bought here belong to the whole organisation and stay bought. Anything included in an engagement is granted directly and appears here too."
          actions={
            <Link href="/market" className={buttonClasses({ variant: "primary", size: "sm" })}>
              Open the catalogue
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Purchases"
        lede="Owned by the organisation. A person leaving does not take a pack with them."
      />

      <Panel className="mt-6" title="Entitlements" padded={false}>
        <ul className="divide-y divide-rule">
          {entitlements.map((entitlement) => {
            const item = byId.get(entitlement.itemId.toHexString());
            const contract = entitlement.grantedVia.startsWith("contract:");

            return (
              <li key={String(entitlement._id)} className="flex flex-wrap gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {item ? (
                      <Link
                        href={`/market/${item.slug}`}
                        className="font-medium hover:text-brand-deep"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-graphite">
                        Withdrawn from the catalogue
                      </span>
                    )}
                    {entitlement.revokedAt ? (
                      <StatusChip tone="fail">Withdrawn</StatusChip>
                    ) : (
                      <StatusChip tone="pass">Live</StatusChip>
                    )}
                    {contract && <StatusChip tone="accent">Contract</StatusChip>}
                  </div>
                  <p className="body-xs mt-0.5 text-graphite-soft">
                    Granted {entitlement.grantedAt.toISOString().slice(0, 10)} · version line{" "}
                    {entitlement.versionLine} ·{" "}
                    {contract
                      ? entitlement.grantedVia.slice("contract:".length)
                      : `order ${entitlement.grantedVia.slice(0, 20)}…`}
                    {entitlement.revokedAt &&
                      ` · withdrawn ${entitlement.revokedAt.toISOString().slice(0, 10)} (${entitlement.revokedReason ?? "no reason recorded"})`}
                  </p>
                </div>

                {item && !entitlement.revokedAt && (
                  <a
                    href={`/m/${item.slug}/pack.zip`}
                    className={buttonClasses({ variant: "secondary", size: "sm" })}
                  >
                    Download
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      {orders.length > 0 && (
        <Panel
          className="mt-4"
          title="Payments"
          description="Every checkout, including the ones nobody completed — a run of expired orders is a pricing or tax surprise rather than a bug."
          padded={false}
        >
          <ul className="divide-y divide-rule">
            {orders.map((order) => (
              <li key={order._id} className="flex flex-wrap items-baseline gap-3 px-4 py-2.5">
                <span className="tabular font-mono text-[0.75rem] text-graphite">
                  {order.createdAt.toISOString().slice(0, 10)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.8125rem]">
                  {order.items.join(", ")}
                </span>
                <span className="tabular font-mono text-[0.8125rem]">
                  {order.amountMinor === null || order.currency === null
                    ? "—"
                    : priceLabel({ priceMinor: order.amountMinor, currency: order.currency })}
                </span>
                <StatusChip
                  tone={
                    order.status === "paid"
                      ? "pass"
                      : order.status === "refunded"
                        ? "fail"
                        : order.status === "expired"
                          ? "neutral"
                          : "warn"
                  }
                >
                  {order.status}
                </StatusChip>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
