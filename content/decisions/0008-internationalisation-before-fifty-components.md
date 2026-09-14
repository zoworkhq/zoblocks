# 0008 — Internationalisation lands before the catalog reaches ~50 components

**Status:** accepted · 6 August 2026

> **Ratified 16 August 2026.** Implemented at five components rather than fifty, as this ADR argued. @zoblocks/intl ships with register-aware lookup and a missing-key path that never renders blank.
>
> **Partly done (14 September 2026).** The package exists, but registry components still hardcode their strings and none are routed through @zoblocks/intl yet. The retrofit this ADR asks for is still open.

## Context

Components currently hardcode user-visible English. `AbsentValue` renders
"Not interpreted". `ClinicalValue` carries a `UNIT_SPOKEN` map with
"milligrams per decilitre" and "millimetres of mercury" for screen readers.
Every component has strings like these, and the screen-reader strings matter
most — they are the accessible name, and an English accessible name in a
Spanish-language clinic is a defect, not a cosmetic gap.

Retrofitting internationalisation is one of the few pieces of work whose cost
grows strictly linearly with catalog size and cannot be automated away, because
each string needs a key chosen by someone who understands its clinical context.
At 24 components it is roughly a week. At 500 it is a project with its own
staffing.

Healthcare adds requirements a generic i18n layer does not cover. mg/dL and
mmol/L differ by a factor that changes what a result means. Administration times
are time-zone sensitive in a way that is a correctness issue rather than a
formatting one. Patient-facing and clinician-facing copy are different content,
not different tones of the same string.

## Decision

**`@zoblocks/intl` is built in Phase 1 and the retrofit completes before the
catalog passes roughly 50 components.**

1. **A provider and a message catalog with English defaults.** Every
   user-visible string, including `aria-label` and screen-reader-only text,
   resolves through it. Because the defaults are English, the change is
   mechanical and non-breaking for existing consumers.

2. **Hardcoded user-visible strings in component source are a lint error.** The
   rule is what prevents the problem from reappearing one component at a time.

3. **Unit conversion is explicit and never silent.** A component displays what
   it was given, in the units it was given, unless a conversion is requested.
   Silently converting mmol/L to mg/dL because a locale prefers it would be the
   library inferring clinical meaning, which [0001](0001-fhir-typed-props.md)
   prohibits.

4. **Two catalogs, not one:** clinician-facing and patient-facing. Reading level
   and terminology differ, and collapsing them produces copy that is wrong for
   both audiences.

5. **RTL via CSS logical properties** throughout — `ms-`/`me-`, never
   `ml-`/`mr-`. Also a lint rule, since it is invisible until someone tests in
   Arabic or Hebrew.

## Consequences

**Good.** Non-English markets become a translation effort rather than an
engineering project. Screen-reader output localises with the interface, which is
where the accessibility claim would otherwise quietly fail. The lint rules mean
the property holds as the catalog grows rather than decaying.

**Costs.** Every component gains a dependency on the intl layer, and the
registry channel must ship it alongside — a copy-source component cannot assume
a provider is mounted, so the catalog must degrade to English defaults when no
provider is present. That fallback path needs its own test. String extraction
adds a build step, and translator tooling and review are an ongoing operational
cost that did not previously exist.

**Rejected: defer until a customer asks.** The cost curve is the entire
argument. By the time a customer asks, the retrofit is large enough to be
deprioritised indefinitely, and the library ships English-only permanently.

**Rejected: leave strings to the consumer via props.** It moves the problem
rather than solving it — every consumer reimplements the same catalog, and
screen-reader strings, which most consumers never think to override, stay
English everywhere.
