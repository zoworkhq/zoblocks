import Link from "next/link";
import { buttonClasses } from "@/components/ui";

/**
 * Where `notFound()` lands.
 *
 * Seven screens call it for a theme slug that does not resolve — every one of
 * them correctly, and until now every one of them rendered Next's unstyled
 * default. The call was right; there was simply nowhere for it to go.
 *
 * Inside the group, so the rail is still there. A missing theme is nearly
 * always a stale link or a slug that changed, and the useful next action is the
 * list of themes that do exist, which is one click away in the navigation this
 * page keeps.
 */
export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-[34rem] py-10">
      <p className="eyebrow mb-2 text-[0.625rem] text-graphite-soft">Not found</p>
      <h1 className="display-sm">There is nothing at this address</h1>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-graphite">
        The theme may have been renamed, or the link may predate a change to it. Your organisation
        and everything in it are unaffected.
      </p>

      <div className="mt-6">
        <Link href="/themes" className={buttonClasses()}>
          Back to themes
        </Link>
      </div>
    </div>
  );
}
