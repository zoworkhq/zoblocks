import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "@/lib/actions";
import { currentUser } from "@/lib/auth";
import { AuthForm, Field } from "../auth-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Request access" };

export default async function SignupPage() {
  if (await currentUser()) redirect("/tasks");

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-ink">Request access</h1>
      <p className="mb-6 text-[0.8125rem] leading-relaxed text-muted">
        Creating an account does not grant access. An admin approves each request and sets the role.
      </p>

      <AuthForm action={signUp} submitLabel="Request access">
        <Field id="name" label="Full name" autoComplete="name" required />
        <Field id="email" label="Email" type="email" autoComplete="email" required />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          hint="At least 12 characters. Longer beats complicated — a passphrase is fine."
        />
      </AuthForm>

      <p className="mt-6 border-t border-rule pt-5 text-[0.8125rem] text-muted">
        Already approved?{" "}
        <Link
          href="/login"
          className="text-ink underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
