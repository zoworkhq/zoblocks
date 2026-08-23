import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

// Component tokens first, so the site layer can override deliberately.
import "@oxygenui-design/tokens/oxygen-tokens.css";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

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

const description =
  "React components for healthcare products, typed to FHIR R4. Reference ranges, interpretation flags, restricted records, and the uninterpreted case — handled. Installed with the Oxygen CLI, source copied into your repo.";

export const metadata: Metadata = {
  metadataBase: new URL("https://oxygenui.design"),
  title: {
    default: "Oxygen UI — healthcare components typed to FHIR",
    template: "%s · Oxygen UI",
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
    url: "https://oxygenui.design",
    siteName: "Oxygen UI",
    title: "Oxygen UI — healthcare components typed to FHIR",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Oxygen UI — healthcare components typed to FHIR",
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
