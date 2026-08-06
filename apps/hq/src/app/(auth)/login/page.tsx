import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { AuthForm, Field } from "../auth-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ bootstrapped?: string; reset?: string }>;
}) {
  if (await currentUser()) redirect("/tasks");
  const { bootstrapped, reset } = await searchParams;

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mb-6 text-[0.8125rem] leading-relaxed text-muted">
        Task assignments and team progress for the Zowork team.
      </p>

      {bootstrapped && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-[var(--ox-accent-border)] bg-[var(--ox-accent-subtle)] px-3 py-2.5 text-[0.8125rem] leading-snug text-ink"
        >
          Admin account created. Sign in — every later signup waits for your approval.
        </p>
      )}

      {/* Without this the reset flow ends on a bare sign-in form with no
          confirmation that anything happened. */}
      {reset && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-rule bg-vellum px-3 py-2.5 text-[0.8125rem] leading-snug text-ink"
        >
          Password updated. Sign in with your new password.
        </p>
      )}

      <AuthForm action={signIn} submitLabel="Sign in">
        <Field id="email" label="Email" type="email" autoComplete="email" required />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />
      </AuthForm>

      <p className="mt-6 border-t border-rule pt-5 text-[0.8125rem] text-muted">
        No account yet?{" "}
        <Link
          href="/signup"
          className="text-ink underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
        >
          Request access
        </Link>
      </p>
    </>
  );
}
