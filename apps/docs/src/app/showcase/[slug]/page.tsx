import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BLOCKS, getBlock } from "@/lib/blocks";
import { getComponent } from "@/lib/catalog";
import { isReady } from "@/lib/readiness";
import { BlockBody } from "@/components/blocks";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";

/**
 * A block at its own address.
 *
 * The gallery's overlay is a convenience; this is the thing it is a
 * convenience for. Statically generated, so a block can be linked in a
 * proposal or a ticket and still be there when someone opens it.
 */

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const block = getBlock(slug);
  if (!block) return {};
  return {
    title: `${block.title} — ZoBlocks blocks`,
    description: block.blurb,
    alternates: { canonical: `/showcase/${block.slug}` },
  };
}

export default async function BlockPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const block = getBlock(slug);
  if (!block) notFound();

  return (
    <RevealRoot>
      <SiteHeader />
      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
            <Link
              href="/showcase"
              className="inline-flex items-center gap-2 text-sm text-graphite transition-colors hover:text-ink"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              All blocks
            </Link>
            <p className="numeric mt-6 text-xs text-brand-deep">{block.slug}</p>
            <h1 className="display-sm mt-2 text-balance">{block.title}</h1>
            <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-graphite">
              {block.blurb}
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {block.uses.map((item) =>
                // A link only where a page exists. Being in the catalogue is not
                // enough: `timeline`, `chart-accordion` and `clinical-note` are,
                // and all three links returned 404.
                getComponent(item) && isReady(item) ? (
                  <Link
                    key={item}
                    href={`/components/${item}`}
                    className="numeric rounded-md border border-rule px-2 py-1 text-[0.6875rem] text-graphite transition-colors hover:border-brand/40 hover:text-brand-deep"
                  >
                    {item}
                  </Link>
                ) : (
                  <span
                    key={item}
                    className="numeric rounded-md border border-dashed border-rule px-2 py-1 text-[0.6875rem] text-graphite-soft"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="border-b border-rule bg-paper-sunk/40">
          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
            <div className="overflow-hidden rounded-2xl border border-rule bg-paper">
              <BlockBody slug={block.slug} />
            </div>
            <p className="mt-4 max-w-3xl border-l-2 border-brand/40 pl-4 text-sm leading-relaxed text-graphite">
              <span className="font-medium text-ink">What to look at: </span>
              {block.demonstrates}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </RevealRoot>
  );
}
