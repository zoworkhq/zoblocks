# 0009 — Component capability is constrained by lint; the supply chain is attested

**Status:** proposed · 6 August 2026

## Context

Every enterprise healthcare customer runs a vendor security review before this
library reaches production. Two things make that review short: a component layer
that provably cannot do dangerous things, and a release process that produces
verifiable artifacts.

The repository already has good instincts here. The registry builder rejects any
file reading `process.env`. The CI synthetic-data scan blocks real terminology
systems, vendor hostnames, and SSN-shaped literals — and its comment explaining
why the bare acronym "PHI" was removed from the pattern (it matched the project's
own prose, so the job was red on every commit and told nobody anything) is the
right instinct about check design.

What is missing is generality. `process.env` is one of several things a
component must never do, and it is checked in one place — the registry builder —
which under [0002](0002-dual-channel-distribution.md) is no longer the only path
to a customer.

## Decision

### Component source constraints, enforced by lint

A component in any Oxygen package may not:

- read `process.env`
- make network calls — no `fetch`, no `XMLHttpRequest`, no `WebSocket`
- emit telemetry or analytics of any kind
- use `dangerouslySetInnerHTML`
- log props — `console.*` with a prop-derived argument is an error, because a
  component logging a `Patient` writes PHI to a browser console and, through
  error reporting, onward to a third-party service
- use `eval` or dynamically `import()` a non-local path

Lint rather than review, because these are exactly the things that pass review
when the diff is large.

### Supply chain

- **Publish only from CI** using npm trusted publishing (OIDC). No long-lived
  tokens exist to be leaked.
- **`npm publish --provenance`** for SLSA build attestation.
- **A CycloneDX SBOM** generated per release and attached as a release asset,
  because customers increasingly require one and generating it on request is
  slower than generating it always.
- **Dependencies pinned**, `pnpm audit` as a CI gate, Renovate for updates.
- **Every new runtime dependency requires an ADR.** At 500 components,
  dependency creep is the primary driver of both bundle size and CVE exposure.
  The current runtime surface — `clsx`, `tailwind-merge`, `lucide-react` — is
  small on purpose.

### Retained and generalised

The synthetic-data scan stays as written, including its patterns-match-data-not-
discussion principle. It extends to cover all component packages rather than the
registry directory alone.

### Content-Security-Policy

Components must render under a strict CSP. Styling is custom properties and
class names, so no `unsafe-inline` is required. The docs state a nonce strategy
for the one case where a style element is unavoidable.

### The boundary claim is architectural

Oxygen UI is not a compliance boundary and not a medical device. This constrains
what components are permitted to do: nothing in this library may present itself
as clinical decision support, and no component may derive a clinical
recommendation. It is a rule about the code, not only a disclaimer in the
README.

## Consequences

**Good.** The security questionnaire is largely answerable by pointing at the
lint configuration and the release workflow. Provenance and an SBOM are
increasingly procurement requirements rather than differentiators, and having
them from the start avoids a scramble mid-deal. The no-network and no-telemetry
constraints are also a positioning asset: a component library that cannot phone
home is an easy thing for a hospital's security team to approve.

**Costs.** The constraints are genuinely limiting. A component that would
benefit from lazy-loading a heavy sub-view cannot dynamically import it from a
CDN, and any future telemetry — even anonymous usage counts that would inform
the roadmap — is foreclosed at the component layer and must live in the docs
site instead. Requiring an ADR per runtime dependency adds friction to
legitimate additions; that friction is the point, but it will occasionally be
argued about.

**Rejected: enforcing these in review.** They pass review reliably right up
until the release where they do not, and the failure is silent.

**Rejected: allowing opt-in telemetry.** Any telemetry path in a component that
receives `Patient` and `Observation` resources is a PHI exfiltration path one
misconfiguration away. The roadmap value is not worth the review burden it
creates for every customer.
