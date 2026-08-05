# 0001 — Component props are FHIR resources

**Status:** accepted · 3 August 2026

## Context

Healthcare component libraries generally invent their own prop shapes — a
`PatientCard` takes `{ name, mrn, dob }`. That pushes a mapping layer onto every
consumer, and the mapping layer is where correctness is lost: it is written
once against the happy path, then quietly drops `meta.security`, collapses
`status`, and defaults a missing interpretation to normal.

The closest existing product, [Medplum](https://github.com/medplum/medplum), does
bind React components to FHIR resources (Apache 2.0, 40+ components). But those
components are an npm package built on Mantine and oriented around the Medplum
platform. No Tailwind-native, copy-and-own, platform-agnostic equivalent exists.

## Decision

Oxygen components take FHIR R4 resources directly as props. `PatientBanner`
takes a `Patient`. `ObservationPanel` takes `Observation[]`.

Supporting decisions:

1. **Types are a narrow structural subset, not `@types/fhir`.** Components are
   copied into customer codebases; every type they touch becomes a dependency
   the customer inherits. `@oxygenui-design/fhir` declares only what components read,
   is structurally compatible with real FHIR, and has zero runtime dependencies.

2. **Every field is optional.** Real payloads are sparse. Components render
   absence rather than assuming presence.

3. **Clinical meaning is never inferred beyond the payload.** A stated
   interpretation wins. Absent one, it is derived only by comparing a value to
   its own reference range. With neither, the result is `unknown` and renders
   as "Not interpreted" — never "Normal".

## Consequences

**Good.** No adapter layer. Components are immediately usable against any FHIR
server or SMART on FHIR app. Fixtures can be generated with Synthea. Component
names double as high-intent, low-competition search terms.

**Costs.** Consumers not using FHIR must shape an object to match — acceptable,
since the shapes are plain optional-field interfaces. FHIR's `value[x]` and
`effective[x]` polymorphism makes some props verbose. And we take on tracking
R4 → R5 divergence as the subset grows.

**Rejected:** a generic prop shape with FHIR adapters. It puts the mapping layer
back, and the mapping layer is the thing that loses the states we exist to get
right.
