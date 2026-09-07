# Security policy

Zoblocks is used in software that clinicians and patients depend on. We treat
security reports as the highest-priority work in the project.

## Reporting a vulnerability

**Do not open a public issue.**

Report privately through either channel:

- GitHub's [private vulnerability reporting](https://github.com/zoworkhq/zoblocks/security/advisories/new) (preferred — it gives us a shared workspace and a CVE path)
- Email **security@zowork.com**

Please include: affected package and version, a description of the impact, and
the smallest reproduction you can manage. If you have a suggested fix, say so —
we will credit it.

### What to expect

| Stage                                          | Target                                     |
| ---------------------------------------------- | ------------------------------------------ |
| Acknowledgement                                | 2 business days                            |
| Initial assessment and severity                | 5 business days                            |
| Fix or documented mitigation for critical/high | 30 days                                    |
| Public advisory                                | on release, or 90 days, whichever is first |

We operate a **90-day disclosure embargo**. If we cannot ship a fix in that
window we will say so and agree an extension with you rather than let the clock
run out silently.

## Supported versions

| Version        | Supported                                            |
| -------------- | ---------------------------------------------------- |
| Current major  | ✅ Security and functional fixes                     |
| Previous major | ✅ Security fixes for 12 months after the next major |
| Older          | ❌                                                   |

## Scope

**In scope:** the published packages (`@zoblocks/*`), the registry items
served from `zoblocks.design/r/`, the build and release pipeline, and this
repository's CI.

**Out of scope:** the internal `apps/hq` tool, findings that require a
compromised developer machine, and reports generated solely by a scanner with no
demonstrated impact.

## What Zoblocks does and does not protect

Zoblocks components are **structurally constrained** — a lint rule and a build
check enforce that a component cannot read `process.env`, make a network call,
open a WebSocket, call `eval`, use `dangerouslySetInnerHTML`, or write to the
console. That last one matters more than it looks: a component that logs its
props writes patient data to the browser console and onward to whatever
error-reporting service the host application has installed.

Zoblocks is **not a compliance boundary**. It does not make an application HIPAA,
GDPR, or DPDP compliant, and it is not a medical device or clinical decision
support. Access control, audit, data residency, and clinical validation remain
the implementing team's responsibility.

## No patient data, ever

Every fixture, demo, screenshot, and test in this repository uses invented
values on reserved `example.org` systems. CI scans for non-synthetic
identifiers on every push. If you are filing a bug, **redact before you paste** —
we will delete and re-request anything containing real patient data.
