import type { Metadata } from "next";
import { Inter } from "next/font/google";

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
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
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
