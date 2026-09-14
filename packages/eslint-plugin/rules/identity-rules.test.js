import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { describe, it } from "vitest";
import identityRequiresStableKey from "./identity-requires-stable-key.js";
import noRoomNumberIdentifier from "./no-room-number-identifier.js";
import noTruncatedIdentity from "./no-truncated-identity.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("identity-requires-stable-key", identityRequiresStableKey, {
  valid: [
    // The record id is the whole point: it survives every rename.
    { code: `<PatientChip patient={p} identityKey={p.id} />` },
    { code: `<PatientChip patient={p} identityKey={mrn} />` },
    { code: `<PatientChip patient={p} identityKey={patient.identifier[0].value} />` },
    { code: `<PatientChip patient={p} />` },
    { code: `identitySwatch(patient.id)` },
    { code: `identitySwatch(key)` },
    // A `key` prop is React reconciliation, not a swatch key.
    { code: `<li key={displayName}><PatientChip patient={p} /></li>` },
  ],
  invalid: [
    {
      code: `<PatientChip patient={p} identityKey={displayName} />`,
      errors: [{ messageId: "nameKeyed" }],
    },
    {
      code: `<PatientChip patient={p} identityKey={patient.name[0].family} />`,
      errors: [{ messageId: "nameKeyed" }],
    },
    {
      code: "<PatientChip patient={p} identityKey={`${given} ${family}`} />",
      errors: [{ messageId: "nameKeyed" }],
    },
    {
      code: `<PatientChip patient={p} identityKey={given + " " + family} />`,
      errors: [{ messageId: "nameKeyed" }],
    },
    // Optional chaining and TypeScript wrappers are the same name underneath.
    {
      code: `<PatientChip patient={p} identityKey={patient?.name} />`,
      errors: [{ messageId: "nameKeyed" }],
    },
    {
      code: `<PatientChip patient={p} identityKey={displayName as string} />`,
      errors: [{ messageId: "nameKeyed" }],
    },
    {
      code: `<PatientChip patient={p} identityKey={displayName!} />`,
      errors: [{ messageId: "nameKeyed" }],
    },
    {
      code: `identitySwatch(patient?.name?.[0]?.text)`,
      errors: [{ messageId: "nameKeyed" }],
    },
    {
      code: `<PatientChip patient={p} identityKey={formatHumanName(n)} />`,
      errors: [{ messageId: "nameKeyed" }],
    },
    {
      code: `identitySwatch(patient.name[0].text)`,
      errors: [{ messageId: "nameKeyed" }],
    },
  ],
});

ruleTester.run("no-room-number-identifier", noRoomNumberIdentifier, {
  valid: [
    { code: `<PatientBanner identifiers={[{ kind: "mrn" }, { kind: "nhs" }]} />` },
    { code: `<PatientBanner identifiers={[{ kind: "abha" }, { kind: "medicare" }]} />` },
    // The ward is legitimate information; it is just not identification.
    {
      code: `<PatientBanner ward="4B / bay 2" identifiers={[{ kind: "mrn" }, { kind: "nhs" }]} />`,
    },
    { code: `<WardField label="Bed 12" />` },
  ],
  invalid: [
    {
      code: `<PatientBanner identifiers={[{ kind: "mrn" }, { kind: "room" }]} />`,
      errors: [{ messageId: "location" }],
    },
    {
      code: `<PatientBanner identifiers={[{ kind: "bed" }, { kind: "mrn" }]} />`,
      errors: [{ messageId: "location" }],
    },
    {
      code: `<PatientBanner identifiers={[{ kind: "mrn" }, { kind: "Ward" }]} />`,
      errors: [{ messageId: "location" }],
    },
    {
      code: `<IdentifierField label="Bed 12" />`,
      errors: [{ messageId: "location" }],
    },
  ],
});

ruleTester.run("no-truncated-identity", noTruncatedIdentity, {
  valid: [
    // Free text may truncate. A note is not an identifier.
    { code: `<p className="truncate">{note.text}</p>` },
    { code: `<span className="zb-banner__name">{name}</span>` },
    { code: `<span className="zb-chip__name">{name}</span>` },
    { code: `<span data-zb-field="identifier">{mrn}</span>` },
    { code: `<span className="patient-name" style={{ textOverflow: "clip" }}>{name}</span>` },
  ],
  invalid: [
    {
      code: `<span className="patient-name truncate">{name}</span>`,
      errors: [{ messageId: "clipped" }],
    },
    {
      code: `<span className="zb-banner__name text-ellipsis">{name}</span>`,
      errors: [{ messageId: "clipped" }],
    },
    {
      code: `<span data-zb-field="identifier" style={{ textOverflow: "ellipsis" }}>{mrn}</span>`,
      errors: [{ messageId: "clipped" }],
    },
    {
      code: `<span className="mrn-value line-clamp-1">{mrn}</span>`,
      errors: [{ messageId: "clipped" }],
    },
  ],
});
