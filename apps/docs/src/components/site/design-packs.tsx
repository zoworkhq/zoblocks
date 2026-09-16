import type { CSSProperties } from "react";
import { MarketScene } from "@/components/site/market-scenes";
import { COLLECTION, type CollectionEntry } from "@/lib/market-collection";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The design packs, one card each. Styles in `app/marketplace.css`.
 *
 * Cards do not link: while nothing can be bought, a detail page says nothing a
 * card does not. No price and no status either — the section says it once.
 */
export function DesignPacks() {
  return (
    <ul className="zbm-grid">
      {COLLECTION.map((entry, index) => (
        <PackCard key={entry.slug} entry={entry} index={index} />
      ))}
    </ul>
  );
}

function PackCard({ entry, index }: { entry: CollectionEntry; index: number }) {
  return (
    <li data-span={entry.span}>
      <article
        id={`pack-${entry.slug}`}
        className="zbm-card"
        data-span={entry.span}
        data-zb-pack={entry.slug}
        data-reveal
        style={{ "--reveal-delay": `${(index % 2) * 80}ms` } as CSSProperties}
      >
        <div
          className="zbm-stage"
          data-zb-pack-preview={entry.scene}
          role="img"
          aria-label={entry.preview}
        >
          <MarketScene scene={entry.scene} />
        </div>

        <div className="zbm-meta">
          <p className="zbm-kicker">
            <span className="zbm-kicker-n">{pad(index + 1)}</span>
            {entry.kind}
          </p>
          <h3 className="zbm-name">{entry.name}</h3>
          <p className="zbm-blurb">{entry.blurb}</p>
          <ul className="zbm-tags" aria-label="Includes">
            {entry.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </article>
    </li>
  );
}
