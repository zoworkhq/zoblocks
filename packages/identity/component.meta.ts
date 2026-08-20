import { defineComponentMeta } from "@oxygenui-design/component-meta";

/**
 * Identity is the third `package` component, and the reason is different again.
 *
 * Signature ships on npm because copying antd's Modal and Form into someone's
 * repository would be a fork rather than a component. Tabs ships that way
 * because copy-as-source cannot express "take the engine, leave the skin".
 * Identity ships that way because the engine is where the product is: name
 * resolution, deterministic swatches, script-aware initials and the
 * disambiguation pass are ~70% of the work and none of it is React. Three thin
 * renderers sit on top of it.
 *
 * Unlike the other two it takes no Ant Design dependency at all — the styles
 * are its own custom properties, and they inherit from antd's tokens when a
 * host supplies them.
 */
export default defineComponentMeta({
  name: "identity",
  title: "Patient identity",
  tier: "free",
  status: "beta",
  since: "0.1.0",
  layer: "clinical",
  frameworks: {
    antd: {
      // No dependency at all. The styles are its own custom properties and
      // they inherit from antd's tokens when a host supplies them — the
      // fallback chain doing the work rather than an import.
      policy: "neutral",
      bridge: false,
    },
  },

  distribution: "package",
  packageName: "@oxygenui-design/identity",
  /*
   * The banner is the component a consumer configures — the avatar and the chip
   * take an identity and little else, and the provider is policy. There is no
   * `Patient identity.tsx` to name after the title, because the package's
   * surface is three components rather than one.
   */
  propsSource: "PatientBanner.tsx",

  summary:
    "An avatar, a chip and a patient banner — with the pass that keeps two patients who share a name apart on the same worklist.",
  description:
    "The banner is the last surface a clinician reads before they act, so it is built as a control rather than a heading: two person-specific identifiers before a care action are a compile error, `Patient.gender` is not a renderable field, and a form can refuse to submit when the chart on screen is not the chart it was opened for.",
  rationale:
    "A patient banner is the most PHI-dense component in a healthcare product and the one nobody designs. It is pinned to the top of every screen, read hundreds of times a shift, and it is the last thing standing between a clinician and someone else's chart. Adelman et al. (JAMIA 2013, 901,776 ordering sessions) found a dismissible 'check the patient' alert cut wrong-patient orders with an odds ratio of 0.84, while making the clinician re-enter the patient's initials cut them with an odds ratio of 0.60 — so a banner that is only read is worth a sixth of one that is answered, and both require the header to know what action is about to happen. Everything else follows from treating identity as a resolved value rather than a bag of booleans: absence of a photograph is five different facts, 'Inactive' is four unrelated ones, and two patients sharing a surname on a ward list is a problem a component can see and an application never will.",

  categories: ["Clinical", "Patterns"],
  fhir: [{ name: "Patient", url: "https://hl7.org/fhir/R4/patient.html" }],

  states: [
    "Active",
    "Inactive — discharged, transferred, or disengaged",
    "Deceased, with the age frozen at age-at-death",
    "Record merged — care is recorded elsewhere",
    "Test patient (meta.security HTEST)",
    "Sensitive record, categories withheld pending an audited reveal",
    "Photo on file",
    "No photo on file",
    "Photo could not be loaded",
    "Photo withheld by site policy",
    "Loading — a skeleton, never a half-identity",
    "Could not load the record",
    "Escalated: a similar name is on this list",
    "Wrong patient — the form and the chart disagree",
    "Identifier failing its check digit",
  ],

  a11y: [
    {
      label: "One region, one composed name",
      detail:
        "The default rendering of a banner is seven fragments — initials, a name, a status pill, a letter, an age, a date, a number — that a non-sighted user has to reassemble into a person. `identityLabel()` composes one string instead, and it lives in the engine precisely so the accessible name and the pixels are two projections of one value and cannot disagree.",
    },
    {
      label: "The identifier is spelled out",
      detail:
        "Every major screen reader pronounces the unspaced form of MRN as “mern”, and digits run together as a quantity. The label emits “M R N 123, 456, 789”, because a clinician verifying an identifier by ear needs the letters and the grouping.",
    },
    {
      label: "The patient changed and nobody said so",
      detail:
        "A sighted user gets a full visual repaint when the chart switches; a screen-reader user gets nothing, because focus is wherever it was and the DOM swapped underneath them. A polite live region announces the new patient — debounced, so a rapid list traversal does not queue up announcements, and polite so it never interrupts a value being read.",
    },
    {
      label: "The avatar says nothing",
      detail:
        "`aria-hidden`, always, when it sits beside the name. It carries no information a non-sighted user can use, and alt text naming the patient is both noise and a small PHI leak into anything that scrapes alt attributes. The tint is decorative by definition and is never exposed as meaning.",
    },
    {
      label: "Absence is distinguishable, not just visible",
      detail:
        "The five photo states produce five different accessible names as well as five different renderings, so “no photo on record” and “photo could not be loaded” are as distinct by ear as they are by eye.",
    },
    {
      label: "A withheld category is withheld from everyone",
      detail:
        "Sensitivity codes are named only after an audited reveal, or at full disclosure — in the tag, in the row and in the accessible name alike. Naming them in the label alone would hand a screen-reader user the thing the reveal exists to record.",
    },
    {
      label: "Nothing is ellipsised",
      detail:
        "There is no `text-overflow` on any name or identifier at any width. “Mohammed Al-Rash…” and “Mohammed Al-Rashid” are two people on the same ward, and a truncated MRN is not a shorter number — it is a different one. Fields leave whole in a declared priority order, so what disappears at 320px was a designer's decision rather than the layout engine's.",
    },
    {
      label: "Colour is never the signal",
      detail:
        "Every state carries an icon and a word as well as a tone, and the six decorative swatches collapse to one value under forced colors — which is the argument for never relying on them: if a design stops working when the tint goes, it was already broken for the roughly 8% of men who cannot separate two of those hues.",
    },
  ],

  guidance: {
    use: [
      'The pinned header of any chart, order screen or note editor — `context="action"` wherever a care action follows, which requires two person-specific identifiers at the type level.',
      "Worklists and admissions lists, wrapped in an `IdentitySet`: the disambiguation pass only escalates rows that genuinely collide, and leaves the rest untouched.",
      "Anywhere the record's own facts should drive the rendering — deceased, merged, test and restricted are read from the resource, never passed as props.",
      "Reception and waiting-room surfaces, via `disclosure`: the same resource renders four ways, and a public screen shows enough for the named person to recognise themselves and no more.",
      "Screenshots, sales demos and training environments — `demoMode` substitutes synthetic identities everywhere, deterministically keyed off the real record so collisions and name lengths survive.",
    ],
    avoid: [
      "Rendering `Patient.gender`. It is administrative gender — correspondence and registries, not dosing — and it is absent from the `fields` union for that reason. Ask for `spcu` or `recorded-sex-or-gender`, which render labelled as what they are.",
      'Reaching for the legal name without a reason. `nameContext="legal"` requires one, because chosen-name use across contexts is associated with substantially lower depression and suicidality among transgender young people, and `name[0]` is not a neutral default.',
      "Two banners on one screen. Two authoritative answers to “whose chart is this” is the defect; use `PatientChip` to reference a second patient.",
      "Keying the avatar swatch on a name. A marriage, a correction or a transition repaints the person, and a banner showing the chosen name will disagree with a worklist showing the legal one. A lint rule catches it.",
      "Treating the disambiguation pass as record matching. It answers “would a reader in a hurry confuse these two rows”, which is a different and much narrower question than “are these the same person”.",
    ],
  },

  limitations: [
    "It does not match records. Deduplication belongs to a master patient index, has a different risk profile, and a component that started guessing at it would be making a claim it cannot support.",
    "It does not write an audit trail. `onSensitiveReveal` and `onIdentifierCopy` fire and the application logs — a component that wrote its own would be emitting PHI from a browser to whatever error reporter the customer installed.",
    "It does not enforce access control. `disclosure` is presentation; a withheld field is not a security boundary, and authorisation belongs on the server.",
    "Photographs are denied by default and must be opted into. A cached portrait is PHI at rest in a browser the site may not control, and an intake photograph taken during an involuntary admission was not meaningfully consented to.",
    "Six decorative swatches means collisions are the normal case, not the edge case — certain from seven patients by the pigeonhole principle. That is handled rather than avoided, and the tint is never permitted to be the fastest discriminator on a row.",
    "The compact Double Metaphone omits the alternate code and several Slavic and Germanic cases. It fails safe: a missed similarity produces an ordinary row rather than a wrong one.",
    "Wristband matching and the ID-reentry verification step are built but unstyled beyond the base sheet; a deployment wanting positive patient identification supplies the scanner integration.",
  ],

  related: [],

  usage: `import {
  IdentityProvider,
  PatientBanner,
  PatientGuard,
} from "@oxygenui-design/identity";
import "@oxygenui-design/identity/styles.css";

<IdentityProvider disclosure="clinical" photos="allow" onSensitiveReveal={audit.write}>
  {/* context="action" takes a two-or-more tuple: NPSG.01.01.01 as a compile error. */}
  <PatientBanner
    patient={patient}
    context="action"
    identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
  >
    {/* Refuses to render if the chart on screen is not the one this was opened for. */}
    <PatientGuard expect={openedFor.id} expectName={openedFor.name}>
      <OrderForm />
    </PatientGuard>
  </PatientBanner>
</IdentityProvider>;`,

  dependencies: ["@oxygenui-design/identity-core"],
  registryDependencies: [],
});
