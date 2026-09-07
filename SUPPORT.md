# Getting help

## Documentation first

- **[zoblocks.design](https://zoblocks.design)** — component pages with live
  previews of every state, props tables, accessibility notes, and install
  commands
- **[ENGINEERING.md](ENGINEERING.md)** — the standard every component is built
  and reviewed against
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — how the library is put together and
  why
- **[CONTENT.md](CONTENT.md)** — the clinical content style guide
- **[content/decisions/](content/decisions/)** — architecture decision records

## Questions and bugs

| What                           | Where                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| A bug                          | [Open a bug report](https://github.com/zoworkhq/zoblocks/issues/new?template=bug_report.yml)                                        |
| A missing component or feature | [Open a request](https://github.com/zoworkhq/zoblocks/issues/new?template=component_request.yml)                                    |
| An accessibility problem       | [Open an accessibility issue](https://github.com/zoworkhq/zoblocks/issues/new?template=accessibility.yml) — these are triaged first |
| A security vulnerability       | **Never an issue.** Follow [SECURITY.md](SECURITY.md)                                                                               |
| A question                     | [Discussions](https://github.com/zoworkhq/zoblocks/discussions)                                                                     |

**Never paste real patient data into an issue, a discussion, or a pull request.**
Use the synthetic fixtures in `@zoblocks/fixtures`, or invent values on
`example.org`. We will delete anything containing real data and ask you to file
again.

## Commercial support

Zowork offers implementation support, design-system consulting, and
enterprise agreements covering SLAs, prioritised fixes, and accessibility
conformance documentation. Contact **hello@zowork.com**.

## Triage targets

These are targets for the maintainers, not guarantees for community
contributions.

| Severity                     | First response   | Fix target |
| ---------------------------- | ---------------- | ---------- |
| Security (critical/high)     | 2 business days  | 30 days    |
| Accessibility regression     | 3 business days  | next patch |
| Broken component             | 3 business days  | next patch |
| Bug                          | 5 business days  | next minor |
| Feature or component request | 10 business days | roadmap    |
