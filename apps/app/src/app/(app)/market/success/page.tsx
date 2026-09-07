import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { fulfil } from "@/lib/market/fulfil";
import { itemBySlug } from "@/lib/market/catalogue";
import { Callout, PageHeader, Panel, buttonClasses } from "@/components/ui";

export const metadata = { title: "Purchase" };

/**
 * Where Stripe sends the customer back.
 *
 * This page **fulfils**, calling exactly the same function the webhook calls.
 * That is Stripe's recommended shape and it is not redundancy: the webhook is
 * what guarantees fulfilment happens for every payment — a customer can pay
 * and lose their connection before this page loads — while this call is what
 * makes it immediate for the customer who is standing right here. Doing only
 * the first means watching a spinner; doing only the second means the
 * customers who close the tab never receive what they paid for.
 *
 * Safe to do both because `fulfil` claims the order with one atomic write. One
 * caller wins, the other is told it already happened, and neither produces a
 * second entitlement.
 */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const member = await requireMember();

  if (!sessionId) {
    return (
      <>
        <PageHeader eyebrow="Marketplace" title="Purchase" />
        <Callout tone="warn" title="No checkout session in the link.">
          Open Purchases to see what this organisation owns.
        </Callout>
      </>
    );
  }

  /*
   * A failure here is not a failed purchase.
   *
   * Stripe has the money either way, and the webhook will deliver. So a
   * network blip talking to Stripe from this render must produce "we are
   * finishing this off", never "something went wrong" — which would send a
   * customer who has just paid to support.
   */
  let outcome;
  try {
    outcome = await fulfil(sessionId);
  } catch {
    outcome = undefined;
  }

  const items = outcome
    ? (
        await Promise.all(outcome.granted.map((slug) => itemBySlug(slug).catch(() => undefined)))
      ).filter((item) => item !== undefined)
    : [];

  const settled = outcome?.reason === "granted" || outcome?.reason === "already";

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title={settled ? "Thank you — it is yours" : "We are finishing this off"}
        lede={
          settled
            ? "The purchase belongs to your organisation, permanently. Nothing is live until a theme is published."
            : undefined
        }
      />

      {outcome?.reason === "unpaid" && (
        <Callout tone="info" className="mt-4" title="Payment is still settling.">
          Bank transfers and direct debits complete after checkout rather than during it. The
          purchase appears under Purchases as soon as the funds clear — you do not need to do
          anything, and you will not be charged twice if you close this page.
        </Callout>
      )}

      {outcome?.reason === "underpaid" && (
        <Callout tone="warn" className="mt-4" title="This one needs a person.">
          The amount taken is below the catalogue price, which means a price is misconfigured on our
          side rather than anything you did. The order is recorded and we will sort it out.
        </Callout>
      )}

      {!outcome && (
        <Callout tone="info" className="mt-4" title="Your payment went through.">
          We could not confirm delivery from this page, which is a hiccup on our side rather than a
          problem with the payment. It will appear under Purchases within a minute.
        </Callout>
      )}

      {settled && (
        <Panel className="mt-4" title="What you now own">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.slug}>
                <Link href={`/market/${item.slug}`} className="font-medium hover:text-brand-deep">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`/market/${item.slug}`}
                className={buttonClasses({ variant: "primary", size: "sm" })}
              >
                Install {item.title}
              </Link>
            ))}
            <Link
              href="/market/purchases"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              All purchases
            </Link>
          </div>
        </Panel>
      )}

      <p className="body-xs mt-4 text-graphite-soft">
        Signed in as {member.email}. A receipt is on the Purchases screen rather than only in your
        inbox, because the purchase belongs to the organisation.
      </p>
    </>
  );
}
