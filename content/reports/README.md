# Reports

Design briefs, audits and reviews. Long-form HTML, self-contained, no build step —
open one in a browser.

These sit beside `content/decisions` (the ADRs) rather than at the repository root,
which is where the previous twenty accumulated. A decision record says what was
chosen and why; a report is the work that led to it, kept because the measurements
in it are expensive to re-derive and are cited elsewhere.

| Report                          | What it covers                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `oxygen-website-redesign.html`  | Audience analysis and a plan for improving the existing site, not replacing it |
| `oxygen-component-docs.html`    | The component documentation rebuild — state browser, props, mockups            |
| `oxygen-content-seo-audit.html` | Page-by-page content, SEO and generative-discovery audit, with results         |

## The twenty still at the root

The earlier reports have not been moved. Eight files reference them by name, and
several say "at the repository root" in as many words — `packages/clinical-note-core`
(both its README and `src/index.ts`), `packages/signature-core/src/value.ts`, two
rules in `packages/eslint-plugin`, `apps/app/MARKETPLACE.md`, and an entry in
`eslint.config.mjs` that ignores one of them by filename.

Migrating them is a tidy-up worth doing, and it is a different change from adding
three files: the moves are trivial and the references are not, because a stale
pointer in a source comment is worse than a file in an untidy place. `OXYGEN-UI-AUDIT.md`
already flags the root clutter, so the intent is on record either way.

## Writing one

Reports are generated rather than hand-written — the sources live in a session
scratchpad and are not committed, which is a known gap. If you are producing a new
one, prefer a builder that fails on an unsubstituted token over hand-editing
several hundred kilobytes of HTML.
