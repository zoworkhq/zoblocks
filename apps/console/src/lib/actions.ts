"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { unscopedMemberByEmail, unscopedSignUp } from "@/db/scope";
import {
  changePassword,
  clearFailures,
  consumePasswordReset,
  createPasswordReset,
  createSession,
  currentMember,
  currentSessionToken,
  destroySession,
  hashPassword,
  isThrottled,
  recordFailure,
  verifyPassword,
} from "./auth";
import { MAX_LOGO_BYTES, brandAsset } from "@oxygenui-design/theme";
import { authorize } from "./authorize";
import { baseTokens } from "./base-tokens";
import { MAX_FONT_BYTES, removeFont, uploadFont } from "./fonts";
import { removeBrandAsset, uploadBrandAsset } from "./brand-assets";
import { MAX_ICON_BYTES, removeIcon, uploadIcons } from "./icons";
import { MemberError, approveMember, changeRole, setMemberStatus } from "./members";
import { OrganisationError, setFrameworks, updateOrganisation } from "./organisation";
import { MarketError } from "./market/entitlements";
import { createCheckout } from "./market/checkout";
import { install } from "./market/install";
import { grant } from "./market/entitlements";
import { itemBySlug } from "./market/catalogue";
import { mintToken, revokeToken } from "./market/tokens";
import { TOKEN_SCOPES, type TokenScope } from "@/db/collections";
import {
  ThemeError,
  applyImport,
  createTheme,
  previewImport,
  publishTheme,
  rollbackTheme,
  saveBrand,
  setThemeArchived,
  saveOverrides,
} from "./themes";

/**
 * The server-action layer.
 *
 * Thin on purpose. Every operation lives in `themes.ts` as a plain async
 * function so the whole lifecycle is testable without Next's request context;
 * these wrappers do three things and nothing else — authorise, parse, and turn
 * a thrown error into something a form can render.
 */

export interface ActionResult {
  ok: boolean;
  message?: string;
  problems?: string[];
}

/**
 * One shape for every failure.
 *
 * A thrown `NotPermittedError` already carries a message naming the role that
 * *can* do the thing, so it is surfaced verbatim rather than flattened into
 * "forbidden" — the difference between a wall and a route.
 */
async function run(fn: () => Promise<void | string>): Promise<ActionResult> {
  try {
    const message = await fn();
    return { ok: true, ...(message ? { message } : {}) };
  } catch (error) {
    if (error instanceof ThemeError) {
      return { ok: false, message: error.message, problems: error.problems };
    }
    if (error instanceof OrganisationError) {
      return { ok: false, message: error.message, problems: error.problems };
    }
    if (error instanceof MemberError) {
      return { ok: false, message: error.message, problems: error.problems };
    }
    if (error instanceof MarketError) {
      return { ok: false, message: error.message, problems: error.problems };
    }
    if (error instanceof Error && error.name.startsWith("Not")) {
      return { ok: false, message: error.message };
    }
    throw error;
  }
}

const createInput = z.object({
  name: z.string().trim().min(1, "Give the theme a name.").max(60),
  brandColour: z.string().trim(),
});

export async function createThemeAction(form: FormData): Promise<ActionResult> {
  const parsed = createInput.safeParse({
    name: form.get("name"),
    brandColour: form.get("brandColour"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  let slug: string | undefined;
  const result = await run(async () => {
    const auth = await authorize("theme.write");
    ({ slug } = await createTheme(auth, parsed.data));
  });

  if (result.ok && slug) {
    revalidatePath("/themes");
    redirect(`/themes/${slug}`);
  }
  return result;
}

export async function publishThemeAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };

  return run(async () => {
    const auth = await authorize("theme.publish");
    const { version, href } = await publishTheme(auth, await baseTokens(), new ObjectId(themeId));
    revalidatePath("/themes");
    return `Published v${version}. Link ${href} from your application.`;
  });
}

export async function rollbackThemeAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  const toVersion = Number(form.get("toVersion"));
  const reason = String(form.get("reason") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };

  return run(async () => {
    const auth = await authorize("theme.rollback");
    const { version } = await rollbackTheme(
      auth,
      await baseTokens(),
      new ObjectId(themeId),
      toVersion,
      reason,
    );
    revalidatePath("/themes");
    return `Restored v${toVersion} as v${version}.`;
  });
}

/**
 * Preview an import, then apply it.
 *
 * Both in one action, deliberately: a two-step flow would need the parsed
 * report held somewhere between requests, and the report is cheap to recompute.
 * What matters is that the *result* names what was discarded, so a customer
 * sees it rather than discovering later that their status colours did not take.
 */
export async function importThemeAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  const payload = String(form.get("payload") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };

  return run(async () => {
    const auth = await authorize("theme.write");
    const report = previewImport(payload);
    await applyImport(auth, new ObjectId(themeId), report);

    const steps = Object.values(report.matched).reduce((n, g) => n + Object.keys(g).length, 0);
    const notes = [`Imported ${steps} palette step(s) into the draft.`];
    if (report.discardedClinical.length) {
      notes.push(
        `Discarded ${report.discardedClinical.length} clinical token(s): they keep Oxygen's validated values.`,
      );
    }
    if (report.unmatched.length) {
      notes.push(`${report.unmatched.length} key(s) had no counterpart and were ignored.`);
    }
    revalidatePath("/themes");
    return notes.join(" ");
  });
}

/**
 * Save the semantic and component overrides for one theme.
 *
 * The whole override set in one action rather than a request per field. A theme
 * is validated as a *set* — moving `text` and `surface` together can pass where
 * either alone would fail — so a per-field save would have to either reject an
 * intermediate state the customer was on their way through, or accept one that
 * fails, and both are wrong. The editor holds the draft and submits it.
 */
const overridesInput = z.object({
  themeId: z.string(),
  /** The two override tiers, as JSON. Parsed and re-validated on the server. */
  overrides: z.string().max(200_000),
});

export async function saveOverridesAction(form: FormData): Promise<ActionResult> {
  const parsed = overridesInput.safeParse({
    themeId: form.get("themeId"),
    overrides: form.get("overrides"),
  });
  if (!parsed.success || !ObjectId.isValid(parsed.data.themeId)) {
    return { ok: false, message: "Check the form." };
  }

  return run(async () => {
    const auth = await authorize("theme.write");
    const { changed } = await saveOverrides(
      auth,
      await baseTokens(),
      new ObjectId(parsed.data.themeId),
      JSON.parse(parsed.data.overrides),
    );
    revalidatePath("/themes");
    return changed === 0
      ? "No change."
      : `Saved ${changed} override${changed === 1 ? "" : "s"} to the draft.`;
  });
}

/**
 * Save the brand ramp.
 *
 * The whole ramp in one payload, for the same reason overrides are: eleven
 * steps are a set, and the gate judges them together.
 */
const brandInput = z.object({ themeId: z.string(), ramp: z.string().max(20_000) });

export async function saveBrandAction(form: FormData): Promise<ActionResult> {
  const parsed = brandInput.safeParse({
    themeId: form.get("themeId"),
    ramp: form.get("ramp"),
  });
  if (!parsed.success || !ObjectId.isValid(parsed.data.themeId)) {
    return { ok: false, message: "Check the form." };
  }

  return run(async () => {
    const auth = await authorize("theme.write");
    const { steps } = await saveBrand(
      auth,
      await baseTokens(),
      new ObjectId(parsed.data.themeId),
      JSON.parse(parsed.data.ramp),
    );
    revalidatePath("/themes");
    return `Saved a ${steps}-step ramp to the draft.`;
  });
}

/**
 * Upload a font file.
 *
 * The bytes arrive as a `File` in the FormData, which is why this action does
 * its own parsing rather than going through zod: a `File` is not something a
 * schema for strings has an opinion about, and the real check is
 * `checkFont`, which reads the magic number rather than the name.
 *
 * The size is checked here as well as in `checkFont` — cheaply, before the
 * bytes are read into memory. Work proportional to an attacker-supplied length
 * is the cheapest denial of service there is.
 */
export async function uploadFontAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  const family = String(form.get("family") ?? "");
  const weight = String(form.get("weight") ?? "400");
  const file = form.get("file");

  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a font file." };
  }
  if (file.size > MAX_FONT_BYTES) {
    return {
      ok: false,
      message: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_FONT_BYTES / 1024 / 1024} MB.`,
    };
  }

  return run(async () => {
    const auth = await authorize("theme.write");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { face, tabularNumerals, reused } = await uploadFont(auth, new ObjectId(themeId), {
      bytes,
      filename: file.name,
      family,
      weight,
    });

    revalidatePath("/themes");

    const notes = [`${face.family} accepted${reused ? " (already stored — same bytes)" : ""}.`];
    if (tabularNumerals === false) {
      notes.push(
        "This face does not advertise tabular figures. Numeric columns will be ragged, which is invisible in a heading and obvious in a vitals table.",
      );
    } else if (tabularNumerals === undefined) {
      notes.push(
        "Tabular figures could not be read from this container — woff2 is compressed, and unpacking it here would only produce a guess. Check the specimen.",
      );
    }
    return notes.join(" ");
  });
}

export async function removeFontAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  const family = String(form.get("family") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };

  return run(async () => {
    const auth = await authorize("theme.write");
    await removeFont(auth, new ObjectId(themeId), family);
    revalidatePath("/themes");
    return `Removed ${family}. The uploaded bytes are kept — another theme may reference them.`;
  });
}

/* -------------------------------------------------------------------------- */
/* Organisation                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Which frameworks this organisation's applications run on.
 *
 * The form submits one `framework` entry per checked box and none at all when
 * every box is cleared — which is a legitimate state, not a malformed
 * submission, so `getAll` on an absent field returning `[]` is exactly right
 * here. A required field would make "we use neither" unreachable.
 */
export async function setFrameworksAction(form: FormData): Promise<ActionResult> {
  const selected = form.getAll("framework").map(String);

  return run(async () => {
    const auth = await authorize("org.configure");
    const message = await setFrameworks(auth, selected);
    revalidatePath("/frameworks");
    return message;
  });
}

const organisationInput = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(48),
});

export async function updateOrganisationAction(form: FormData): Promise<ActionResult> {
  const parsed = organisationInput.safeParse({
    name: form.get("name"),
    slug: form.get("slug"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  return run(async () => {
    const auth = await authorize("org.configure");
    const message = await updateOrganisation(auth, parsed.data);
    revalidatePath("/settings");
    return message;
  });
}

/* -------------------------------------------------------------------------- */
/* Members                                                                    */
/* -------------------------------------------------------------------------- */

const memberInput = z.object({
  memberId: z.string(),
  role: z.enum(["admin", "designer", "developer", "viewer"]).optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

/**
 * One action for the three member mutations.
 *
 * They share an authorisation check, a subject, and an error shape, and the
 * only thing that differs is which field arrived — so three near-identical
 * wrappers would be three places for the capability check to drift.
 */
export async function updateMemberAction(form: FormData): Promise<ActionResult> {
  const parsed = memberInput.safeParse({
    memberId: form.get("memberId"),
    role: form.get("role") ?? undefined,
    status: form.get("status") ?? undefined,
  });
  if (!parsed.success || !ObjectId.isValid(parsed.data.memberId)) {
    return { ok: false, message: "Check the form." };
  }

  const intent = String(form.get("intent") ?? "");
  const memberId = new ObjectId(parsed.data.memberId);

  return run(async () => {
    const auth = await authorize("member.manage");
    let message: string;

    if (intent === "approve") {
      message = await approveMember(auth, memberId, parsed.data.role ?? "viewer");
    } else if (intent === "status" && parsed.data.status) {
      message = await setMemberStatus(auth, memberId, parsed.data.status);
    } else if (intent === "role" && parsed.data.role) {
      message = await changeRole(auth, memberId, parsed.data.role);
    } else {
      throw new MemberError("That is not something this form can do.");
    }

    revalidatePath("/members");
    return message;
  });
}

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

/** One message for every failure mode, so the form cannot enumerate accounts. */
const SIGNIN_FAILED = "That email and password combination is not recognised.";

const signInInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  /**
   * Any non-empty password. Enforcing a minimum here would reject a credential
   * before checking it, locking out anyone whose password predates the rule —
   * a policy about what you may *choose* is not a policy about what you may
   * *present*.
   */
  password: z.string().min(1),
});

export async function signInAction(form: FormData): Promise<ActionResult> {
  const parsed = signInInput.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { ok: false, message: SIGNIN_FAILED };
  const { email, password } = parsed.data;

  // Checked before the password, so a guessing run costs nothing to refuse.
  if (await isThrottled(email)) {
    return { ok: false, message: "Too many failed attempts. Wait a few minutes and try again." };
  }

  const member = await unscopedMemberByEmail(email);

  // Hashed even when the member is missing, so a wrong address and a wrong
  // password take the same time and cannot be told apart with a stopwatch.
  const hash =
    member?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const ok = await verifyPassword(password, hash);

  if (!member || !ok) {
    await recordFailure(email);
    return { ok: false, message: SIGNIN_FAILED };
  }
  if (member.status === "pending") {
    return { ok: false, message: "This account is waiting for an administrator to approve it." };
  }
  if (member.status === "disabled") {
    // Recorded and given the generic message: a disabled account must not be
    // distinguishable from a wrong password.
    await recordFailure(email);
    return { ok: false, message: SIGNIN_FAILED };
  }

  await clearFailures(email);
  await createSession(member._id);
  redirect("/themes");
}

/**
 * Sign up.
 *
 * Creates a *pending* person and nothing else. hq's rule, carried over: signing
 * up creates a person, an administrator decides what they may do — so there is
 * no role to choose here and no access granted by completing the form.
 *
 * One message for every failure, exactly as sign-in has. "That organisation
 * does not exist" and "that email is taken" are both useful to a legitimate
 * user and both are enumeration oracles, so neither is said. The person is told
 * what to do next instead, which is the same in both cases: talk to their
 * administrator.
 */
const signUpInput = z.object({
  name: z.string().trim().min(1, "Give your name.").max(80),
  email: z.string().trim().toLowerCase().email("That is not an email address."),
  password: z.string().min(12, "Use at least 12 characters. Length beats punctuation."),
  organisation: z.string().trim().min(1, "Which organisation are you joining?"),
});

export async function signUpAction(form: FormData): Promise<ActionResult> {
  const parsed = signUpInput.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    organisation: form.get("organisation"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { name, email, password, organisation } = parsed.data;

  const result = await unscopedSignUp(organisation, {
    name,
    email,
    emailLower: email,
    passwordHash: await hashPassword(password),
    // Never chosen at sign-up. The role decides whether somebody can publish to
    // a production application, so it is granted by a person.
    role: "viewer",
    status: "pending",
    createdAt: new Date(),
    approvedAt: null,
    approvedBy: null,
  });

  if (!result.ok) {
    return {
      ok: false,
      message: "That request could not be completed.",
      problems: [
        "Check the organisation address with your administrator — it is the short name in your console URLs.",
        "If you already have an account, sign in instead.",
      ],
    };
  }

  redirect("/pending");
}

/**
 * Spend a reset grant and choose a new password.
 *
 * The grant is single-use and every session on the account is destroyed by
 * `consumePasswordReset` — a reset exists because control of the account is in
 * doubt, so leaving old sessions signed in would defeat the point.
 *
 * One message for every failure, exactly as sign-in has: expired, already used
 * and never-existed are indistinguishable to anyone holding a bad token.
 */
const resetInput = z.object({
  token: z.string().min(1),
  password: z.string().min(12, "Use at least 12 characters. Length beats punctuation."),
});

export async function resetPasswordAction(form: FormData): Promise<ActionResult> {
  const parsed = resetInput.safeParse({
    token: form.get("token"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const ok = await consumePasswordReset(parsed.data.token, parsed.data.password);
  if (!ok) {
    return {
      ok: false,
      message: "That link cannot be used.",
      problems: [
        "It may have expired, already been used, or been replaced by a newer one.",
        "Ask an administrator in your organisation to issue another.",
      ],
    };
  }

  redirect("/login?reset=1");
}

/**
 * Issue a reset link for another member.
 *
 * Returns the raw token exactly once — only its hash is stored, so it is never
 * recoverable afterwards. The administrator hands it over; nothing is emailed.
 */
export async function issueResetAction(form: FormData): Promise<ActionResult> {
  const memberId = String(form.get("memberId") ?? "");
  if (!ObjectId.isValid(memberId)) return { ok: false, message: "Unknown member." };

  return run(async () => {
    const auth = await authorize("member.manage");

    const member = await auth.data.members.findOne({ _id: new ObjectId(memberId) });
    if (!member) throw new MemberError("No such member.");
    if (member.status === "disabled") {
      throw new MemberError("That account is disabled.", [
        "Re-enable it first — a link minted for a disabled account will not work.",
      ]);
    }

    const { token, expiresAt } = await createPasswordReset(
      new ObjectId(memberId),
      new ObjectId(auth.member.id),
    );

    revalidatePath("/members");
    return `Send ${member.name} this link before ${expiresAt.toISOString().slice(11, 16)} UTC: /reset?token=${token}`;
  });
}

/**
 * Change your own password, knowing the current one.
 *
 * Distinct from `resetPasswordAction` in the one way that matters: this proves
 * possession of the existing password, so it is not evidence that the account
 * was compromised. `changePassword` therefore keeps the session that made the
 * change and drops every other — the other devices are signed out without
 * signing this one out, which is what somebody doing routine hygiene expects.
 * A reset destroys all of them, because a reset means control was in doubt.
 *
 * The current password is checked inside `changePassword` rather than here, so
 * the comparison stays beside the hashing that produced it.
 */
const changePasswordInput = z.object({
  current: z.string().min(1, "Enter your current password."),
  password: z.string().min(12, "Use at least 12 characters. Length beats punctuation."),
});

export async function changePasswordAction(form: FormData): Promise<ActionResult> {
  const member = await currentMember();
  if (!member) return { ok: false, message: "Sign in again." };

  const parsed = changePasswordInput.safeParse({
    current: form.get("current"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  if (parsed.data.current === parsed.data.password) {
    return { ok: false, message: "That is the password you already have." };
  }

  const ok = await changePassword(
    new ObjectId(member.id),
    parsed.data.current,
    parsed.data.password,
    await currentSessionToken(),
  );

  // One message, and it does not distinguish "wrong current password" from
  // anything else — the same reasoning as sign-in.
  if (!ok) {
    return {
      ok: false,
      message: "That did not work.",
      problems: ["Check your current password and try again."],
    };
  }

  return {
    ok: true,
    message: "Password changed. Every other device has been signed out.",
  };
}

/**
 * Archive a theme, or bring it back.
 *
 * Behind `theme.archive`, which was a declared capability enforced at zero call
 * sites until now — the role table promised a precision the code did not
 * implement.
 */
export async function archiveThemeAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };
  const archived = form.get("archived") === "true";

  return run(async () => {
    const auth = await authorize("theme.archive");
    const message = await setThemeArchived(auth, new ObjectId(themeId), archived);
    revalidatePath("/themes");
    revalidatePath(`/themes`);
    return message;
  });
}

/**
 * Upload brand artwork.
 *
 * `theme.write`, like a font: artwork is part of the theme rather than part of
 * the organisation, so it versions and publishes with everything else. The
 * refusal path is the interesting one — `checkBrandAsset` rejects an SVG that
 * can execute, and the message says which construct it found, because "invalid
 * file" sends a designer back to the export settings that produced it.
 */
export async function uploadBrandAssetAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };

  /*
   * Two ways in, one path afterwards.
   *
   * A file from the picker, or a PNG the browser cut out of the wordmark. The
   * derived one is decoded here and then goes through `checkBrandAsset` like
   * anything else — a picture this console generated is not a picture this
   * console trusts, and the day somebody posts a `derived` field by hand is
   * the day that distinction earns its keep.
   */
  const derived = String(form.get("derived") ?? "");
  let bytes: Uint8Array;
  let filename: string;

  if (derived) {
    const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(derived);
    if (!match?.[1]) return { ok: false, message: "That crop could not be read." };

    bytes = new Uint8Array(Buffer.from(match[1], "base64"));
    filename = "derived.png";
    if (bytes.byteLength > MAX_LOGO_BYTES) {
      return { ok: false, message: "That crop came out larger than the limit." };
    }
  } else {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "Choose a file to upload." };
    }
    if (file.size > MAX_LOGO_BYTES) {
      return {
        ok: false,
        message: `That file is larger than ${MAX_LOGO_BYTES / 1024} KB.`,
      };
    }
    bytes = new Uint8Array(await file.arrayBuffer());
    filename = file.name;
  }

  return run(async () => {
    const auth = await authorize("theme.write");
    const { asset, warnings } = await uploadBrandAsset(auth, new ObjectId(themeId), {
      bytes,
      filename,
      role: String(form.get("role") ?? ""),
      alt: String(form.get("alt") ?? ""),
    });
    revalidatePath("/themes");

    /*
     * A warning rides back on the success message rather than replacing it.
     *
     * "Saved, and it will be cropped" is two true things, and the shape most
     * uploads take: the artwork is fine, the ratio is not what the slot wants,
     * and the person needs to know without being blocked at four in the
     * afternoon by the only file they have.
     */
    return [`${brandAsset(asset.role).label} saved.`, ...warnings].join(" ");
  });
}

export async function removeBrandAssetAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };

  return run(async () => {
    const auth = await authorize("theme.write");
    await removeBrandAsset(auth, new ObjectId(themeId), String(form.get("role") ?? ""));
    revalidatePath("/themes");
    return "Removed.";
  });
}

/**
 * Replace one glyph, or a whole set at once.
 *
 * The bulk path is why this takes a list rather than a file: a design team
 * delivers an icon set as a folder, and twenty-nine separate uploads is a
 * feature somebody uses once and then stops using. Files are matched to slots
 * by their name — `send.svg` fills the send slot — which is the convention
 * every icon set already follows, so nothing has to be renamed first.
 *
 * A file that matches no slot is reported rather than dropped. Silently
 * ignoring `arrow-right.svg` leaves somebody convinced the upload worked and
 * looking at an unchanged toolbar.
 */
export async function uploadIconsAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };

  const picked = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (picked.length === 0) return { ok: false, message: "Choose at least one SVG." };
  if (picked.length > 60) return { ok: false, message: "That is more files than there are slots." };

  // An explicit slot when one glyph is being replaced; otherwise the filename.
  const explicit = String(form.get("slot") ?? "");

  const files: { slot: string; name: string; bytes: Uint8Array }[] = [];
  for (const file of picked) {
    if (file.size > MAX_ICON_BYTES) {
      return { ok: false, message: `${file.name} is larger than ${MAX_ICON_BYTES / 1024} KB.` };
    }
    files.push({
      slot: explicit || file.name.replace(/\.svg$/i, "").toLowerCase(),
      name: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
  }

  return run(async () => {
    const auth = await authorize("theme.write");
    const { saved, skipped } = await uploadIcons(auth, new ObjectId(themeId), files);
    revalidatePath("/themes");

    if (saved.length === 0) {
      throw new ThemeError(
        "Nothing was saved.",
        skipped.map((s) => `${s.name} — ${s.reason}`),
      );
    }

    const note = `${saved.length} glyph${saved.length === 1 ? "" : "s"} replaced.`;
    return skipped.length === 0
      ? note
      : `${note} ${skipped.length} skipped: ${skipped.map((s) => `${s.name} (${s.reason})`).join("; ")}`;
  });
}

export async function removeIconAction(form: FormData): Promise<ActionResult> {
  const themeId = String(form.get("themeId") ?? "");
  if (!ObjectId.isValid(themeId)) return { ok: false, message: "Unknown theme." };

  return run(async () => {
    const auth = await authorize("theme.write");
    await removeIcon(auth, new ObjectId(themeId), String(form.get("slot") ?? ""));
    revalidatePath("/themes");
    return "Back to the shipped glyph.";
  });
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/* ==========================================================================
 * Marketplace
 * ======================================================================== */

/**
 * The origin this request arrived on, for Stripe's return URLs.
 *
 * Taken from the request rather than from configuration, for the reason the
 * theme manifest route already gives: a console reachable on a vanity domain
 * and on the hostname the platform assigns must not send a customer back to
 * the other one, and the caller has already proved which one resolves for them
 * by reaching this line.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:6003";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Start a purchase.
 *
 * The only thing this accepts from the browser is a catalogue slug. Price,
 * currency and the Stripe Price id are read from `catalogItems` inside
 * `createCheckout` — an action that took a price would sell a $450 component
 * for whatever the form said, with a valid receipt to show for it.
 */
export async function buyAction(form: FormData): Promise<ActionResult> {
  const slug = String(form.get("slug") ?? "");

  let url: string | undefined;
  const result = await run(async () => {
    const auth = await authorize("market.purchase");
    ({ url } = await createCheckout(auth, slug, await requestOrigin()));
  });

  // Outside `run`, because `redirect` works by throwing and the catch above
  // would treat Next's control flow as a failed action.
  if (result.ok && url) redirect(url);
  return result;
}

export async function installAction(form: FormData): Promise<ActionResult> {
  const slug = String(form.get("slug") ?? "");
  const themeId = String(form.get("themeId") ?? "");

  return run(async () => {
    const auth = await authorize("market.install");
    const { message } = await install(
      auth,
      slug,
      ObjectId.isValid(themeId) ? new ObjectId(themeId) : undefined,
    );
    revalidatePath("/market");
    revalidatePath("/themes");
    return message;
  });
}

/**
 * Grant an item without a payment.
 *
 * The fourth way money arrives, and the reason the entitlement model exists
 * separately from Stripe: a pack included in an engagement is delivered by the
 * same machinery as a card purchase, with a reason and an actor on the record
 * rather than an email and a zip file.
 */
export async function grantAction(form: FormData): Promise<ActionResult> {
  const slug = String(form.get("slug") ?? "");
  const reason = String(form.get("reason") ?? "").trim();

  return run(async () => {
    const auth = await authorize("market.purchase");
    if (!reason)
      throw new MarketError("Say why this is being granted.", [
        "It goes on the entitlement and into the audit trail, and it is what a later reader has to work from.",
      ]);

    const item = await itemBySlug(slug);
    await grant(auth.member.orgId, item._id, {
      via: `contract:${reason}`,
      by: new ObjectId(auth.member.id),
      versionLine: item.liveVersion,
    });

    await auth.data.audit.insertOne({
      _id: new ObjectId(),
      actorId: new ObjectId(auth.member.id),
      action: "market.granted",
      subject: item.slug,
      detail: reason,
      at: new Date(),
    });

    revalidatePath("/market");
    return `${item.title} is now available to this organisation.`;
  });
}

/**
 * Mint a CLI token.
 *
 * The value is returned in the result message because this is the only moment
 * it exists outside the customer's machine — the database holds its SHA-256
 * and nothing else, so there is no screen that can ever show it again.
 */
export async function mintTokenAction(form: FormData): Promise<ActionResult> {
  const label = String(form.get("label") ?? "");
  const raw = String(form.get("scope") ?? "registry");

  return run(async () => {
    /*
     * The scope decides the capability, and it is validated before either.
     *
     * A form value reaching `authorize()` unchecked would be a caller choosing
     * which permission to be measured against — so an unknown scope is refused
     * here rather than defaulting, which would silently mint the wrong kind of
     * key for whoever typo'd it.
     */
    if (!TOKEN_SCOPES.includes(raw as TokenScope)) throw new ThemeError("Unknown token scope.");
    const scope = raw as TokenScope;

    const auth = await authorize(scope === "figma" ? "plugin.token" : "market.token");
    const { token, expiresAt } = await mintToken(auth, label, scope);
    revalidatePath("/market/tokens");
    return `${token} — copy it now. It expires ${expiresAt.toISOString().slice(0, 10)} and cannot be shown again.`;
  });
}

export async function revokeTokenAction(form: FormData): Promise<ActionResult> {
  const hash = String(form.get("hash") ?? "");

  return run(async () => {
    // Revoking is the safe direction, so it takes the capability every holder
    // of either kind already has rather than making somebody prove which kind
    // they are about to stop.
    const auth = await authorize("market.token");
    await revokeToken(auth, hash);
    revalidatePath("/market/tokens");
    return "Revoked. Any machine using it will stop installing on its next request.";
  });
}
