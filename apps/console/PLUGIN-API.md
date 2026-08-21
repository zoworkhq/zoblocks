# The plugin API

Three endpoints under `/api/v1`, for the Figma plugin. They are the only way
into the console that is not a browser session, which is the reason this
document exists: a second authentication path is a second place to get tenant
isolation wrong.

## The credential

Minted at **Market → Tokens**, with the scope set to _Themes, for the Figma
plugin_. The value is shown once. The database holds its SHA-256 and nothing
else, so there is no screen that can show it again.

```
Authorization: Bearer oxy_live_…
```

A key is labelled, expires after 90 days, is revocable from the same screen, and
appears in the audit log at mint and at revocation. Four properties, and each of
them is why handing one to a designer is safe rather than merely convenient.

Three things about scope are worth knowing before you mint one:

- **A Figma key cannot install components, and a registry key cannot read
  themes.** One scope per token. A combined key is a key nobody can revoke
  without deciding which of two things to break.
- **A key never exceeds the person who minted it.** Every request resolves the
  token to its creator and re-checks their role. A key minted by a _developer_
  reads themes and is refused a draft, because a developer holds `theme.read`
  and not `theme.write`.
- **Disabling that person stops the key.** Offboarding is one act rather than a
  checklist of the credentials somebody happened to mint.

Revocation takes effect on the next request. Expiry is compared on every request
rather than left to the TTL index, which sweeps about once a minute — "briefly
still valid" is not a phrase that belongs in an authorisation check.

## `GET /api/v1/themes`

The picker. Archived themes are absent: their stylesheets still serve, but
offering one here would invite a designer to build a file against a theme nobody
is maintaining.

```json
{
  "themes": [
    {
      "slug": "clinical",
      "name": "Clinical",
      "status": "published",
      "liveVersion": 3,
      "updatedAt": "…"
    }
  ]
}
```

## `GET /api/v1/themes/{slug}/resolved?version=3`

The brand ramp, the semantic tier resolved for all three themes, the clinical
tokens with the reason they are fixed, and the validation record of the version
being described. This is the shape `@oxygenui-design/figma-core`'s
`toVariablePlan` consumes.

Without `version` it serves the live one, falling back to the draft when nothing
has been published. **Naming a version that does not exist is a 404**, not a
quiet fall back — a file pinned to v6 that receives v7's colours under v6's
number is something a designer finds out about from a stakeholder.

The validation record travels with the colours so the plugin can say _this
version passed, on this date, against this validator_ rather than implying it by
having served the file at all.

The component tier is absent, and that is a decision. `TOKEN_SURFACE` carries
282 entries but only 169 exist in the DTCG component tier with a value; the
other 113 are declared in stylesheets and hold nothing a theme could push.
Sending a partial tier that looks complete is worse than sending none, so the
opt-in ships with the pull direction, alongside the checkbox that states the
count before it writes anything.

## `POST /api/v1/themes/{slug}/draft`

```json
{ "anchor": "#1d63c9" }
```

The only thing the plugin may write. **One colour, not a ramp** — the console
derives the other ten steps with `generateRamp`, the same function the new-theme
form runs, so a designer cannot hand over eleven hand-picked values under the
name of one decision. ADR 0015 puts the ramp on the console's side of the line;
this endpoint is where that line is.

It then validates, and **refuses** rather than warning:

```json
{
  "error": "1 problem(s) with that ramp.",
  "detail": [
    "brand \"clinical\": text-on-accent on accent in theme \"light\" is 2.98:1, below the 4.5:1 floor for SC 1.4.3 (text)."
  ]
}
```

`422`, not `400`. The request was well formed and the colour was understood; it
was refused because it fails the floors. Only one of those two is answered by
picking a different colour, and a designer needs to be able to tell them apart.

On success, `201` and a URL:

```json
{ "slug": "clinical", "anchor": "#1d63c9", "steps": 11, "url": "https://…/themes/clinical/brand" }
```

**There is no path from here to a published version.** That is enforced by what
the code can reach rather than by a check inside it: `publishTheme` is not
imported anywhere under `src/lib/api` or `src/app/api/v1`, and
`test/plugin-api.test.ts` asserts it stays that way over the source with
comments stripped. A guard can be deleted by somebody who believes they are
simplifying; an absent import has to be added on purpose.

The audit entry names the key — `theme.updated · brand ramp, 11 step(s) · via
Ada's Figma` — because a change made from a design file recorded as the person
who minted the key sitting at the console is a true statement about the actor
and a misleading one about what happened.

## Errors

| Status | Means                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `400`  | The request is malformed — no JSON body, or `version` is not a positive integer.                                                                                   |
| `401`  | No bearer token, with `WWW-Authenticate`. A missing credential is a configuration mistake, so the client is told to look for one.                                  |
| `403`  | The key is valid and its role is not enough. The caller is known at this point, so naming what they lack is useful rather than an oracle.                          |
| `404`  | Unknown, revoked, expired, wrong scope, minted by a disabled member — or the theme does not exist in _this_ organisation. Deliberately one answer for all of them. |
| `422`  | Understood and refused by the gate, with the measured problems in `detail`.                                                                                        |

Every response carries `Cache-Control: private, no-store`.
