import localFont from "next/font/local";

/**
 * Zowork's own typefaces, for the one section of this site that is Zowork's.
 *
 * zowork.com sets everything in Geist and Geist Mono. The section wears their
 * theme, and a palette without the type reads as an imitation of it. Loaded
 * here rather than in the root layout so only the page that shows the section
 * pays for the files; the variables are applied on the section itself.
 *
 * Self-hosted, like the root layout's faces: the Google loader fetches at
 * build time, and Turbopack fails on the response Google now serves. These
 * are the latin variable files, with their OFL licences beside them.
 */
export const zoworkSans = localFont({
  src: "./fonts/geist-latin-wght.woff2",
  display: "swap",
  variable: "--font-zowork-sans",
  weight: "400 500",
});

export const zoworkMono = localFont({
  src: "./fonts/geist-mono-latin-wght.woff2",
  display: "swap",
  variable: "--font-zowork-mono",
  weight: "400 500",
});
