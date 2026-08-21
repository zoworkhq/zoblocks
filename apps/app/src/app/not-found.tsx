import Link from "next/link";
import { OxygenMark } from "@/components/Rail";
import { buttonClasses } from "@/components/ui";

/**
 * A URL that matched no route at all.
 *
 * Distinct from `(app)/not-found.tsx`, which renders inside the shell for a
 * theme that does not resolve. This one has no shell to render inside — the
 * address never matched a segment, so there is no session to assume and no rail
 * to keep. It carries the mark and sends the reader to sign in, which is the
 * only destination that works whether or not they have an account.
 */
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-[26rem]">
        <OxygenMark className="h-4 w-7 text-ink" />
        <h1 className="display-sm mt-5">There is nothing at this address</h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-graphite">
          Check the link, or start from the app.
        </p>
        <div className="mt-6">
          <Link href="/login" className={buttonClasses()}>
            Go to the app
          </Link>
        </div>
      </div>
    </main>
  );
}
