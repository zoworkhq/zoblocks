import { Geist, Geist_Mono } from "next/font/google";

/**
 * Zowork's own typefaces, for the one section of this site that is Zowork's.
 *
 * zowork.com sets everything in Geist and Geist Mono. The section wears their
 * theme, and a palette without the type reads as an imitation of it. Loaded
 * here rather than in the root layout so only the page that shows the section
 * pays for the files; the variables are applied on the section itself.
 */
export const zoworkSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zowork-sans",
  weight: ["400", "500"],
});

export const zoworkMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-zowork-mono",
  weight: ["400", "500"],
});
