/**
 * Every piece of brand artwork a customer can supply, as one table.
 *
 * The first version of this had three variants of one logo. The moment you ask
 * what else a healthcare tenant needs — a favicon, a home-screen icon, a card
 * for the link somebody pastes into Teams, a raster mark for the appointment
 * reminder email — the honest answer is that they are all the same thing:
 * a named image, with a rule about what format it may be, a rule about its
 * shape, a ground it has to be legible on, and somewhere it gets delivered.
 *
 * So they are one array of one type, and the differences live in this registry
 * rather than in seven upload panels that drift apart. Adding the next one —
 * a letterhead mark, a watermark for unsigned notes — is a row here, and the
 * screen, the checks and the delivery follow for free.
 *
 * The alternative is what design systems usually end up with: `logoUrl`,
 * `logoDarkUrl`, `faviconUrl`, `ogImageUrl`, `emailLogoUrl`, each with its own
 * validation written at a different time by a different person, and one of
 * them silently missing its accessibility check.
 */

import type { LogoFormat } from "./logo";

export type BrandAssetRole =
  | "mark-light"
  | "mark-dark"
  | "mark-mono"
  | "favicon"
  | "app-icon"
  | "social"
  | "email"
  | "illustration-empty"
  | "illustration-search"
  | "illustration-denied"
  | "illustration-error"
  | "letterhead"
  | "watermark-draft";

export interface BrandAssetSpec {
  role: BrandAssetRole;
  label: string;
  /** What it is for, in the words of somebody who has to decide. */
  note: string;
  /** Which formats are accepted. A shorter list than the checker allows. */
  formats: readonly LogoFormat[];
  /**
   * The ground it must be legible on, and therefore previewed on.
   *
   * `both` is not indecision. An illustration is one file that has to work in
   * light and dark, because nobody ships two of them — and a drawing with a
   * baked white background looks perfect on the light preview and appears as a
   * white rectangle in the dark theme. Previewing it on one ground is how that
   * ships.
   */
  ground: "light" | "dark" | "neutral" | "both";
  /**
   * The shape it has to be.
   *
   * `exact` means a size the platform genuinely fixes — an Apple touch icon is
   * 180×180 and a wrong one is resampled badly. Everything else is a minimum,
   * because upscaling is the failure and a larger source is fine.
   */
  shape?: {
    width: number;
    height: number;
    exact?: boolean;
    /** Square artwork in a rectangular slot is the usual social-card mistake. */
    ratio?: number;
  };
  /** Where it ends up, said plainly, because otherwise nobody knows. */
  delivery: string;
  /** How it is grouped on screen. */
  group: "mark" | "platform" | "outbound" | "illustration" | "print";
}

/**
 * The roles, in the order they are worth doing.
 *
 * `mark-light` first because it is the one every other asset is derived from
 * by a designer, and `email` last because it is the one people forget until a
 * patient receives a reminder with a broken image where the hospital's name
 * should be.
 */
export const BRAND_ASSETS: readonly BrandAssetSpec[] = [
  {
    role: "mark-light",
    label: "Mark, on light",
    note: "The primary wordmark, over paper. Everything else is cut from this.",
    formats: ["svg", "png", "webp"],
    ground: "light",
    delivery: "--ox-logo and --ox-logo-light",
    group: "mark",
  },
  {
    role: "mark-dark",
    label: "Mark, on dark",
    note: "Reversed. Not derived from the light one — a reversed mark is a decision its owner has already made.",
    formats: ["svg", "png", "webp"],
    ground: "dark",
    delivery: "--ox-logo under the dark theme, and --ox-logo-dark",
    group: "mark",
  },
  {
    role: "mark-mono",
    label: "Mark, single colour",
    note: "For toner and fax. A discharge letter prints in one colour and a referral still travels by fax in places; this is what survives both.",
    formats: ["svg", "png"],
    ground: "neutral",
    delivery: "--ox-logo-mono, and the print stylesheet",
    group: "mark",
  },
  {
    role: "favicon",
    label: "Favicon",
    note: "The browser tab. At 16 pixels a wordmark is a smudge, so this is usually just the symbol.",
    formats: ["svg", "png"],
    ground: "neutral",
    shape: { width: 32, height: 32, ratio: 1 },
    delivery: "<link rel=icon> in the host application",
    group: "platform",
  },
  {
    role: "app-icon",
    label: "Home-screen icon",
    note: "What a clinician taps after adding the app to their phone. Rendered on a coloured tile with no transparency, so design it edge to edge.",
    formats: ["png"],
    ground: "neutral",
    shape: { width: 180, height: 180, exact: true, ratio: 1 },
    delivery: "<link rel=apple-touch-icon> and the web app manifest",
    group: "platform",
  },
  {
    role: "social",
    label: "Link preview",
    note: "The card that appears when somebody pastes a link into Teams, Slack or an email. Without one they get a grey box with a URL under it.",
    formats: ["png", "jpeg"],
    ground: "neutral",
    shape: { width: 1200, height: 630, ratio: 1200 / 630 },
    delivery: "og:image and twitter:image",
    group: "outbound",
  },
  {
    role: "email",
    label: "Email mark",
    note: "Raster, because no email client renders SVG reliably. Supply it at twice the size you intend to show it.",
    formats: ["png", "jpeg"],
    ground: "light",
    shape: { width: 400, height: 100 },
    delivery: "Absolute URL, for the <img> in an email template",
    group: "outbound",
  },
  {
    role: "illustration-empty",
    label: "Nothing here yet",
    note: "The first screen a new user sees, before they have created anything. Shown once per workspace and remembered.",
    formats: ["svg", "png", "webp"],
    ground: "both",
    shape: { width: 320, height: 220 },
    delivery: "--ox-illustration-empty",
    group: "illustration",
  },
  {
    role: "illustration-search",
    label: "Nothing matched",
    note: "A search or filter that returned no rows. Different from empty: there is data, it is just not this.",
    formats: ["svg", "png", "webp"],
    ground: "both",
    shape: { width: 320, height: 220 },
    delivery: "--ox-illustration-search",
    group: "illustration",
  },
  {
    role: "illustration-denied",
    label: "Not yours to see",
    note: "Blocked by permission. Worth drawing separately — a locked door is not the same message as an empty room, and staff act on the difference.",
    formats: ["svg", "png", "webp"],
    ground: "both",
    shape: { width: 320, height: 220 },
    delivery: "--ox-illustration-denied",
    group: "illustration",
  },
  {
    role: "illustration-error",
    label: "Something went wrong",
    note: "The error boundary. This one is seen at the worst moment, so it should be the calmest drawing in the set.",
    formats: ["svg", "png", "webp"],
    ground: "both",
    shape: { width: 320, height: 220 },
    delivery: "--ox-illustration-error",
    group: "illustration",
  },
  {
    role: "letterhead",
    label: "Letterhead",
    note: "The header band on a printed discharge summary or referral letter. Full width of the page, so supply it wide rather than tall.",
    formats: ["svg", "png"],
    ground: "light",
    shape: { width: 1600, height: 300 },
    delivery: "--ox-letterhead, in the print stylesheet",
    group: "print",
  },
  {
    role: "watermark-draft",
    label: "Draft watermark",
    note: "Laid across any note that has not been countersigned. The one asset here with a patient-safety argument: an unsigned note that prints without the watermark gets filed and read as final.",
    formats: ["svg", "png"],
    ground: "light",
    shape: { width: 600, height: 600, ratio: 1 },
    delivery: "--ox-watermark-draft",
    group: "print",
  },
];

export const BRAND_ASSET_ROLES: readonly BrandAssetRole[] = BRAND_ASSETS.map((a) => a.role);

export function brandAsset(role: BrandAssetRole): BrandAssetSpec {
  const found = BRAND_ASSETS.find((a) => a.role === role);
  if (!found) throw new Error(`Unknown brand asset role: ${role}`);
  return found;
}

/** The groups, in screen order, with the sentence that explains each. */
export const BRAND_ASSET_GROUPS = [
  {
    id: "mark" as const,
    title: "The mark",
    note: "One mark on the three grounds it has to survive. Nothing is recoloured or derived.",
  },
  {
    id: "platform" as const,
    title: "Platform icons",
    note: "Where the operating system, not your stylesheet, decides how it is drawn.",
  },
  {
    id: "outbound" as const,
    title: "Outside the application",
    note: "Rendered by software you do not control — a mail client, a chat preview.",
  },
  {
    id: "print" as const,
    title: "On paper",
    note: "A discharge letter is toner on paper and a referral still travels by fax in places. These are drawn by the print stylesheet, where colour is dropped by default and only the shapes survive.",
  },
  {
    id: "illustration" as const,
    title: "Empty and error states",
    note: "The screens with nothing on them, which is where an application either explains itself or does not. Each is previewed on both grounds, because one file has to survive both.",
  },
];
