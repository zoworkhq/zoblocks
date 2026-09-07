/**
 * The API the Figma plugin talks to.
 *
 * Three endpoints, and everything worth asserting is a refusal. The endpoints
 * themselves are thin — they read a token, call a function the app already
 * calls, and serialise the result. What is new here is a *second way to
 * authenticate*, and a second authentication path is a second place to get
 * tenant isolation wrong.
 *
 * So the shape of this file follows that risk. Every isolation test seeds two
 * organisations with the **same theme slug**, because a scoping bug that
 * returns the wrong customer's document only shows up when there is a document
 * to return.
 */

import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { GET as listRoute } from "@/app/api/v1/themes/route";
import { GET as resolvedRoute } from "@/app/api/v1/themes/[slug]/resolved/route";
import { POST as draftRoute } from "@/app/api/v1/themes/[slug]/draft/route";
import { GET as registryRoute } from "@/app/r/pro/[name]/route";
import { createTheme, publishTheme, saveOverrides, setThemeArchived } from "@/lib/themes";
import { hashToken, mintToken } from "@/lib/market/tokens";
import type { Authorized } from "@/lib/authorize";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@zoblocks/tokens/validate";
import { twoOrgs } from "./harness";

let cached: TokenSource;
const base = async () => (cached ??= await loadTokenSource());

const ORIGIN = "https://app.example.test";

function get(path: string, token?: string): Request {
  return new Request(`${ORIGIN}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function post(path: string, token: string | undefined, body: unknown): Request {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const slugParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

/** A theme plus a Figma key that reaches it. */
async function withKey(auth: Authorized, name = "Clinical") {
  const theme = await createTheme(auth, { name, brandColour: "#1d63c9" });
  const { token } = await mintToken(auth, "Ada's Figma", "figma");
  return { theme, token };
}

describe("the credential", () => {
  it("asks for one rather than pretending nothing is there", async () => {
    const response = await listRoute(get("/api/v1/themes"));
    expect(response.status).toBe(401);
    // A missing credential is a configuration mistake, and the header is what
    // tells a client to look for one instead of reporting the theme as absent.
    expect(response.headers.get("www-authenticate")).toContain("Bearer");
  });

  it("says nothing about an unknown one", async () => {
    const response = await listRoute(get("/api/v1/themes", "zb_live_nope"));
    expect(response.status).toBe(404);
  });

  it("refuses a registry key, which reaches components and not themes", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    const { token } = await mintToken(nw, "CI", "registry");

    expect((await listRoute(get("/api/v1/themes", token))).status).toBe(404);
  });

  it("refuses a Figma key at the component registry, symmetrically", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await mintToken(nw, "Ada's Figma", "figma");

    const response = await registryRoute(get("/r/pro/vitals-flowsheet.json", token), {
      params: Promise.resolve({ name: "vitals-flowsheet.json" }),
    });
    // The point of a scope: a designer's key cannot pull down paid source.
    expect(response.status).toBe(404);
  });

  it("stops working the moment it is revoked", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    expect((await listRoute(get("/api/v1/themes", token))).status).toBe(200);

    await nw.data.registryTokens.updateOne(
      { _id: hashToken(token) },
      { $set: { revokedAt: new Date() } },
    );

    // Immediately, and not at the next TTL sweep.
    expect((await listRoute(get("/api/v1/themes", token))).status).toBe(404);
  });

  it("stops working when it expires, without waiting for the TTL monitor", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    await nw.data.registryTokens.updateOne(
      { _id: hashToken(token) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    expect((await listRoute(get("/api/v1/themes", token))).status).toBe(404);
  });

  it("stops working when the person who minted it is disabled", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    await db().members.updateOne(
      { _id: new ObjectId(nw.member.id) },
      { $set: { status: "disabled" } },
    );

    // A key acts as its creator, so offboarding them is one act rather than a
    // checklist of the credentials they happened to mint.
    expect((await listRoute(get("/api/v1/themes", token))).status).toBe(404);
  });

  it("cannot exceed the role of the person who minted it", async () => {
    const { asNorthwind } = await twoOrgs();
    const admin = await asNorthwind("admin");
    const theme = await createTheme(admin, { name: "Clinical", brandColour: "#1d63c9" });

    const developer = await asNorthwind("developer");
    const { token } = await mintToken(developer, "Dev's key", "figma");

    // A developer holds theme.read and not theme.write.
    expect((await listRoute(get("/api/v1/themes", token))).status).toBe(200);

    const refused = await draftRoute(
      post(`/api/v1/themes/${theme.slug}/draft`, token, { anchor: "#7c3aed" }),
      slugParams(theme.slug),
    );
    expect(refused.status).toBe(403);
    expect((await refused.json()).error).toContain("theme.write");
  });

  it("stamps last use, so a leaked key is visible", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    expect(
      (await nw.data.registryTokens.findOne({ _id: hashToken(token) }))?.lastUsedAt,
    ).toBeNull();
    await listRoute(get("/api/v1/themes", token));
    expect(
      (await nw.data.registryTokens.findOne({ _id: hashToken(token) }))?.lastUsedAt,
    ).toBeInstanceOf(Date);
  });
});

describe("one customer's key cannot reach another's themes", () => {
  /** The same slug in both organisations, or a scoping bug has nothing to hit. */
  async function bothWithClinical() {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();
    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await createTheme(sm, { name: "Clinical", brandColour: "#b91c1c" });
    const { token } = await mintToken(nw, "Ada's Figma", "figma");
    return { nw, sm, token };
  }

  it("lists only its own", async () => {
    const { token } = await bothWithClinical();
    const { themes } = await (await listRoute(get("/api/v1/themes", token))).json();
    expect(themes).toHaveLength(1);
  });

  it("resolves its own theme when the slug collides", async () => {
    const { token } = await bothWithClinical();
    const response = await resolvedRoute(
      get("/api/v1/themes/clinical/resolved", token),
      slugParams("clinical"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    // Northwind's blue, never Southmere's red.
    expect(body.ramp["600"]).toBe("#1d63c9");
  });

  it("drafts into its own theme when the slug collides", async () => {
    const { sm, token } = await bothWithClinical();
    const before = await sm.data.themes.findOne({ slug: "clinical" });

    await draftRoute(
      post("/api/v1/themes/clinical/draft", token, { anchor: "#7c3aed" }),
      slugParams("clinical"),
    );

    const after = await sm.data.themes.findOne({ slug: "clinical" });
    expect(after?.updatedAt).toEqual(before?.updatedAt);
    expect(after?.tokens.ref?.brand?.["600"]).toBe("#b91c1c");
  });

  it("cannot see a theme that exists only in the other organisation", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();
    await createTheme(sm, { name: "Oncology", brandColour: "#b91c1c" });
    const { token } = await mintToken(nw, "Ada's Figma", "figma");

    const response = await resolvedRoute(
      get("/api/v1/themes/oncology/resolved", token),
      slugParams("oncology"),
    );
    expect(response.status).toBe(404);
  });
});

describe("the resolved theme", () => {
  it("carries the ramp, all three themes, and why the clinical tokens are fixed", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    const body = await (
      await resolvedRoute(get("/api/v1/themes/clinical/resolved", token), slugParams("clinical"))
    ).json();

    expect(Object.keys(body.ramp)).toHaveLength(11);
    expect(body.ramp["600"]).toBe("#1d63c9");
    expect(Object.keys(body.semantic).sort()).toEqual(["dark", "high-contrast", "light"]);
    expect(body.semantic.light["--zb-accent"]).toMatch(/^#[0-9a-f]{6}$/);

    // Pushed so a designer can see them, and carrying the reason they cannot be
    // edited — in the same words the app uses.
    expect(body.locked["--zb-status-critical"]).toContain("hue separation");
  });

  it("serves the draft before anything is published, and says so", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    const body = await (
      await resolvedRoute(get("/api/v1/themes/clinical/resolved", token), slugParams("clinical"))
    ).json();

    expect(body).toMatchObject({ status: "draft", version: 0 });
    expect(body.validation).toBeUndefined();
  });

  it("serves the live version once there is one, with its validation record", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);
    await publishTheme(nw, await base(), (await nw.data.themes.findOne({ slug: "clinical" }))!._id);

    const body = await (
      await resolvedRoute(get("/api/v1/themes/clinical/resolved", token), slugParams("clinical"))
    ).json();

    expect(body).toMatchObject({ status: "published", version: 1 });
    // The record travels with the colours, so the plugin can say *this version
    // passed* rather than implying it by having served the file at all.
    expect(body.validation.contrastPairs.failed).toBe(0);
    expect(body.validation.validatorVersion).toBeTruthy();
  });

  it("refuses a version that does not exist rather than falling back", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    // A file pinned to v6 that receives v7's colours under v6's number is
    // something a designer finds out about from a stakeholder.
    const response = await resolvedRoute(
      get("/api/v1/themes/clinical/resolved?version=6", token),
      slugParams("clinical"),
    );
    expect(response.status).toBe(404);
  });

  it("refuses a version that is not a version", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    for (const bad of ["abc", "0", "-1", "1.5"]) {
      const response = await resolvedRoute(
        get(`/api/v1/themes/clinical/resolved?version=${bad}`, token),
        slugParams("clinical"),
      );
      expect(response.status, bad).toBe(400);
    }
  });

  it("is never cached by anything in between", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    const response = await resolvedRoute(
      get("/api/v1/themes/clinical/resolved", token),
      slugParams("clinical"),
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});

describe("the draft endpoint", () => {
  it("derives the ramp from one anchor and hands back an app URL", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    const response = await draftRoute(
      post("/api/v1/themes/clinical/draft", token, { anchor: "#7c3aed" }),
      slugParams("clinical"),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({ slug: "clinical", anchor: "#7c3aed", steps: 11 });
    // Publishing stays an app action by a person with the role for it.
    expect(body.url).toBe(`${ORIGIN}/themes/clinical/brand`);

    const theme = await nw.data.themes.findOne({ slug: "clinical" });
    expect(theme?.tokens.ref?.brand?.["600"]).toBe("#7c3aed");
  });

  it("cannot publish, whatever it is sent", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    await draftRoute(
      post("/api/v1/themes/clinical/draft", token, {
        anchor: "#7c3aed",
        // Everything a caller might hope reaches the publish path.
        publish: true,
        status: "published",
        liveVersion: 9,
        version: 9,
      }),
      slugParams("clinical"),
    );

    const theme = await nw.data.themes.findOne({ slug: "clinical" });
    expect(theme?.liveVersion).toBeNull();
    expect(theme?.status).toBe("draft");
    expect(await nw.data.versions.countDocuments({})).toBe(0);
  });

  it("records which key authored the change", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    await draftRoute(
      post("/api/v1/themes/clinical/draft", token, { anchor: "#7c3aed" }),
      slugParams("clinical"),
    );

    const entry = await nw.data.audit.find({ action: "theme.updated" }).toArray();
    expect(entry).toHaveLength(1);
    // "Authored by that key", rather than by the person who minted it sitting
    // at the app — which is true about the actor and misleading about what
    // happened.
    expect(entry[0]?.detail).toContain("via Ada's Figma");
  });

  it("refuses a colour that is not one, and writes nothing", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);
    const before = await nw.data.themes.findOne({ slug: "clinical" });

    const response = await draftRoute(
      post("/api/v1/themes/clinical/draft", token, { anchor: "burnt sienna" }),
      slugParams("clinical"),
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain("not a colour");
    expect((await nw.data.themes.findOne({ slug: "clinical" }))?.updatedAt).toEqual(
      before?.updatedAt,
    );
  });

  it("distinguishes a malformed request from a refused colour", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    // Only one of these is answered by picking a different colour.
    const noBody = await draftRoute(
      post("/api/v1/themes/clinical/draft", token, "not json"),
      slugParams("clinical"),
    );
    expect(noBody.status).toBe(400);

    const noAnchor = await draftRoute(
      post("/api/v1/themes/clinical/draft", token, {}),
      slugParams("clinical"),
    );
    expect(noAnchor.status).toBe(422);
  });

  it("refuses an anchor whose ramp fails the gate, with the measured problems", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    /*
     * A teal a designer would actually pick, and it fails at 2.98:1.
     *
     * Not an obviously broken colour — `#0f766e` is a perfectly ordinary brand
     * green, and the ramp derived from it puts white `text-on-accent` on a 600
     * step nobody can read it against. This is the refusal the whole feature
     * exists for: seen in Figma while the choice is being made, rather than
     * after a round trip and a rejected publish.
     */
    const response = await draftRoute(
      post("/api/v1/themes/clinical/draft", token, { anchor: "#0f766e" }),
      slugParams("clinical"),
    );

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.detail.length).toBeGreaterThan(0);
    expect(body.detail.join(" ")).toContain("text-on-accent on accent");
    expect(body.detail.join(" ")).toContain("2.98:1");
  });

  it("leaves a theme's semantic overrides alone", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);
    const theme = (await nw.data.themes.findOne({ slug: "clinical" }))!;

    await saveOverrides(nw, await base(), theme._id, {
      semantic: { light: { "text-muted": "#4b5563" } },
    });
    await draftRoute(
      post("/api/v1/themes/clinical/draft", token, { anchor: "#7c3aed" }),
      slugParams("clinical"),
    );

    // The brand screen edits the ramp and nothing else, and the API is that
    // screen with a different front door.
    const after = await nw.data.themes.findOne({ slug: "clinical" });
    expect(after?.tokens.semantic?.light?.["text-muted"]).toBe("#4b5563");
  });
});

describe("what the plugin API cannot reach", () => {
  /**
   * Asserted over the source, not promised in a comment.
   *
   * "This endpoint cannot publish" is a claim about what code is reachable, and
   * the honest way to hold it is for the publish path not to be imported at
   * all. A guard inside the route would be one line somebody deletes while
   * simplifying; an absent import has to be added on purpose, in a diff, by
   * someone who then has to explain it.
   */
  const scan = async (pattern: RegExp) => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const path = await import("node:path");
    const root = path.resolve(__dirname, "..", "src");

    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (full.endsWith(".ts")) out.push(full);
      }
      return out;
    };

    const files = [path.join(root, "lib/api"), path.join(root, "app/api/v1")].flatMap((d) =>
      walk(d),
    );

    /*
     * Comments stripped before matching.
     *
     * The first version of this searched the raw text and reported both routes,
     * because both of them *explain in prose* that they never import the
     * publish path. A structural test that its own documentation fails is a
     * test nobody will trust the second time it goes red.
     */
    return files
      .filter((file) => {
        const code = readFileSync(file, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        return pattern.test(code);
      })
      .map((f) => path.relative(root, f))
      .sort();
  };

  it("never imports the publish path", async () => {
    expect(await scan(/\b(publishTheme|rollbackTheme)\b/)).toEqual([]);
  });

  it("never imports the raw database client", async () => {
    // The scoped view is the only way in, so a slip here would be a query that
    // could name any organisation.
    expect(await scan(/from "(@\/db\/client|\.\.\/db\/client)"/)).toEqual([]);
  });

  it("never reads a session cookie", async () => {
    // A token request has no session. Reaching for one would authenticate a
    // browser tab that happens to be open on the same machine as the plugin.
    expect(await scan(/from "next\/headers"/)).toEqual([]);
  });
});

describe("states the happy path does not reach", () => {
  it("refuses a key whose creator was deleted, not merely disabled", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    // Offboarding that removes the row rather than flipping a flag. A key that
    // outlives its owner is a credential nobody is accountable for.
    await db().members.deleteOne({ _id: new ObjectId(nw.member.id) });

    expect((await listRoute(get("/api/v1/themes", token))).status).toBe(404);
  });

  it("hides an archived theme from the picker but still resolves it", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { theme, token } = await withKey(nw);
    await setThemeArchived(nw, (await nw.data.themes.findOne({ slug: theme.slug }))!._id, true);

    const { themes } = await (await listRoute(get("/api/v1/themes", token))).json();
    expect(themes).toEqual([]);

    /*
     * Absent from the list, still readable by slug.
     *
     * Archiving takes a theme out of circulation; it does not unpublish, and
     * published stylesheets keep serving. A file already pulled from it should
     * still be able to ask what it is pinned to rather than getting a 404 that
     * reads as "deleted".
     */
    const resolved = await resolvedRoute(
      get(`/api/v1/themes/${theme.slug}/resolved`, token),
      slugParams(theme.slug),
    );
    expect(resolved.status).toBe(200);
  });

  it("survives a slug with characters that mean something in a URL", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    for (const slug of ["../../admin", "clinical?x=1", "clinical#frag", "%2e%2e", "  "]) {
      const response = await resolvedRoute(
        get(`/api/v1/themes/${encodeURIComponent(slug)}/resolved`, token),
        slugParams(slug),
      );
      // Nothing but a 404, and never another organisation's theme.
      expect(response.status, slug).toBe(404);
    }
  });

  it("refuses a version number that is not a version, however it is spelled", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    for (const bad of ["1e400", "NaN", "Infinity", "0x3", "3 ", "١٢٣", "9007199254740993"]) {
      const response = await resolvedRoute(
        get(`/api/v1/themes/clinical/resolved?version=${encodeURIComponent(bad)}`, token),
        slugParams("clinical"),
      );
      // 400 for a malformed number, 404 for a well-formed one that does not
      // exist. Never a silent fall back to the draft.
      expect([400, 404], bad).toContain(response.status);
    }
  });

  it("keeps two proposals to the same theme from losing one another", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    // Two designers, one theme, one instant. Both are valid ramps.
    const [a, b] = await Promise.all([
      draftRoute(
        post("/api/v1/themes/clinical/draft", token, { anchor: "#7c3aed" }),
        slugParams("clinical"),
      ),
      draftRoute(
        post("/api/v1/themes/clinical/draft", token, { anchor: "#b91c1c" }),
        slugParams("clinical"),
      ),
    ]);

    expect([a.status, b.status]).toEqual([201, 201]);

    // One of them wins, and the draft is one of the two colours rather than a
    // blend of both or an empty ramp.
    const theme = await nw.data.themes.findOne({ slug: "clinical" });
    expect(["#7c3aed", "#b91c1c"]).toContain(theme?.tokens.ref?.brand?.["600"]);
    expect(Object.keys(theme?.tokens.ref?.brand ?? {})).toHaveLength(11);
  });

  it("refuses an anchor that is the right shape and the wrong type", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    for (const anchor of [null, 42, true, ["#1d63c9"], { hex: "#1d63c9" }, ""]) {
      const response = await draftRoute(
        post("/api/v1/themes/clinical/draft", token, { anchor }),
        slugParams("clinical"),
      );
      expect(response.status, JSON.stringify(anchor)).toBe(422);
    }
  });

  it("accepts a three-digit hex, because the app's own form does", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    const response = await draftRoute(
      post("/api/v1/themes/clinical/draft", token, { anchor: "#70e" }),
      slugParams("clinical"),
    );

    // Refusing here and accepting on the brand screen would be two answers to
    // one question. The stored value keeps the three-digit form the designer
    // typed rather than being expanded, which is what `generateRamp` does for
    // the anchor step everywhere else.
    expect(response.status).toBe(201);
    expect((await response.json()).anchor).toBe("#70e");
    expect((await nw.data.themes.findOne({ slug: "clinical" }))?.tokens.ref?.brand?.["600"]).toBe(
      "#70e",
    );
  });

  it("keeps the plugin's local reading and the gate in agreement on a real refusal", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    /*
     * The parity that matters for the propose screen.
     *
     * The plugin measures one pair locally so a designer sees a refusal while
     * choosing rather than after a round trip. If that number and this one
     * disagree, the local reading is worse than useless — it says pass where
     * the gate says fail. `#0f766e` is the case that caught it: an ordinary
     * brand teal whose derived accent puts white at 2.98:1.
     */
    const response = await draftRoute(
      post("/api/v1/themes/clinical/draft", token, { anchor: "#0f766e" }),
      slugParams("clinical"),
    );

    expect(response.status).toBe(422);
    const detail = (await response.json()).detail.join(" ");
    expect(detail).toContain("text-on-accent on accent");

    // The exact figure the plugin panel puts in front of the designer.
    expect(detail).toContain("2.98:1");
  });

  it("does not let a draft proposal touch a theme in another organisation, even by id", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();
    const theirs = await createTheme(sm, { name: "Oncology", brandColour: "#b91c1c" });
    const { token } = await mintToken(nw, "Ada's Figma", "figma");

    const response = await draftRoute(
      // The slug is theirs. Nothing in the request names an organisation, which
      // is the point: the key decides, and it decides Northwind.
      post(`/api/v1/themes/${theirs.slug}/draft`, token, { anchor: "#7c3aed" }),
      slugParams(theirs.slug),
    );

    expect(response.status).toBe(422);
    const untouched = await sm.data.themes.findOne({ slug: theirs.slug });
    expect(untouched?.tokens.ref?.brand?.["600"]).toBe("#b91c1c");
  });

  it("answers a resolved request for a theme with an empty ramp", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { theme, token } = await withKey(nw);

    // A theme whose ramp was cleared by an import. The plugin should get an
    // honest empty ramp rather than a 500.
    await nw.data.themes.updateOne({ slug: theme.slug }, { $set: { "tokens.ref": {} } });

    const response = await resolvedRoute(
      get(`/api/v1/themes/${theme.slug}/resolved`, token),
      slugParams(theme.slug),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).ramp).toEqual({});
  });

  it("carries no Set-Cookie, so nothing in between treats it as a session", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const { token } = await withKey(nw);

    const response = await listRoute(get("/api/v1/themes", token));
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("ignores a cookie entirely — the key is the only identity", async () => {
    const { asNorthwind, asSouthmere } = await twoOrgs();
    const nw = await asNorthwind();
    const sm = await asSouthmere();
    await createTheme(sm, { name: "Oncology", brandColour: "#b91c1c" });
    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    const { token } = await mintToken(nw, "Ada's Figma", "figma");

    const request = new Request(`${ORIGIN}/api/v1/themes`, {
      headers: { authorization: `Bearer ${token}`, cookie: "zoblocks_session=whatever" },
    });
    const { themes } = await (await listRoute(request)).json();

    // A route that read both would authenticate whichever browser tab happens
    // to be open on the same machine as the plugin.
    expect(themes.map((t: { slug: string }) => t.slug)).toEqual(["clinical"]);
  });
});
