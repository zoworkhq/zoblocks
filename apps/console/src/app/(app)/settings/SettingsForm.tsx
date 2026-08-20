"use client";

import { useState } from "react";
import { updateOrganisationAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Input, Panel, SubmitButton } from "@/components/ui";

/**
 * The organisation's name and its address.
 *
 * The address is frozen at the first publish, and the field says so rather than
 * disappearing. A locked control with the reason attached answers "can I change
 * this?" in place; a missing one sends somebody to support to ask.
 */
export function SettingsForm({
  name: savedName,
  slug: savedSlug,
  publishedVersions,
  reason,
}: {
  name: string;
  slug: string;
  /** Non-zero means the address is in URLs somebody has already linked. */
  publishedVersions: number;
  reason?: string;
}) {
  const [name, setName] = useState(savedName);
  const [slug, setSlug] = useState(savedSlug);

  const frozen = publishedVersions > 0;
  const slugReason = frozen
    ? `Frozen. ${publishedVersions} published stylesheet URL${publishedVersions === 1 ? "" : "s"} contain "${savedSlug}", and applications link them directly — changing it would break every one at once.`
    : undefined;

  return (
    <ActionForm
      action={updateOrganisationAction}
      footer={
        <SubmitButton reason={reason} pendingLabel="Saving…" className="mt-4">
          Save
        </SubmitButton>
      }
    >
      <Panel
        title="Organisation"
        description="The name appears in this console. The address appears in every stylesheet URL your applications link."
      >
        <div className="space-y-4">
          <Field label="Name" required hint="Shown in the rail and on every screen here.">
            {(props) => (
              <Input
                {...props}
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                disabled={Boolean(reason)}
              />
            )}
          </Field>

          <Field
            label="Address"
            required
            hint={
              slugReason ??
              "Kebab-case. It becomes part of every published stylesheet URL, so it is fixed at your first publish."
            }
          >
            {(props) => (
              <Input
                {...props}
                name="slug"
                mono
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
                maxLength={48}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                readOnly={frozen}
                disabled={Boolean(reason)}
                aria-describedby={props["aria-describedby"]}
              />
            )}
          </Field>

          <p className="tabular rounded-lg border border-rule bg-paper-sunk px-3 py-2 font-mono text-[0.6875rem] text-graphite">
            /t/{slug || "…"}/&lt;theme&gt;@&lt;version&gt;.css
          </p>
        </div>
      </Panel>
    </ActionForm>
  );
}
