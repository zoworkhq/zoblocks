import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { COLLECTION } from "@/lib/market-collection";
import { CONSOLE_FEATURES, CONSOLE_ID, PACKS_ID, PREMIUM_HREF } from "@/lib/premium";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { DesignPacks } from "@/components/site/design-packs";
import { NOTIFY_PREMIUM, NotifyDialog } from "@/components/site/notify-dialog";
import { ProConsole } from "@/components/site/pro-console";
import { ZoworkDesk } from "@/components/site/zowork-desk";

export const metadata: Metadata = {
  title: "Premium — theming console and design packs",
  description:
    "ZoBlocks Premium: a theming console with a contrast gate and versioned stylesheets, and " +
    "design packs for clinical software. Coming soon; the open-source components are available now.",
  alternates: { canonical: PREMIUM_HREF },
};

/**
 * Premium: what was `/pro` and `/marketplace`, on one page (16 Sep 2026).
 *
 * Order: hero with a contents list, the theming console, the design packs,
 * the free library, then Zowork. Every tile from the old Pro page and every
 * pack from the old marketplace is here; `e2e/pro.spec.ts` and
 * `e2e/docs-site.spec.ts` hold both.
 *
 * Rules carried over from both pages:
 *
 * - The status is the `h1` and the eyebrow names the product.
 * - The shop being closed is said once, in the packs section, never on a card.
 * - The notify dialog posts to `/api/notify` and never swallows an address.
 * - Colours are site tokens, so light, dark and high contrast all work.
 *
 * `app/pro/console-page.tsx` is the full console pitch for when it ships;
 * render it from here to restore it.
 */
export default function PremiumPage() {
  const groups = [
    { id: CONSOLE_ID, n: "01", title: "Theming console", items: CONSOLE_FEATURES },
    { id: PACKS_ID, n: "02", title: "Design packs", items: COLLECTION.map((entry) => entry.name) },
  ];

  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main" className="pro zbm">
        <section className="border-b border-rule">
          <div className="section-major mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center">
            <div>
              <p className="eyebrow eyebrow-rule text-brand-deep" data-reveal>
                ZoBlocks Premium
              </p>
              <h1 className="display-lg mt-5 text-balance" data-reveal>
                Coming soon
              </h1>
              <p className="body-lg mt-5 max-w-xl text-pretty text-ink" data-reveal>
                A theming console and design packs for clinical software.
              </p>
              <p className="mt-4 max-w-xl text-pretty text-graphite" data-reveal>
                The console is built and running, and the packs are in production. Premium is not in
                this release.
              </p>

              <div className="mt-8 flex flex-wrap gap-3" data-reveal>
                <NotifyDialog topic={NOTIFY_PREMIUM} className="proCta">
                  Notify me at launch
                </NotifyDialog>
                <Link href="/components" className="proGhost">
                  View components
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>

            <nav aria-label="What Premium includes" className="zbm-contents" data-reveal>
              {groups.map((group) => (
                <div key={group.id} className="zbm-contents-group">
                  <a href={`#${group.id}`} className="zbm-contents-head">
                    <span className="zbm-contents-n">{group.n}</span>
                    <span className="zbm-contents-title">{group.title}</span>
                    <span className="zbm-contents-count">{group.items.length}</span>
                    <ArrowDown aria-hidden="true" className="zbm-contents-arrow size-4" />
                  </a>
                  <ul className="zbm-contents-list">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </section>

        <section id={CONSOLE_ID} className="zbm-part" aria-labelledby="premium-console">
          <PartHead
            n="01"
            id="premium-console"
            title="Theming console"
            count={`${CONSOLE_FEATURES.length} features`}
          >
            Set a brand colour, check contrast before release, and publish a versioned stylesheet.
          </PartHead>
          <div className="proWrap">
            <ProConsole />
          </div>
        </section>

        <section id={PACKS_ID} className="zbm-part" aria-labelledby="premium-packs">
          <PartHead
            n="02"
            id="premium-packs"
            title="Design packs"
            count={`${COLLECTION.length} packs`}
          >
            Illustrations, icons, a design system and a Figma kit, licensed to your organisation.
            Purchasing opens with the ZoBlocks console.
          </PartHead>
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="mt-1 text-pretty text-sm text-graphite-soft" data-reveal>
              No pack has been reviewed by a registered clinician yet.
            </p>
            <div className="mt-6">
              <DesignPacks />
            </div>
          </div>
        </section>

        <section className="proNowBand">
          <div className="proNow">
            <div>
              <p className="proNowHead">The component library is available now</p>
              <p className="proNowBody">
                {CATALOG.length} components, MIT licensed, installed as source into your repository.
                No account and no card.
              </p>
            </div>
            <Link href="/components" className="proNowLink">
              Browse components
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </section>

        <ZoworkDesk />
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}

function PartHead({
  n,
  id,
  title,
  count,
  children,
}: {
  n: string;
  id: string;
  title: string;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <div className="zbm-part-head mx-auto max-w-6xl px-5 sm:px-8">
      <p className="zbm-part-n" data-reveal>
        {n}
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-3" data-reveal>
        <h2 id={id} className="display-sm">
          {title}
        </h2>
        <p className="numeric text-xs text-graphite-soft">{count}</p>
      </div>
      <p className="body-sm mt-2 max-w-2xl text-pretty text-graphite" data-reveal>
        {children}
      </p>
    </div>
  );
}
