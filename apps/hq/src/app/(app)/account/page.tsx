import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Avatar } from "@/components/bits";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <div className="hq-page mx-auto max-w-lg px-5 py-6 sm:px-7">
      <PageHeader title="Account" subtitle="Your sign-in details" />

      <div className="mb-5 flex items-center gap-3 rounded-lg border border-rule bg-paper px-4 py-3.5">
        <Avatar id={user.id} name={user.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-medium text-ink">{user.name}</p>
          <p className="truncate text-[0.6875rem] text-muted">
            {user.email} · {user.role}
          </p>
        </div>
      </div>

      <section className="rounded-lg border border-rule bg-paper px-4 py-4">
        <h2 className="mb-1 text-[0.8125rem] font-semibold text-ink">Change password</h2>
        <p className="mb-4 text-[0.75rem] leading-relaxed text-muted">
          Your other devices are signed out. This one stays signed in.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
