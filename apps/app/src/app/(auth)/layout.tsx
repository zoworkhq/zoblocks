import Link from "next/link";
import { ZoBlocksMark } from "@/components/Rail";
import { ToastProvider } from "@/components/ui";

/**
 * The unauthenticated shell.
 *
 * One column, centred, and nothing else on the screen.
 *
 * This was a split for a while, with a dark instrument panel on the right
 * showing measured contrast — the product making its own argument while
 * somebody signed in. It is gone by decision: it dominated a screen whose only
 * job is to take a credential, and a marketing panel is not what a returning
 * administrator is there for. What replaces it is not a smaller version of it
 * but an absence, which is the point.
 *
 * The wordmark, the form and the footnote share one 26rem measure so they
 * stack on a single left edge. `justify-center` on the middle row with the
 * other two as flex siblings lands the form slightly above true vertical
 * centre, which is where the eye expects it.
 *
 * `ToastProvider` is mounted here as well as in the app shell, because these
 * screens raise results too — a refused sign-up needs to be announced whether
 * or not a session exists.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10">
        {/*
          A single soft wash, centred behind the form. Decorative and
          `aria-hidden`, and deliberately faint — with the panel gone this is
          the only thing keeping the page from being a blank sheet, and a
          sign-in screen is still a place to type rather than to look at.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(60%_100%_at_50%_0%,var(--color-accent-wash),transparent)]"
        />

        <header className="relative mx-auto w-full max-w-[26rem]">
          <Link
            href="/"
            aria-label="ZoBlocks app home"
            className="group inline-flex items-center gap-2.5 text-ink"
          >
            <ZoBlocksMark className="h-4 w-7 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-180" />
            <span className="font-display text-[0.9375rem] font-semibold tracking-[-0.02em]">
              ZoBlocks
            </span>
            <span className="eyebrow text-[0.5625rem] text-graphite-soft">App</span>
          </Link>
        </header>

        <main className="relative flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[26rem]">{children}</div>
        </main>

        {/*
          The one link between the two halves of the product.
          
          The app and zoblocks.design shared a palette, a type scale and a
          mark, and not a single anchor in either direction — a customer arriving
          from the documentation had no way back, which is a strange thing for
          two sites that go to such lengths to feel like one.
        */}
        <footer className="relative mx-auto flex w-full max-w-[26rem] flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.6875rem] text-graphite-soft">
          <span>WCAG 2.2 AA, verified on every build</span>
          <a href="https://zoblocks.design" className="link">
            zoblocks.design
          </a>
        </footer>
      </div>
    </ToastProvider>
  );
}
