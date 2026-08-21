import { requireMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { can } from "@/lib/roles";
import { Rail } from "@/components/Rail";
import { AccountMenu } from "@/components/AccountMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastProvider } from "@/components/ui";

/**
 * The authenticated shell.
 *
 * Three parts: a rail that never changes, a sticky account bar, and the page.
 * The rail is the organisation's — where you can go. The bar is the person's —
 * who you are and the way out. Keeping those two apart is what stopped Sign out
 * living next to the theme toggle in the corner of a navigation list.
 *
 * The rail is a client component and this is not. The split is deliberate:
 * everything that needs the database and the session stays on the server, and
 * the only thing that crosses is the small, already-authorised summary the rail
 * renders. `usePathname` is what forces the boundary at all — current-page
 * state cannot be computed on the server, because the layout is not re-rendered
 * on a client-side navigation.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember();

  const data = scoped(member.orgId);
  const org = await data.organisation.get();

  const memberCount = await data.members.countDocuments();

  // Live entitlements only. A revoked purchase still has a row — it is what
  // proves access was withdrawn and when — but counting it in the rail would
  // tell a customer they own something they cannot download.
  const purchaseCount = await data.entitlements.countDocuments({ revokedAt: null });

  // Projected rather than passed whole: the rail needs three fields, and a
  // theme document carries a full token set. Sending the rest to the client on
  // every navigation would ship a customer's entire draft palette into the page
  // payload to render a list of names.
  const themes = await data.themes
    .find()
    .project<{ slug: string; name: string; liveVersion: number | null }>({
      _id: 0,
      slug: 1,
      name: 1,
      liveVersion: 1,
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return (
    <ToastProvider>
      {/*
        The chrome fills the window; the *content* is what has a measure.

        This was capped at 1400px, which centred the whole application and left
        a bare gutter down each side of a wider screen. On the account bar that
        showed as a gap in the top-right corner — the bar's rule stopped short
        of the edge with page behind it, so the one piece of persistent chrome
        looked detached. Application chrome reaches the edges of the window it
        is in; the reading measure is applied further in, on `main` and on the
        bar's own row, so the two stay aligned with each other.
      */}
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        {/*
        Sticky and full-height on a wide screen; a plain block that scrolls away
        on a narrow one. A rail that stays fixed on a phone eats the viewport,
        and the alternative — a horizontal scroll — loses it entirely.
      */}
        <div className="shrink-0 border-b border-rule px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
          <Rail
            themes={themes}
            frameworkCount={org?.frameworks.length ?? 0}
            memberCount={memberCount}
            purchaseCount={purchaseCount}
            canMintTokens={can(member.role, "market.token")}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/*
            The account bar.

            Thin, sticky and right-aligned. The rail says which organisation
            you are in; this says which person you are, and it is the only place
            in the app that ends a session. Sticky because signing out is
            the one thing somebody may want at any scroll position.

            The theme toggle sits here too, for two reasons. It belongs to the
            person rather than to the organisation, which is what this bar is
            for and what the rail's own comment says. And in the rail it sat in
            the bottom-left corner — exactly where Next's development badge
            lands, so every developer working locally saw its first button
            covered by a black circle and reasonably assumed the control was
            broken.
          */}
          <div className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-rule bg-paper/85 px-5 py-2.5 backdrop-blur-md sm:px-8 lg:px-10">
            <ThemeToggle />
            <AccountMenu
              name={member.name}
              email={member.email}
              role={member.role}
              organisation={org?.name ?? "Organisation"}
            />
          </div>

          <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-[900px]">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
