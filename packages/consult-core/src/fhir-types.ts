/**
 * The narrow slice of FHIR R4 this engine touches.
 *
 * Declared here rather than imported from `@oxygenui-design/fhir` for the same
 * reason `signature-core` declares its own: this package promises zero
 * dependencies, and that promise is what lets a host import the safety pipeline
 * into a Node handler, an edge worker, or a React Native app without dragging a
 * type package behind it.
 *
 * Structurally compatible with the real thing — a genuine `fhir.Reference`
 * satisfies `Reference` here — so a consumer already using `@types/fhir` can
 * pass their objects straight in. Everything is optional, because real payloads
 * are sparse and a component's job is to render absence, not assume presence.
 *
 * Spec: https://hl7.org/fhir/R4/
 */

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Reference {
  reference?: string;
  type?: string;
  display?: string;
}

export interface Period {
  start?: string;
  end?: string;
}

/**
 * The FHIR resource types a mode may declare in `reads`.
 *
 * A closed union rather than `string`, so a typo in a mode definition is a
 * compile error rather than a category that silently resolves to nothing. The
 * failure mode being prevented is specific: a mode that asks for
 * "MedicationStatment" gets no medications, produces a summary that looks
 * complete, and nobody finds out.
 */
export type ClinicalResourceType =
  | "AllergyIntolerance"
  | "CarePlan"
  | "Condition"
  | "DiagnosticReport"
  | "DocumentReference"
  | "Encounter"
  | "Immunization"
  | "MedicationRequest"
  | "MedicationStatement"
  | "Observation"
  | "Patient"
  | "Procedure"
  | "QuestionnaireResponse"
  | "ServiceRequest";

/** Minimal shape of a resource as the context assembler receives it. */
export interface FhirResource {
  resourceType: ClinicalResourceType | string;
  id?: string;
  [key: string]: unknown;
}

/** https://hl7.org/fhir/R4/auditevent.html */
export interface AuditEvent {
  resourceType: "AuditEvent";
  type: Coding;
  subtype?: Coding[];
  action?: "C" | "R" | "U" | "D" | "E";
  recorded: string;
  outcome?: "0" | "4" | "8" | "12";
  outcomeDesc?: string;
  agent: Array<{
    type?: CodeableConcept;
    who?: Reference;
    requestor: boolean;
    purposeOfEvent?: CodeableConcept[];
  }>;
  source: { observer: Reference; type?: Coding[] };
  entity?: Array<{
    what?: Reference;
    type?: Coding;
    role?: Coding;
    name?: string;
    description?: string;
    detail?: Array<{ type: string; valueString?: string }>;
  }>;
}

/** https://hl7.org/fhir/R4/provenance.html */
export interface Provenance {
  resourceType: "Provenance";
  target: Reference[];
  recorded: string;
  occurredPeriod?: Period;
  activity?: CodeableConcept;
  agent: Array<{
    type?: CodeableConcept;
    who: Reference;
    onBehalfOf?: Reference;
  }>;
  entity?: Array<{ role: "derivation" | "source"; what: Reference }>;
}
