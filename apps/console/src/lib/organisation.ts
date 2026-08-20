/**
 * Organisation-level settings.
 *
 * Separate from `themes.ts` for the same reason that file is separate from
 * `actions.ts`: a plain async function taking an `Authorized` can be driven by
 * a test through the whole change-and-audit path without Next's request
 * context, and the `"use server"` wrapper stays thin enough to read in one go.
 */

import { ObjectId } from "mongodb";
import { slugSchema } from "@oxygenui-design/theme";
import type { FrameworkId } from "@/db/collections";
import type { Authorized } from "./authorize";
import { FRAMEWORKS } from "./frameworks";

export class OrganisationError extends Error {
  constructor(
    message: string,
    /** The detail a customer needs to act, not just to be refused. */
    readonly problems: string[] = [],
  ) {
    super(message);
    this.name = "OrganisationError";
  }
}

const KNOWN = new Set<string>(FRAMEWORKS.map((framework) => framework.id));

/**
 * Record which frameworks this organisation's applications run on.
 *
 * What this does and does not do, because the difference matters and a
 * customer will assume the stronger version:
 *
 *   - It **does not** switch anything at runtime. A bridge is an npm package a
 *     customer installs and mounts in their own application; this console has
 *     no reach into a running deployment, and claiming otherwise would be a
 *     lie a support ticket eventually catches.
 *   - It **does** decide what this console offers — which bridges the
 *     playground can preview a theme through, and which host-theme imports the
 *     transfer screen accepts.
 *
 * So it is safe to change and safe to change back, which is why there is no
 * confirmation step. The audit entry records who changed it regardless.
 */
export async function setFrameworks(auth: Authorized, next: readonly string[]): Promise<string> {
  const unknown = next.filter((id) => !KNOWN.has(id));
  if (unknown.length > 0) {
    throw new OrganisationError(`No bridge exists for ${unknown.join(", ")}.`);
  }

  // Deduplicated and ordered by the bridge list rather than by the order the
  // checkboxes arrived in, so the stored array is comparable between saves and
  // the audit trail does not fill with reorder-only entries.
  const selected = FRAMEWORKS.filter((framework) => next.includes(framework.id)).map(
    (framework) => framework.id,
  );

  const organisation = await auth.data.organisation.get();
  if (!organisation) throw new OrganisationError("Organisation not found.");

  const before = [...organisation.frameworks].sort().join(",");
  const after = [...selected].sort().join(",");
  if (before === after) return "No change.";

  await auth.data.organisation.updateOne({ $set: { frameworks: selected as FrameworkId[] } });

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "org.frameworks-changed",
    subject: organisation.slug,
    detail: `${before || "none"} → ${after || "none"}`,
    at: new Date(),
  });

  const names = FRAMEWORKS.filter((framework) => selected.includes(framework.id)).map(
    (framework) => framework.name,
  );
  return names.length === 0
    ? "No framework selected. Oxygen components will use their own tokens."
    : `Saved. This console now offers ${names.join(" and ")}.`;
}

/**
 * Rename an organisation, and — only before the first publish — re-slug it.
 *
 * The slug is in every published stylesheet URL: `/t/{org}/{theme}@{v}.css`.
 * Those URLs are immutable by design and are linked from customers' production
 * applications, so changing the slug after a publish would break every one of
 * them at once, silently, with no error a customer would see until a page
 * rendered unthemed. It is therefore frozen at the first publish rather than
 * guarded by a confirmation dialog.
 *
 * The name is free to change; nothing resolves through it.
 */
export async function updateOrganisation(
  auth: Authorized,
  input: { name: string; slug: string },
): Promise<string> {
  const organisation = await auth.data.organisation.get();
  if (!organisation) throw new OrganisationError("Organisation not found.");

  const name = input.name.trim();
  if (name.length < 1 || name.length > 80) {
    throw new OrganisationError("Give the organisation a name of up to 80 characters.");
  }

  const slug = input.slug.trim();
  const slugChanged = slug !== organisation.slug;

  if (slugChanged) {
    const published = await auth.data.versions.countDocuments();
    if (published > 0) {
      throw new OrganisationError("The address cannot change after the first publish.", [
        `${published} published stylesheet URL(s) contain "${organisation.slug}", and applications link them directly.`,
        "Changing it would break every one of them at once, with no error until a page rendered unthemed.",
      ]);
    }

    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      throw new OrganisationError(
        "That address cannot be used.",
        parsed.error.issues.map((issue) => issue.message),
      );
    }
  }

  if (name === organisation.name && !slugChanged) return "No change.";

  await auth.data.organisation.updateOne({ $set: { name, slug } });
  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "org.renamed",
    subject: slug,
    detail: slugChanged
      ? `renamed to "${name}", address ${organisation.slug} → ${slug}`
      : `renamed to "${name}"`,
    at: new Date(),
  });

  return slugChanged ? `Saved. Your address is now ${slug}.` : "Saved.";
}
