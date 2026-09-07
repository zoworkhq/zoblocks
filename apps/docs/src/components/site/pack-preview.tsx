/**
 * What is actually in the pack, drawn rather than described.
 *
 * The shelf used to be three lines of prose and a price. That is enough to
 * rank and not enough to decide: an empty-state system and an icon set read
 * identically as a paragraph, and the thing a buyer wants to know — does this
 * look like my product, and is it any good — is exactly the thing prose cannot
 * answer.
 *
 * Every preview here is the pack's own content or the pack's own manifest.
 * Nothing is drawn to represent something that does not exist:
 *
 *   Packs that ship artwork show it, at the size it is drawn and in
 *   `currentColor`, so it inherits the reader's theme the way it will inherit
 *   theirs.
 *
 *   Packs that ship code, tokens or data show their file manifest, because
 *   that is what they are. A mock of a component nobody has installed would be
 *   a picture of a promise.
 *
 *   Announced packs show a motif keyed to their slug and say what they are.
 *   They have no files and no measurements — inventing either for an unwritten
 *   pack is the one lie this product cannot afford.
 */

import type { ShelfItem } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Artwork                                                             */
/* ------------------------------------------------------------------ */

/**
 * The pack's own SVG, inlined.
 *
 * `dangerouslySetInnerHTML` on a string that came from this repository rather
 * than from a network response or a user — it is the pack's artwork, committed
 * beside this file. Rendering it as an `<img>` would lose `currentColor`, and
 * losing `currentColor` is losing the whole point: these are drawn to take the
 * host's ink rather than to carry their own.
 */
function PackArt({ art }: { art: ShelfItem["art"][number] }) {
  return (
    <figure className="flex min-w-0 flex-col items-center gap-1.5">
      <svg
        viewBox={art.viewBox}
        className="block h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth={art.viewBox.startsWith("0 0 24") ? 1.75 : 2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label={art.label}
        dangerouslySetInnerHTML={{ __html: art.body }}
      />
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Motifs                                                              */
/* ------------------------------------------------------------------ */

/** FNV-1a, so the same slug always draws the same mark. */
function seedOf(slug: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * A mark for a pack that has nothing to show yet.
 *
 * Keyed to the *kind* rather than to nothing: a reader scanning eighteen
 * announced packs learns something from the shape — a component is a stacked
 * panel, a theme is a ramp, fixtures are rows of data — and the eyebrow above
 * says the same thing in words. A uniform dot grid taught them only that
 * eighteen cards were unfinished.
 *
 * Deliberately abstract within that. An announced pack has no artwork, and a
 * motif that resembled artwork would be a sample of something nobody has drawn.
 */
function Motif({ slug, kind }: { slug: string; kind: ShelfItem["kind"] }) {
  const seed = seedOf(slug);
  const at = (i: number, span: number) => ((seed >>> (i * 3)) % span) + 1;

  const ink = "fill-current opacity-[0.14]";
  const lit = "fill-brand/35";

  if (kind === "theme") {
    // A ramp. Five steps, because a severity scale is the thing a theme pack
    // is bought for.
    return (
      <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <rect
            key={i}
            x={4 + i * 19}
            y={10}
            width={15}
            height={20}
            rx={3}
            className="fill-brand"
            opacity={0.12 + i * 0.13}
          />
        ))}
      </svg>
    );
  }

  if (kind === "icons") {
    return (
      <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={i}
            x={6 + (i % 5) * 19}
            y={4 + Math.floor(i / 5) * 18}
            width={13}
            height={13}
            rx={3.5}
            className={((seed >>> i) & 1) === 1 ? lit : ink}
          />
        ))}
      </svg>
    );
  }

  if (kind === "fixtures") {
    // Rows of a record, some fields present and some not — which is the whole
    // proposition of a messy-data pack.
    return (
      <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden="true">
        {Array.from({ length: 4 }, (_, row) => (
          <g key={row}>
            <rect x={4} y={5 + row * 9} width={10} height={4} rx={2} className={lit} />
            <rect
              x={18}
              y={5 + row * 9}
              width={30 + at(row, 40)}
              height={4}
              rx={2}
              className={ink}
            />
          </g>
        ))}
      </svg>
    );
  }

  if (kind === "illustration") {
    // A frame with something in it, and the something is left unsaid.
    return (
      <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden="true">
        <rect
          x={26}
          y={3}
          width={48}
          height={34}
          rx={4}
          className="fill-none stroke-current opacity-[0.22]"
          strokeWidth={1.5}
        />
        <circle cx={40} cy={16} r={4} className={lit} />
        <path
          d={`M32 32 L${44 + at(1, 6)} ${20 + at(2, 4)} L${56 + at(3, 6)} 32 Z`}
          className={ink}
        />
      </svg>
    );
  }

  // A component: a panel with a header and rows, at the density the slug picks.
  return (
    <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden="true">
      <rect x={4} y={4} width={40 + at(0, 20)} height={5} rx={2.5} className={lit} />
      {Array.from({ length: 3 }, (_, row) => (
        <rect
          key={row}
          x={4}
          y={15 + row * 8}
          width={60 + at(row + 1, 32)}
          height={4}
          rx={2}
          className={ink}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Manifest                                                            */
/* ------------------------------------------------------------------ */

/** The paths the pack ships, which for code and data packs is the product. */
function Manifest({ paths }: { paths: string[] }) {
  return (
    <ul className="flex w-full flex-col justify-center gap-1 font-mono text-[0.6875rem] leading-relaxed">
      {paths.slice(0, 5).map((path) => (
        <li key={path} className="flex items-baseline gap-1.5 text-graphite">
          <span aria-hidden="true" className="text-brand-deep">
            ·
          </span>
          <span className="truncate">{path}</span>
        </li>
      ))}
      {paths.length > 5 ? <li className="text-graphite-soft">+{paths.length - 5} more</li> : null}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* The preview                                                         */
/* ------------------------------------------------------------------ */

export function PackPreview({ item, className }: { item: ShelfItem; className?: string }) {
  const band = cn(
    "flex items-center justify-center overflow-hidden rounded-xl px-4 py-3",
    "component-preview-frame",
    className,
  );

  // Artwork, where the pack ships some. Three illustrations read as the
  // argument the flagship is making; six glyphs read as a set.
  if (item.art.length > 0) {
    const gallery = item.art.length > 3;
    return (
      <div className={cn(band, "text-ink")} style={{ height: 132 }} data-zb-pack-preview="art">
        <div
          className={cn(
            "grid h-full w-full place-items-center gap-3",
            gallery ? "grid-cols-6" : "grid-cols-3",
          )}
        >
          {item.art.map((art) => (
            <PackArt key={art.label} art={art} />
          ))}
        </div>
      </div>
    );
  }

  /*
   * A palette, shown as a palette.
   *
   * Its own hex values, at the steps the pack defines. A theme pack's README
   * is a description of the product; the ramp is the product, and it is the
   * one thing a buyer can judge in a second.
   */
  if (item.swatches.length > 0) {
    return (
      <div className={cn(band, "gap-0")} style={{ height: 132 }} data-zb-pack-preview="swatches">
        <ul className="flex h-full w-full items-stretch gap-1">
          {item.swatches.map((swatch) => (
            <li key={swatch.step} className="flex min-w-0 flex-1 flex-col gap-1">
              <span
                className="flex-1 rounded-md border border-black/5"
                style={{ backgroundColor: swatch.hex }}
                aria-hidden="true"
              />
              <span className="text-center font-mono text-[0.5rem] text-graphite-soft">
                {swatch.step}
              </span>
            </li>
          ))}
        </ul>
        <span className="sr-only">
          {item.swatches.length} steps, from {item.swatches[0]?.hex} to{" "}
          {item.swatches[item.swatches.length - 1]?.hex}
        </span>
      </div>
    );
  }

  // Nothing built yet: a motif, and no claim about what it will look like.
  if (item.comingSoon) {
    return (
      <div
        className={cn(band, "text-graphite")}
        style={{ height: 132 }}
        data-zb-pack-preview="motif"
      >
        <Motif slug={item.slug} kind={item.kind} />
      </div>
    );
  }

  // Code, tokens or data. The manifest is the honest picture of those.
  if (item.filePaths.length > 0) {
    return (
      <div
        className={cn(band, item.filePaths.length > 2 ? "items-start" : "items-center")}
        style={{ height: 132 }}
        data-zb-pack-preview="manifest"
      >
        <Manifest paths={item.filePaths} />
      </div>
    );
  }

  /*
   * The console answered but does not send file paths.
   *
   * It sends a count, so the count is what this says. Drawing a manifest from
   * a number would be inventing filenames.
   */
  return (
    <div className={cn(band, "text-graphite")} style={{ height: 132 }} data-zb-pack-preview="count">
      <p className="text-center font-mono text-[0.6875rem]">
        {item.files} file{item.files === 1 ? "" : "s"} · v{item.version}
      </p>
    </div>
  );
}
