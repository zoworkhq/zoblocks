/**
 * The marketplace shelf, curated to five.
 *
 * The seed announces twenty-three packs; Rahul asked for the public page to
 * carry at most five, under plain product names (16 Sep 2026). This list
 * decides which, in what order, and what each is called. `shelf()` still owns
 * price, version and provenance for the detail pages.
 *
 * `scene` picks the animated preview in `components/site/market-scenes.tsx`.
 * `span` is the card's width on the 6-column desktop grid.
 */

export type SceneId =
  "empty-states" | "clinical-icons" | "behavioural-icons" | "behavioural-system" | "figma-kit";

export interface CollectionEntry {
  /** The catalogue slug, where the seed already has one. */
  slug: string;
  name: string;
  /** The category, shown above the name. */
  kind: string;
  blurb: string;
  tags: readonly string[];
  /** What the animated preview shows, for a screen reader. */
  preview: string;
  scene: SceneId;
  span: "wide" | "narrow" | "full";
}

export const MAX_SHELF = 5;

export const COLLECTION: readonly CollectionEntry[] = [
  {
    slug: "empty-state-system",
    name: "Empty State Illustrations",
    kind: "Illustrations",
    blurb:
      "Illustrations for every empty state, in the three meanings clinical records need: not asked, none found and withheld.",
    tags: ["SVG + React", "FHIR emptyReason", "Forced colours"],
    preview: "An allergy list drawn three ways: not asked, none found, and withheld.",
    scene: "empty-states",
    span: "wide",
  },
  {
    slug: "clinical-icons",
    name: "Clinical Icon Set",
    kind: "Icons",
    blurb:
      "Icons for medications, devices, specimens and record states, drawn on a consistent 24px grid.",
    tags: ["24px grid", "1.5px stroke"],
    preview: "Clinical glyphs on a grid, from syringe to blood drop.",
    scene: "clinical-icons",
    span: "narrow",
  },
  {
    slug: "behavioural-health-icons",
    name: "Behavioural Health Icon Set",
    kind: "Icons",
    blurb:
      "Icons for therapy, group sessions, telehealth and peer support, designed with a trauma-informed approach.",
    tags: ["24px grid", "Trauma-informed"],
    preview: "Behavioural-health icons circling a mark of two overlapping circles.",
    scene: "behavioural-icons",
    span: "narrow",
  },
  {
    slug: "behavioural-health-system",
    name: "Behavioural Health Design System",
    kind: "Design system",
    blurb:
      "A calm, low-arousal design system for behavioural health products, with tokens, components and Figma files.",
    tags: ["Tokens", "Components", "Figma"],
    preview: "A calm check-in screen beside its palette, type and controls.",
    scene: "behavioural-system",
    span: "wide",
  },
  {
    slug: "figma-library",
    name: "Figma UI Kit",
    kind: "Figma library",
    blurb:
      "The complete ZoBlocks component library in Figma, with component anatomy and light, dark and high-contrast modes.",
    tags: ["Variables", "3 modes", "Dev Mode"],
    preview:
      "A patient banner in Figma, its parts numbered, cycling light, dark and high contrast.",
    scene: "figma-kit",
    span: "full",
  },
];

const BY_SLUG = new Map(COLLECTION.map((entry) => [entry.slug, entry]));

export const collectionEntry = (slug: string) => BY_SLUG.get(slug);

export const inCollection = (slug: string) => BY_SLUG.has(slug);
