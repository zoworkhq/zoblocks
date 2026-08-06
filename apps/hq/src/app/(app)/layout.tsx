import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { currentUser, scopesFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Every authenticated route passes through here. `currentUser` re-reads the
 * account's status from the database on each request, so approval revoked or
 * an account disabled takes effect on the next navigation, not at token expiry.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <Shell scopes={scopesFor(user)} userName={user.name}>
      {children}
    </Shell>
  );
}
