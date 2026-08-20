import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

// Component tokens first, so the console layer overrides deliberately rather
// than by accident. The console renders real Oxygen components in its preview
// surfaces, and they resolve against these.
import "@oxygenui-design/tokens/oxygen-tokens.css";
// The components' own stylesheets. Without these the live preview renders real
// components with no structure at all — a `Switch` collapses into its label and
// its state run together, which looks like a broken component rather than a
// missing import, and is exactly what a customer would report as a bug.
import "@oxygenui-design/react/styles.css";
/*
 * The glyph masks, so the icon screen draws the same spans the copilot does.
 * Imported from the headless package rather than the antd skin: the console has
 * no antd, and the stylesheet belongs with the components that own it.
 */
import "@oxygenui-design/copilot-react/icons.css";
import "./globals.css";

/**
 * The same two faces the marketing and documentation site uses.
 *
 * Not a preference. The console sits one hop from oxygenui.design — a customer
 * moves between them in a single click — and the fastest way to make a product
 * feel like somebody else's is to change the typeface at the boundary. The
 * first version of this app used Inter, which is a fine interface face and is
 * not this product's face.
 */
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600", "700"],
});

/** Tokens, hex values, contrast ratios, versions, file paths. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "Theme console — Oxygen UI", template: "%s · Oxygen console" },
  description:
    "Author a design language, validate it against the same gate the build uses, publish it.",
  // A customer's unreleased branding is on these pages.
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `suppressHydrationWarning` covers exactly one element and is required
    // rather than defensive: the script below adds `dark` to this element
    // before React hydrates, so the client's className legitimately differs
    // from the server's. Without it React logs a mismatch on every page load
    // and the developer overlay shows a permanent error badge. It suppresses
    // the warning for this node's attributes only — children still reconcile
    // normally, so a real mismatch anywhere inside is still reported.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/*
          Applied before first paint, so a reader who chose dark never sees a
          flash of light. Inline and synchronous on purpose — a deferred script
          paints one theme and snaps to the other, which is worse than no
          toggle at all.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=document.documentElement,t=localStorage.getItem("oxygen-console-theme")||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))e.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
