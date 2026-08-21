import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { THEME_SCREENS, themeScreenHref, type ThemeFacts } from "@/lib/theme-screens";

/**
 * Where you can go from a theme, and what is waiting there.
 *
 * The screen this sits on had no links at all. Brand, Tokens, Typography,
 * Components, Compare, History and Import/export were reachable only from the
 * rail — and the rail only reveals them once the URL already names a theme, so
 * the way to discover the token editor was to notice the sidebar had grown.
 *
 * A status board rather than a menu, which is the reason each card carries a
 * count. "Tokens" is a destination; "12 overrides" is a reason to open it, and
 * "Never published" tells a reader why History would be empty before they
 * spend a click finding out. Every value is read from the theme already loaded
 * by the page — no extra query.
 */
export function ThemeScreens({ slug, facts }: { slug: string; facts: ThemeFacts }) {
  return (
    <nav aria-label="This theme">
      <h2 className="eyebrow mb-2.5 text-[0.5625rem] text-graphite-soft">This theme</h2>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {THEME_SCREENS.map(({ path, label, Icon, purpose, status }) => {
          const state = status(facts);
          return (
            <li key={path}>
              {/*
                The card is the link, not a card containing one. A clickable
                surface with a smaller anchor inside it is the pattern that
                gives you a target the pointer finds and the keyboard does not.
              */}
              <Link
                href={themeScreenHref(slug, path)}
                className="surface group flex h-full flex-col gap-1 p-3.5 transition-colors duration-200 hover:border-rule-strong hover:bg-paper-sunk"
              >
                <span className="flex items-center gap-2">
                  <Icon
                    aria-hidden="true"
                    strokeWidth={2}
                    className="size-3.5 shrink-0 text-oxygen-deep"
                  />
                  <span className="flex-1 text-[0.8125rem] font-semibold">{label}</span>
                  <ArrowRight
                    aria-hidden="true"
                    strokeWidth={2}
                    className="size-3.5 shrink-0 text-graphite-soft transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>

                <span className="text-[0.75rem] leading-relaxed text-graphite">{purpose}</span>

                {state && (
                  <span className="tabular mt-auto pt-1.5 font-mono text-[0.6875rem] text-graphite-soft">
                    {state}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
