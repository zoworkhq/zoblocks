/**
 * The sign-in surface is the one place the instrument shows through on its
 * own: a dark panel holding the form, on paper. It is the same relationship
 * the rest of the app uses — chrome is instrument, content is document — with
 * nothing else on screen to carry it.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-vellum px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-baseline gap-2.5">
          <span className="text-lg font-semibold tracking-tight text-ink">hq</span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
            Zowork
          </span>
        </div>

        <div className="hq-page rounded-2xl border border-rule bg-paper p-7 shadow-[0_1px_2px_rgb(15_23_32/0.04),0_12px_32px_-16px_rgb(15_23_32/0.12)]">
          {children}
        </div>

        <p className="mt-5 text-center text-[0.6875rem] text-muted">Internal · Zowork team only</p>
      </div>
    </main>
  );
}
