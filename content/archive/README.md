# Archive

**Everything under this directory says Oxygen UI, and that is deliberate.**

The project was renamed from Oxygen UI to Zoblocks on 7 September 2026. The
rename swept the whole repository — the npm scope, the registry, the CLI
contract, the token prefix, the mark, every user-facing sentence. It stopped at
this directory.

These files are a dated record of what was decided, when, and on what evidence:
design briefs, the pre-rebuild audit, the SEO and content reviews, the
competitive research that set the original direction. Rewriting them would make
the record say something that was never true, and the point of keeping a record
is that you can trust what it says.

So they are frozen. Nothing here is current guidance, none of it should be
copied into new work, and the product names, package names, domains and token
prefixes in it are all retired.

**Where the live equivalents are:**

| Frozen here | Current |
| --- | --- |
| Design briefs (`oxygen-*-brief.html`) | The component's own `*.meta.ts` and its docs page |
| `OXYGEN-UI-AUDIT.md`, `oxygen-ui-audit.html` | Superseded — the findings were fixed or explicitly dropped |
| `reports/` | Superseded by whatever replaced each one |
| Architecture and engineering rationale | [ARCHITECTURE.md](../../ARCHITECTURE.md), [ENGINEERING.md](../../ENGINEERING.md) |
| Decisions | [content/decisions/](../decisions/) — those were rewritten, because they are still live guidance rather than history |

The repository's `no-oxygen` CI gate skips this directory for the same reason
this file exists. If you are adding something here, it is because it has stopped
being true; if you are reading something here, check the current source before
believing it.
