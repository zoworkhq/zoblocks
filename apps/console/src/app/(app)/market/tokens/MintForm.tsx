"use client";

import { mintTokenAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, SubmitButton } from "@/components/ui";

/**
 * Minting a CLI credential.
 *
 * A client component because `Field` takes a render prop and a function cannot
 * be passed from a server component — the same reason every other form here is
 * its own file.
 *
 * The token comes back in the action's result message, which the surrounding
 * `ActionForm` renders inline and raises as a toast. That is deliberate: it is
 * the only moment the value exists outside the customer's machine, because the
 * database stores its SHA-256 and nothing else.
 */
export function MintForm() {
  return (
    <ActionForm action={mintTokenAction}>
      <Field
        label="Label"
        hint="Name the machine or the pipeline. An unlabelled token is one nobody dares revoke."
        required
      >
        {(props) => <Input {...props} name="label" maxLength={60} placeholder="CI · web app" />}
      </Field>
      <div className="mt-3">
        <SubmitButton pendingLabel="Minting…">Mint</SubmitButton>
      </div>
    </ActionForm>
  );
}
