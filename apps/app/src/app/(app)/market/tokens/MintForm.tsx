"use client";

import { useState } from "react";
import { mintTokenAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, Select, SubmitButton } from "@/components/ui";

/**
 * Minting a CLI or Figma credential.
 *
 * A client component because `Field` takes a render prop and a function cannot
 * be passed from a server component — the same reason every other form here is
 * its own file. It now also holds the selected scope, so the description under
 * the picker is the one for the thing being minted.
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

/**
 * What each scope reaches, in the words somebody choosing between them reads.
 *
 * Here rather than beside `mintToken`, and the reason is mechanical: this is a
 * client component, and that module imports the Mongo driver. Reaching across
 * for one string pulled `dns`, `child_process` and `fs` into the browser bundle
 * and failed the build — which is the correct outcome, and a good argument for
 * UI copy living with the UI.
 */
const SCOPE = {
  registry: {
    label: "The component registry",
    hint: "Installs purchased components with the Zoblocks CLI. It cannot read your themes.",
  },
  figma: {
    label: "Themes, for the Figma plugin",
    hint: "Lets the Figma plugin read your themes and propose a brand colour as a draft. It cannot publish, and it cannot install purchased components.",
  },
} as const;

type Scope = keyof typeof SCOPE;

export function MintForm() {
  /*
   * The description follows the selection.
   *
   * Both were shown at once in the first version, which reads as one sentence
   * describing one key and quietly claims the registry token can talk to Figma.
   * A picker whose explanation does not move with it is worse than no
   * explanation, because it is read as true.
   */
  const [scope, setScope] = useState<Scope>("registry");

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
        <Field label="Reaches" hint={SCOPE[scope].hint} required>
          {(props) => (
            <Select
              {...props}
              name="scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as Scope)}
            >
              {(Object.keys(SCOPE) as Scope[]).map((key) => (
                <option key={key} value={key}>
                  {SCOPE[key].label}
                </option>
              ))}
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
