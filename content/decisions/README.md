# Architecture decision records

One file per decision, numbered, never edited after acceptance — a decision that
turns out wrong is superseded by a new record, not rewritten. The point is that
someone arriving in three years can read why the seam is where it is, including
the options that were rejected and what they cost.

Format: **Context** (the forces, stated honestly) → **Decision** (what we do)
→ **Consequences** (good, costs, and rejected alternatives).

| #                                                            | Decision                                                                  | Status   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| [0001](0001-fhir-typed-props.md)                             | Component props are FHIR resources                                        | accepted |
| [0002](0002-dual-channel-distribution.md)                    | npm is the source of truth; the registry is generated from it             | proposed |
| [0003](0003-package-topology.md)                             | Domain-scoped packages, not one package per component                     | proposed |
| [0004](0004-generated-component-metadata.md)                 | Component metadata is colocated and everything shared is generated        | proposed |
| [0005](0005-three-tier-token-pipeline.md)                    | Tokens are built from a DTCG source across brand × theme × density        | proposed |
| [0006](0006-stability-tiers-and-deprecation.md)              | Stability tiers gate the export path; deprecation is a sequence           | proposed |
| [0007](0007-story-derived-testing.md)                        | Tests derive from stories; quality is gated at the catalog level          | proposed |
| [0008](0008-internationalisation-before-fifty-components.md) | Internationalisation lands before the catalog reaches ~50 components      | proposed |
| [0009](0009-supply-chain-and-component-constraints.md)       | Component capability is constrained by lint; the supply chain is attested | proposed |

See [ARCHITECTURE.md](../../ARCHITECTURE.md) for how these fit together.

## When a change needs an ADR

- A new runtime dependency in any shipped package ([0009](0009-supply-chain-and-component-constraints.md)).
- Anything that changes a public API's shape, a package boundary, or a
  distribution channel.
- Anything that adds a way for a component to reach the network, the
  environment, or the console.
- A new axis in the token system.

Everything else is a pull request.
