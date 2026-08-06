import Link from "next/link";
import { resetPassword } from "@/lib/actions";
import { resolvePasswordReset } from "@/lib/auth";
import { AuthForm, Field } from "../../auth-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set a new password" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const grant = await resolvePasswordReset(token);

  // Expired, spent, unknown, and belonging-to-a-disabled-account all render the
  // same thing. Distinguishing them would turn this page into an oracle for
  // whether a given token ever existed.
  if (!grant) {
    return (
      <>
        <h1 className="mb-1 text-lg font-semibold tracking-tight text-ink">Link not valid</h1>
        <p className="mb-6 text-[0.8125rem] leading-relaxed text-muted">
          This link has expired or has already been used. Reset links last one hour and work once.
          Ask an admin for a new one.
        </p>
        <Link href="/login" className="btn w-full">
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-ink">Set a new password</h1>
      <p className="mb-6 text-[0.8125rem] leading-relaxed text-muted">
        For {grant.name}. Choosing a new password signs out every device currently using this
        account.
      </p>

      <AuthForm action={resetPassword} submitLabel="Set password">
        <input type="hidden" name="token" value={token} />
        <Field
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          hint="At least 12 characters. Longer beats complicated — a passphrase is fine."
        />
        <Field
          id="confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
        />
      </AuthForm>
    </>
  );
}
