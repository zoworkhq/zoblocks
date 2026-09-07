/**
 * What Pro actually is.
 *
 * Every entry describes behaviour that exists in `apps/app` today, and `where`
 * is the file or route it lives in. That field is not decoration: a marketing
 * page describing a gate is a claim about the product, and `pro-features.test.ts`
 * asserts each path still resolves — so a feature that gets removed or moved
 * fails a test rather than sitting on the page as a quiet lie.
 */

export type StageId =
  | "history"
  | "gate"
  | "ramp"
  | "pin"
  | "vision"
  | "density"
  | "bridge"
  | "figma"
  | "roles"
  | "market";

export interface ProFeature {
  id: StageId;
  /** Short enough for a tab. */
  tab: string;
  title: string;
  body: string;
  /** The detail that makes the feature interesting rather than expected. */
  why: string;
  /** Repo-relative. Checked by test. */
  where: string;
}

export const PRO_FEATURES: readonly ProFeature[] = [
  {
    id: "history",
    tab: "Themes",
    title: "A draft is not live until you publish",
    body: "Every edit lands in a draft. An edit reaches a running application only when someone with the capability publishes it, and publishing writes a new immutable version rather than mutating the last one.",
    why: "The screen says it outright: “Validated token overrides. An edit reaches a running application only when you publish.”",
    where: "apps/app/src/app/(app)/themes",
  },
  {
    id: "gate",
    tab: "The gate",
    title: "A failing theme cannot go live",
    body: "The editor validates as you type, but that is a courtesy. The boundary is on the server: a theme with any pair below the contrast floor is refused at publish, so the failure cannot be clicked past.",
    why: "The clinical refusal runs before the contrast gate on purpose — a rejected clinical override should say so plainly rather than arriving as a wall of contrast failures it caused.",
    where: "apps/app/src/lib/themes.ts",
  },
  {
    id: "ramp",
    tab: "Brand",
    title: "One colour, eleven steps",
    body: "You pick your brand colour. The console derives the whole ramp from 50 to 950 around it, anchored so step 600 stays exactly the colour you chose, and every semantic token resolves through those steps.",
    why: "“The app asks for one colour, not eleven” — because most of what the contrast gate checks is decided by the derivation rather than by taste.",
    where: "packages/tokens/src/validate/ramp.ts",
  },
  {
    id: "pin",
    tab: "Delivery",
    title: "A stylesheet pinned to a version",
    body: "Publishing produces a public, immutable URL with the version in the path, plus a manifest carrying what CSS cannot — alternative text, favicon, link-preview card, absolute URLs — at the same pinned version.",
    why: "An edit in the console cannot change a running application until somebody moves the pin. That is what makes runtime theme delivery safe.",
    where: "apps/app/src/app/t/[org]/[file]",
  },
  {
    id: "vision",
    tab: "Playground",
    title: "Brand × mode × density × colour vision",
    body: "Every axis the token system is built on, over real components rather than swatches. Colour vision is not an axis of the system, but it is the thing a reviewer most needs to check and cannot check by reading hex values.",
    why: "Simulation runs after component tokens resolve — simulating first would double-simulate any component token that falls through to a semantic one.",
    where: "apps/app/src/app/(app)/playground",
  },
  {
    id: "density",
    tab: "Density",
    title: "Three densities, one set of tokens",
    body: "Patient, standard and clinical. Rows tighten and targets do not: the accessible minimum holds at every density, because dense means tighter rows, not smaller buttons.",
    why: "The floor is enforced in the component rather than left to the density profile to respect.",
    where: "registry/zoblocks/lib/accordion.css",
  },
  {
    id: "bridge",
    tab: "Frameworks",
    title: "ZoBlocks speaks your host’s language",
    body: "A token bridge lets a ZoBlocks component take the design language of the framework around it — Ant Design, MUI, or neither — without the library ever importing one.",
    why: "The app never resolves a UI framework. That is the architectural claim the whole bridge design rests on.",
    where: "apps/app/src/app/(app)/frameworks",
  },
  {
    id: "figma",
    tab: "Figma",
    title: "Tokens out, and back",
    body: "A plugin pulls the published ramp into Figma variables and proposes a brand colour back the other way. It authenticates with a scoped bearer token that can never exceed the person who minted it.",
    why: "Nothing under the API can reach the publish path — proposing is not publishing.",
    where: "apps/app/PLUGIN-API.md",
  },
  {
    id: "roles",
    tab: "Members",
    title: "Capabilities, not job titles",
    body: "Twelve capabilities, granted per role, decided by an administrator. Accounts are disabled and never deleted, so an audit trail keeps pointing at a person who still exists.",
    why: "Publishing and rollback are separate capabilities from editing, because the person allowed to try something is not always the person allowed to ship it.",
    where: "apps/app/src/lib/roles.ts",
  },
  {
    id: "market",
    tab: "Marketplace",
    title: "Buy once, licensed to the organisation",
    body: "Packs, components and themes delivered by the application. A purchase is perpetual and does not stop working when anything lapses — and the announced-but-unbuilt items cannot be bought at all.",
    why: "Two guards, not one: checkout refuses a coming-soon item, and so does the grant path, which bypasses payment entirely.",
    where: "apps/app/src/app/(app)/market",
  },
];
