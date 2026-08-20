/**
 * Theme operations.
 *
 * Deliberately not server actions: these are plain async functions taking an
 * `Authorized` and returning a result, so a test can drive the whole
 * create → validate → publish → rollback lifecycle without Next's request
 * context. `actions.ts` is the thin `"use server"` wrapper over them.
 *
 * Three properties this module exists to guarantee:
 *
 *   **Publishing is gated server-side.** The console validates live as a
 *   courtesy; this is the boundary. A theme with any failing pair cannot be
 *   published by any role, including admin — an accessibility floor with an
 *   exception is a default.
 *
 *   **Published versions are immutable.** Publish writes a new `themeVersions`
 *   document and moves a pointer. Nothing updates one afterwards, so rollback
 *   is a pointer move and "what was live on the 14th" is answerable.
 *
 *   **Nothing crosses an organisation.** Every read and write goes through the
 *   scoped view handed in by `authorize`, which cannot express an unscoped
 *   query.
 */

import { ObjectId } from "mongodb";
import {
  emptyAssets,
  VALIDATOR_VERSION,
  emitThemeCss,
  exportTheme,
  generateRamp,
  importDtcg,
  importFrameworkTheme,
  slugSchema,
  themeHref,
  themeTokensSchema,
  validateTheme,
  withTierDefaults,
  type ExportFormat,
  type ExportResult,
  type ImportReport,
  type ThemeTokens,
  type ThemeTokensInput,
  type ValidationRecord,
} from "@oxygenui-design/theme";
import type { TokenSource } from "@oxygenui-design/tokens/validate";
import type { ThemeDoc, ThemeVersionDoc } from "@/db/collections";
import type { Authorized } from "./authorize";

export class ThemeError extends Error {
  constructor(
    message: string,
    readonly problems: string[] = [],
  ) {
    super(message);
    this.name = "ThemeError";
  }
}

/** The palette a theme is validated against — the same one components render on. */
export type BaseTokens = TokenSource;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Create a theme from a single brand colour.
 *
 * The console asks for one colour, not eleven: most of what the contrast gate
 * catches is a hand-picked step rather than the chosen colour, and asking a
 * customer for the ramp is asking them to do the part that has a right answer.
 */
export async function createTheme(
  auth: Authorized,
  input: { name: string; brandColour: string },
): Promise<{ id: ObjectId; slug: string }> {
  const slug = slugify(input.name);
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    throw new ThemeError(`"${input.name}" does not reduce to a usable name.`, [
      parsed.error.issues[0]?.message ?? "invalid name",
    ]);
  }

  const ramp = generateRamp(input.brandColour);
  if (!ramp) {
    throw new ThemeError(`"${input.brandColour}" is not a colour.`, [
      "Enter a three- or six-digit hex value.",
    ]);
  }

  if (await auth.data.themes.countDocuments({ slug })) {
    throw new ThemeError(`A theme called "${slug}" already exists.`, [
      "Names are unique within an organisation.",
    ]);
  }

  const now = new Date();
  const actor = new ObjectId(auth.member.id);
  const _id = new ObjectId();

  await auth.data.themes.insertOne({
    _id,
    name: input.name,
    slug,
    status: "draft",
    // Every tier present from the first save, so nothing downstream has to ask
    // whether this document predates them.
    tokens: withTierDefaults({ ref: { brand: Object.fromEntries(Object.entries(ramp)) } }),
    liveVersion: null,
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
  } as Omit<ThemeDoc, "orgId">);

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: actor,
    action: "theme.created",
    subject: slug,
    detail: `from ${input.brandColour}`,
    at: now,
  });

  return { id: _id, slug };
}

/**
 * Save a draft. Never touches a published version.
 *
 * `detail` exists so an import records *what* it changed in the same entry
 * rather than adding a second one. Two `theme.updated` rows for one action
 * makes the trail read as two edits, and the one carrying the reason is
 * whichever happened to be written last.
 */
export async function saveDraft(
  auth: Authorized,
  themeId: ObjectId,
  tokens: ThemeTokensInput,
  detail?: string,
): Promise<void> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const now = new Date();
  // Normalised on the way in, so a draft saved through any path — the editor,
  // an import, a test — is stored in one shape rather than in whichever shape
  // its caller happened to build.
  const next = withTierDefaults(tokens);
  await auth.data.themes.updateOne(
    { _id: themeId },
    { $set: { tokens: next, updatedAt: now, updatedBy: new ObjectId(auth.member.id) } },
  );
  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "theme.updated",
    subject: theme.slug,
    ...(detail ? { detail } : {}),
    at: now,
  });
}

/** Validate a draft. The same call the live editor makes, on the server. */
export async function checkTheme(
  auth: Authorized,
  base: BaseTokens,
  themeId: ObjectId,
): Promise<{ ok: boolean; problems: string[]; record: ValidationRecord }> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const result = validateTheme(base, theme.slug, theme.tokens, new Date().toISOString());
  return {
    ok: result.ok,
    problems: result.problems.map((p) => p.message),
    record: result.record,
  };
}

/**
 * Replace a draft's semantic and component overrides.
 *
 * Validated here rather than only on publish, and *refused* rather than warned
 * about. The alternative — saving whatever the editor sends and letting publish
 * complain later — produces a draft a customer believes is fine and discovers
 * is not at the moment they most want it to work. Publish still re-validates,
 * because a validator can be tightened between the two.
 *
 * The clinical refusal runs before the contrast gate on purpose: a rejected
 * clinical override should say so plainly rather than arriving as a wall of
 * contrast failures caused by it.
 */
export async function saveOverrides(
  auth: Authorized,
  base: BaseTokens,
  themeId: ObjectId,
  overrides: unknown,
): Promise<{ changed: number }> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  /*
   * Parsed by the document schema itself rather than by a second schema here.
   *
   * `themeTokensSchema` already carries the clinical refusal and the hex rule,
   * and a parallel schema in this file would be a second place for the rule to
   * live and a second place for it to fall behind. `ref` is supplied empty
   * because the ramp is not part of this payload.
   */
  const submitted = overrides as { semantic?: unknown; component?: unknown };
  const parsed = themeTokensSchema.safeParse({
    ref: {},
    semantic: submitted.semantic,
    component: submitted.component,
  });
  if (!parsed.success) {
    throw new ThemeError(
      "Those overrides were refused.",
      parsed.error.issues.map((issue) => issue.message),
    );
  }

  /*
   * A tier the payload does not mention is *kept*, not cleared.
   *
   * Two screens edit this document — the token editor owns `semantic`, the
   * components screen owns `component` — and each submits only its own tier.
   * Replacing both unconditionally meant the second save of the day silently
   * wiped the first, with no error and nothing in the audit trail to suggest
   * anything had been lost. Zod's `.default({})` made it invisible: an absent
   * tier arrived as three empty objects, indistinguishable from "the customer
   * deleted every override".
   *
   * So the presence of the key in the *raw* payload is what decides, and the
   * parsed value is used only when it was actually sent.
   *
   * The ramp is never in this payload at all; it belongs to the brand screen.
   */
  const existing = withTierDefaults(theme.tokens);
  const next = withTierDefaults({
    ref: theme.tokens.ref,
    semantic: submitted.semantic === undefined ? existing.semantic : parsed.data.semantic,
    component: submitted.component === undefined ? existing.component : parsed.data.component,
  });

  const check = validateTheme(base, theme.slug, next, new Date().toISOString());
  if (!check.ok) {
    throw new ThemeError(
      `${check.problems.length} of these overrides cannot be saved.`,
      check.problems.map((p) => p.message),
    );
  }

  const total = countOverrides(next);
  await saveDraft(auth, themeId, next, `${total} override(s) in force`);
  return { changed: total };
}

/** Total overrides across both tiers and all three themes. */
function countOverrides(tokens: ThemeTokens): number {
  const layers = [...Object.values(tokens.semantic), ...Object.values(tokens.component)];
  return layers.reduce((n, entries) => n + Object.keys(entries).length, 0);
}

/**
 * Replace a theme's brand ramp.
 *
 * Separate from `saveOverrides` because the two are edited on different screens
 * and a save from one must not discard the other's work — the shape of the
 * document makes that a merge rather than a replace, and both operations keep
 * to their own tier.
 *
 * The whole ramp arrives, not a step: the eleven derived steps are a set, and
 * validating one at a time would accept a ramp whose steps individually pass
 * and whose neighbours are indistinguishable.
 */
export async function saveBrand(
  auth: Authorized,
  base: BaseTokens,
  themeId: ObjectId,
  ramp: unknown,
): Promise<{ steps: number }> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const parsed = themeTokensSchema.safeParse({ ref: { brand: ramp } });
  if (!parsed.success) {
    throw new ThemeError(
      "That ramp was refused.",
      parsed.error.issues.map((issue) => issue.message),
    );
  }

  const existing = withTierDefaults(theme.tokens);
  const next = withTierDefaults({
    // Other primitive groups a customer may have imported — `cyan`, say — are
    // preserved. This screen edits the brand ramp and nothing else.
    ref: { ...existing.ref, brand: parsed.data.ref.brand ?? {} },
    semantic: existing.semantic,
    component: existing.component,
  });

  const check = validateTheme(base, theme.slug, next, new Date().toISOString());
  if (!check.ok) {
    throw new ThemeError(
      `${check.problems.length} problem(s) with that ramp.`,
      check.problems.map((p) => p.message),
    );
  }

  const steps = Object.keys(next.ref.brand ?? {}).length;
  await saveDraft(auth, themeId, next, `brand ramp, ${steps} step(s)`);
  return { steps };
}

/**
 * Publish.
 *
 * The authoritative gate. Everything before this is advisory — a client can be
 * out of date, a draft can be edited in another tab, and a validator can be
 * tightened between the two. Re-validating here rather than trusting a stored
 * verdict is what makes "a failing theme cannot go live" true rather than
 * likely.
 */
/**
 * Take a theme out of circulation, or put it back.
 *
 * Archiving, not deleting, and the distinction is the entire design. A
 * published theme has immutable versions behind it that applications are
 * linking right now — `/t/{org}/{slug}@{v}.css` is pinned and permanent, and
 * deleting the theme would break every one of those links to tidy a list. So
 * the row leaves the list and the stylesheets keep serving.
 *
 * The consequence worth stating: archiving does *not* unpublish. If the intent
 * is to stop serving a theme, that is a different act with a different blast
 * radius, and conflating the two behind one button is how somebody takes a
 * customer's production styling down while cleaning up.
 */
export async function setThemeArchived(
  auth: Authorized,
  themeId: ObjectId,
  archived: boolean,
): Promise<string> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  if (archived && theme.status === "archived") throw new ThemeError("Already archived.");
  if (!archived && theme.status !== "archived") throw new ThemeError("That theme is not archived.");

  /*
   * Restoring returns it to what its versions say it is, rather than to a
   * remembered value. `status` and `liveVersion` are the same fact stated
   * twice, and reading it back off `liveVersion` means the two cannot disagree
   * after a round trip through the archive.
   */
  const restored = theme.liveVersion === null ? "draft" : "published";

  await auth.data.themes.updateOne(
    { _id: themeId },
    {
      $set: {
        status: archived ? "archived" : restored,
        updatedAt: new Date(),
        updatedBy: new ObjectId(auth.member.id),
      },
    },
  );

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: archived ? "theme.archived" : "theme.restored",
    subject: theme.slug,
    detail: `${theme.status} → ${archived ? "archived" : restored}`,
    at: new Date(),
  });

  return archived
    ? `${theme.name} archived. Published stylesheets keep serving.`
    : `${theme.name} restored.`;
}

export async function publishTheme(
  auth: Authorized,
  base: BaseTokens,
  themeId: ObjectId,
): Promise<{ version: number; href: string }> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const result = validateTheme(base, theme.slug, theme.tokens, new Date().toISOString());
  if (!result.ok) {
    throw new ThemeError(
      `This theme cannot be published: ${result.problems.length} accessibility failure(s).`,
      result.problems.map((p) => p.message),
    );
  }

  const version = (theme.liveVersion ?? 0) + 1;
  const now = new Date();
  const actor = new ObjectId(auth.member.id);

  // The unique index on { themeId, version } is what makes a double publish an
  // error rather than two documents claiming to be version 7.
  await auth.data.versions.insertOne({
    _id: new ObjectId(),
    themeId,
    version,
    tokens: theme.tokens,
    validation: result.record,
    publishedAt: now,
    publishedBy: actor,
    // Snapshotted, not referenced — see `ThemeVersionDoc.assets`.
    ...(theme.assets ? { assets: theme.assets } : {}),
  } as Omit<ThemeVersionDoc, "orgId">);

  await auth.data.themes.updateOne(
    { _id: themeId },
    { $set: { status: "published", liveVersion: version, updatedAt: now, updatedBy: actor } },
  );

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: actor,
    action: "theme.published",
    subject: `${theme.slug}@${version}`,
    at: now,
  });

  const org = await orgSlug(auth);
  return { version, href: themeHref(org, theme.slug, version) };
}

/**
 * Roll back to an earlier version.
 *
 * Writes a *new* version rather than moving the pointer backwards, so the audit
 * trail stays append-only and "we were on 5, then 8, then 5 again" is legible.
 * The old version is re-validated first: restoring must not be a way to put a
 * palette live that today's rules would refuse.
 */
export async function rollbackTheme(
  auth: Authorized,
  base: BaseTokens,
  themeId: ObjectId,
  toVersion: number,
  reason: string,
): Promise<{ version: number }> {
  if (reason.trim().length < 10) {
    throw new ThemeError("Give a reason of at least 10 characters.", [
      "A rollback with no reason is unreadable a year later.",
    ]);
  }

  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const target = await auth.data.versions.findOne({ themeId, version: toVersion });
  if (!target) throw new ThemeError(`No version ${toVersion}.`);

  const result = validateTheme(base, theme.slug, target.tokens, new Date().toISOString());
  if (!result.ok) {
    throw new ThemeError(
      `Version ${toVersion} was validated by ${target.validation.validatorVersion} and does not pass the current rules (${VALIDATOR_VERSION}).`,
      result.problems.map((p) => p.message),
    );
  }

  const version = (theme.liveVersion ?? 0) + 1;
  const now = new Date();
  const actor = new ObjectId(auth.member.id);

  await auth.data.versions.insertOne({
    _id: new ObjectId(),
    themeId,
    version,
    tokens: target.tokens,
    validation: result.record,
    publishedAt: now,
    publishedBy: actor,
    rolledBackFrom: toVersion,
    reason,
    // The fonts as well as the tokens. Restoring a palette and leaving a later
    // typeface in place would produce a version that never existed — and the
    // reason to roll back is usually "put it back how it was", not "put the
    // colours back".
    ...(target.assets ? { assets: target.assets } : {}),
  } as Omit<ThemeVersionDoc, "orgId">);

  await auth.data.themes.updateOne(
    { _id: themeId },
    {
      $set: {
        tokens: target.tokens,
        liveVersion: version,
        updatedAt: now,
        updatedBy: actor,
        ...(target.assets ? { assets: target.assets } : {}),
      },
    },
  );

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: actor,
    action: "theme.rolledback",
    subject: `${theme.slug}@${version}`,
    detail: `restored ${toVersion}: ${reason}`,
    at: now,
  });

  return { version };
}

/** The stylesheet for a published version, or nothing. */
export async function versionCss(
  auth: Authorized,
  themeId: ObjectId,
  version: number,
): Promise<string | undefined> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  const doc = await auth.data.versions.findOne({ themeId, version });
  if (!theme || !doc) return undefined;

  return emitThemeCss({
    id: themeId.toHexString(),
    orgId: auth.data.orgId.toHexString(),
    name: theme.name,
    slug: theme.slug,
    version: doc.version,
    status: "published",
    tokens: doc.tokens,
    assets: doc.assets ?? emptyAssets(),
    validation: doc.validation,
    audit: {
      createdBy: theme.createdBy.toHexString(),
      createdAt: theme.createdAt.toISOString(),
      publishedBy: doc.publishedBy.toHexString(),
      publishedAt: doc.publishedAt.toISOString(),
    },
  });
}

export async function orgSlug(auth: Authorized): Promise<string> {
  const org = await auth.data.organisation.get();
  return org?.slug ?? "unknown";
}

/**
 * A theme in one of the five export formats.
 *
 * Exports the *published* version when there is one, falling back to the draft.
 * A customer downloading "our theme" means the one their applications are
 * running, not whatever is half-edited in another tab — and handing them a
 * draft under the published version number would be a file that claims to be
 * something it is not.
 */
export async function exportThemeAs(
  auth: Authorized,
  themeId: ObjectId,
  format: ExportFormat,
): Promise<ExportResult> {
  const theme = await auth.data.themes.findOne({ _id: themeId });
  if (!theme) throw new ThemeError("No such theme.");

  const published = theme.liveVersion
    ? await auth.data.versions.findOne({ themeId, version: theme.liveVersion })
    : null;

  return exportTheme(
    {
      id: themeId.toHexString(),
      orgId: auth.data.orgId.toHexString(),
      name: theme.name,
      slug: theme.slug,
      version: published?.version ?? 0,
      status: published ? "published" : "draft",
      // A published version's tokens went through the publish path and are
      // complete; a draft's are whatever has been written to. Normalised so
      // the export has one shape whichever branch it came from.
      tokens: published?.tokens ?? withTierDefaults(theme.tokens),
      assets: published?.assets ?? theme.assets ?? emptyAssets(),
      ...(published ? { validation: published.validation } : {}),
      audit: {
        createdBy: theme.createdBy.toHexString(),
        createdAt: theme.createdAt.toISOString(),
        ...(published
          ? {
              publishedBy: published.publishedBy.toHexString(),
              publishedAt: published.publishedAt.toISOString(),
            }
          : {}),
      },
    },
    format,
  );
}

/**
 * Read an uploaded file into a palette, without saving anything.
 *
 * Deliberately a preview. An import that writes on upload gives a customer no
 * chance to see that their status colours were discarded, and the first they
 * would hear of it is a support conversation about a red that did not change.
 * The report is what the screen shows before anything is confirmed.
 */
export function previewImport(raw: string): ImportReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ThemeError("That file is not JSON.", [
      "Export from Tokens Studio, Figma Variables, or paste an antd or MUI theme object.",
    ]);
  }

  const record = (parsed ?? {}) as Record<string, unknown>;

  // A framework theme object has `token` or `palette` at the root; a DTCG
  // document has token groups. Sniffing beats asking the customer which kind
  // of file they have, which they often do not know.
  const isFrameworkTheme = "token" in record || "palette" in record;
  const report = isFrameworkTheme ? importFrameworkTheme(parsed) : importDtcg(parsed);

  if (Object.keys(report.matched).length === 0) {
    throw new ThemeError("Nothing in that file maps onto a palette.", [
      ...report.unmatched.slice(0, 6).map((path) => `${path} has no counterpart here`),
      "A theme sets the primitive ramp (ref.*). Semantic and clinical tokens are not customer-configurable.",
    ]);
  }

  return report;
}

/** Apply a previewed import to a draft. Never touches a published version. */
export async function applyImport(
  auth: Authorized,
  themeId: ObjectId,
  report: ImportReport,
): Promise<void> {
  const steps = Object.values(report.matched).reduce((n, g) => n + Object.keys(g).length, 0);

  await saveDraft(
    auth,
    themeId,
    { ref: report.matched },
    `imported ${steps} step(s); discarded ${report.discardedClinical.length} clinical token(s)`,
  );
}
