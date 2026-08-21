"use client";

import { mintTokenAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, Select, SubmitButton } from "@/components/ui";

/**
 * What each scope reaches, in the words somebody choosing between them reads.
 *
 * Here rather than beside `mintToken`, and the reason is mechanical: this is a
 * client component, and that module imports the Mongo driver. Reaching across
 * for one string pulled `dns`, `child_process` and `fs` into the browser bundle
 * and failed the build — which is the correct outcome, and a good argument for
 * UI copy living with the UI.
 */
const SCOPE_SUMMARY = {
  registry: "Installs purchased components with the shadcn CLI.",
  figma: "Lets the Figma plugin read your themes and propose a brand colour. It cannot publish.",
} as const;

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
 *
 * The scope is chosen at mint time and cannot be changed afterwards. A key that
 * could gain a capability later is a key whose blast radius is whatever it
 * becomes, rather than what it was approved as — so widening one means minting
 * another and revoking this one, which is a decision with a record.
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
        <Field label="Reaches" hint={SCOPE_SUMMARY.registry + " " + SCOPE_SUMMARY.figma}>
          {(props) => (
            <Select {...props} name="scope" defaultValue="registry">
              <option value="registry">The component registry</option>
              <option value="figma">Themes, for the Figma plugin</option>
            </Select>
          )}
        </Field>
      </div>
      <div className="mt-3">
        <SubmitButton pendingLabel="Minting…">Mint</SubmitButton>
      </div>
    </ActionForm>
  );
}
