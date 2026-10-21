import type { Metadata } from "next";
import localFont from "next/font/local";

// Component tokens first, so the app layer can override deliberately.
import "@zoblocks/tokens/zoblocks-tokens.css";
import "./globals.css";

/**
 * Inter, matching the ClickUp reference. The docs site keeps Instrument Sans —
 * a marketing page and a tool people stare at for eight hours want different
 * things from a typeface, and Inter is built for the second job: it holds up
 * at 13px, has real tabular numerals for dates and counts, and its tight
 * default tracking is what makes dense rows readable rather than cramped.
 */
/*
 * Self-hosted rather than next/font/google. The Google loader fetches the
 * stylesheet at build time, and Turbopack fails on the response Google now
 * serves ("next/font/google queries have exactly one entry") — so a cold build
 * broke on a network reply, in CI and nowhere else. These are the latin
 * variable files Google serves, committed with their OFL licences beside them.
 */
const inter = localFont({
  src: "./fonts/inter-latin-wght.woff2",
  display: "swap",
  variable: "--font-inter",
  weight: "400 700",
});

export const metadata: Metadata = {
  title: { default: "hq — Zowork", template: "%s · hq" },
  description: "Internal task management for the Zowork team.",
  // Internal tool on a public hostname. Nothing here belongs in an index.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
