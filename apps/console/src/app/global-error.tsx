"use client";

/**
 * The last resort: the root layout itself threw.
 *
 * This replaces the root layout rather than rendering inside it, so it must
 * supply its own `<html>` and `<body>` — and Next's own documentation is
 * explicit that it renders its own document *without* the application's global
 * styles, which means the theme class never reaches it either.
 *
 * So everything here is inline, including the palette. Not laziness: this is
 * the boundary that catches a failure in the code responsible for loading the
 * stylesheet and the fonts, and a fallback that depends on the thing that just
 * broke is not a fallback. It renders correctly with nothing but this file.
 *
 * The colours are the console's own, restated as literals, with a
 * `prefers-color-scheme` block so a reader in dark mode is not handed a white
 * page. There is no toggle to respect here — the attribute the app sets lives
 * on a document this one replaced.
 *
 * `<title>` is a React element rather than a `metadata` export: error
 * boundaries are Client Components and cannot export metadata.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en-GB">
      <head>
        <title>Something went wrong · Oxygen console</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#f7f9f8",
          color: "#08110f",
          fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui",
          lineHeight: 1.6,
        }}
      >
        {/*
          A media query cannot be expressed in a style attribute, and this file
          cannot import a stylesheet it may be the reason nothing loaded. One
          inline block, scoped to the two rules that need it.
        */}
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background: #080b10 !important; color: #edf2f7 !important; }
            .ox-panel { background: #0e1614 !important; border-color: #1f2b28 !important; }
            .ox-muted { color: #9aaba4 !important; }
            .ox-btn { background: #6ce7cb !important; color: #08110f !important; }
          }
        `}</style>

        <main
          className="ox-panel"
          style={{
            maxWidth: "30rem",
            width: "100%",
            background: "#ffffff",
            border: "1px solid #dde5e2",
            borderRadius: "0.875rem",
            padding: "2rem",
          }}
        >
          {/* The mark, drawn rather than fetched — an <img> here would be one
              more request that can fail for the same reason we are here. */}
          <svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true">
            <line x1="8" y1="8" x2="20" y2="8" stroke="#10b995" strokeWidth="2.5" />
            <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="20" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>

          <h1 style={{ fontSize: "1.375rem", letterSpacing: "-0.02em", margin: "1rem 0 0.5rem" }}>
            The console could not start
          </h1>

          <p className="ox-muted" style={{ margin: 0, fontSize: "0.875rem", color: "#5a6b67" }}>
            This is a failure in the application shell rather than in one screen. Nothing you were
            working on has been changed or published.
          </p>

          <button
            type="button"
            onClick={() => retry()}
            className="ox-btn"
            style={{
              marginTop: "1.5rem",
              font: "inherit",
              fontSize: "0.875rem",
              fontWeight: 500,
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#08110f",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>

          {error.digest && (
            <p
              className="ox-muted"
              style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid #dde5e2",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.6875rem",
                color: "#5a6b67",
              }}
            >
              Reference {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
