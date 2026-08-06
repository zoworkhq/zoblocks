# Oxygen UI — Product Design Contract

Copy this file into any product built with Oxygen and fill it in. It is the
handoff artifact between design, engineering, clinical review, and any AI
coding agent working in the repository. Keep it versioned next to the code.

An unfilled section is not a formatting problem — it is an unmade decision.

---

## Product context

- **Product / role / workflow:**
- **Primary user:** patient · caregiver · clinician · operations · administrator
- **Risk level if this surface is wrong:** informational · operational · clinical
- **Data sensitivity:** public · internal · confidential · regulated
- **Markets and locales:**

## Visual language

- **Theme:** `oxygen-light` · `oxygen-dark` · customer brand
- **Density:** `patient` · `standard` · `clinical`
  (set with `data-ox-density` on the container)
- **Status semantics:** never color alone — every status pairs a color with an
  icon and a text label
- **Brand overrides applied:**

## Interaction rules

Each of these must have a defined design, not a default:

- [ ] Loading
- [ ] Empty
- [ ] Error
- [ ] Offline / degraded connectivity
- [ ] Permission denied
- [ ] Restricted record
- [ ] Success / confirmation

- **Keyboard path through the primary task:**
- **Screen-reader announcement for status changes:**
- **Reduced-motion behavior:**
- **Confirmation required before:** (irreversible or clinically consequential actions)

## Healthcare content

- **Time zone and date format:**
- **Units and reference-range source:**
- **Clinical vs patient-facing terminology:**
- **Escalation and urgency language:**
- **Reading level target for patient-facing copy:**

## Implementation

- **Components and registry commands used:**
- **FHIR resources and profiles consumed:**
- **Data contracts and mock fixtures:**
- **Integration assumptions:**

## Boundaries

State plainly what this product does _not_ do, and what remains the
implementing team's responsibility:

- **Access control and audit:**
- **Data residency and retention:**
- **Clinical validation and sign-off:**
- **Regulatory obligations:**

> Oxygen UI is not a compliance boundary. It does not make an application
> HIPAA, GDPR, or DPDP compliant, and it is not a medical device or clinical
> decision support.
