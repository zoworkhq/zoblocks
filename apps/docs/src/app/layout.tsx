import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

// Component tokens first, so the site layer can override deliberately.
import "@zoblocks/tokens/zoblocks-tokens.css";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import { CATALOG } from "@/lib/catalog";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

/*
 * 154 characters, and the count is the point.
 *
 * The previous string ran to 220 and was cut mid-clause in every result page,
 * which meant the sentence that survived ended on "restricted records, and".
 * What is left leads with the framework, names the standard, gives a number and
 * states the licence — the four things an evaluator screens on before they read
 * a word of prose.
 *
 * The number is derived now. It was typed, and it said 27 while the catalogue
 * held 30 — in the one sentence a search result, a link preview and an answer
 * engine all quote. Every other count on the site is computed; this was the
 * last hand-written one, and being wrong here is more expensive than being
 * wrong anywhere else.
 */
const description =
  `Open-source React components for clinical software. FHIR R4 types, WCAG 2.2 AA, ` +
  `${CATALOG.length} components installed as source you own. MIT core, no runtime dependencies.`;

export const metadata: Metadata = {
  metadataBase: new URL("https://zoblocks.design"),
  title: {
    default: "ZoBlocks — healthcare components typed to FHIR",
    template: "%s · ZoBlocks",
  },
  description,
  keywords: [
    "FHIR",
    "FHIR R4",
    "healthcare UI",
    "React components",
    "design system",
    "Tailwind CSS",
    "health tech",
    "clinical UI",
  ],
  openGraph: {
    type: "website",
    url: "https://zoblocks.design",
    siteName: "ZoBlocks",
    title: "ZoBlocks — healthcare components typed to FHIR",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "ZoBlocks — healthcare components typed to FHIR",
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script below sets the `dark` class
    // before React hydrates, so the server and client markup differ by design.
    <html
      lang="en"
      className={`${instrumentSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Runs before first paint to prevent a flash of the wrong theme. It must
          stay inline and synchronous — an external or deferred script paints
          light first and then snaps to dark, which is worse than no toggle.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOT_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        {/*
          Who this is, in machine-readable form.

          The domain emitted exactly one schema type — SoftwareSourceCode, on
          component pages — and nothing that said what ZoBlocks *is*. An answer
          engine resolves an entity before it will cite it, and there was no
          statement of the entity anywhere. `SoftwareApplication` rather than a
          bare Organization: the thing being described is the library, and the
          licence and category are the two facts a model needs to answer "is
          there an open-source FHIR component library" correctly.

          Rendered once in the root layout so every page carries it, and kept as
          a plain script tag rather than a component so it costs no hydration.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://zoblocks.design/#organization",
                  name: "Zowork",
                  url: "https://zoblocks.design",
                  description:
                    "Builds ZoBlocks, an open-source React component library for clinical and behavioral health software.",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://zoblocks.design/#website",
                  url: "https://zoblocks.design",
                  name: "ZoBlocks",
                  description,
                  publisher: { "@id": "https://zoblocks.design/#organization" },
                  inLanguage: "en",
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": "https://zoblocks.design/#software",
                  name: "ZoBlocks",
                  applicationCategory: "DeveloperApplication",
                  operatingSystem: "Any",
                  description,
                  url: "https://zoblocks.design",
                  license: "https://opensource.org/licenses/MIT",
                  programmingLanguage: "TypeScript",
                  softwareRequirements: "React 19, Tailwind CSS",
                  isAccessibleForFree: true,
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    description: "MIT-licensed core. Paid packs and console are separate.",
                  },
                },
              ],
            }),
          }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cta focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-paper"
        >
          Skip to content
        </a>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
