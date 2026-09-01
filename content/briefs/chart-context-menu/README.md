# Chart Context Menu — brief generator

Builds `oxygen-context-menu-brief.html` at the repo root.

```bash
cd content/briefs/chart-context-menu && python3 build.py
```

No dependencies. It hard-fails on any unsubstituted `@@TOKEN@@` rather than
shipping a hole.

## Why this is here

The brief is generated, not hand-written, so a score or a claim cannot desync
from the prose that quotes it. Every brief in this series worked that way and
every one of them kept its sources in an ephemeral session scratchpad — so the
moment the code moved on, the only way to correct the document was to rewrite
it. This one is the first to move in. §21 of the brief exists because of the
three days it spent uncorrectable.

**Rebuild it when the component changes.** A brief that disagrees with the code
is worse than no brief, because it is quoted.

## Layout

| File         |                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `build.py`   | Assembles and writes the HTML. Start here.                                                                                                    |
| `prose_a.py` | Sections 1–11.                                                                                                                                |
| `prose_b.py` | The hero, sections 12–22, and the code highlighter.                                                                                           |
| `base.css`   | Document chrome, shared with the rest of the brief series. Lifted from `oxygen-datetime-brief.html`; keep it in step so the set reads as one. |
| `menu.css`   | Mockup primitives specific to this brief.                                                                                                     |
| `core.js`    | A working prototype of `menu-core`, written to the API §16 proposes.                                                                          |
| `ui.js`      | The renderer. Nothing in it decides anything; it asks `core.js`.                                                                              |
| `data.js`    | Six clinical action sets. Synthetic — no real person, no real MRN.                                                                            |
| `mock.js`    | The two in-situ EHR screens.                                                                                                                  |
| `figs.js`    | The seventeen live figures.                                                                                                                   |

## Two rules the prototype inherits from the real component

1. **Nothing reads the wall clock.** `NOW` is injected in `core.js`, so the
   document renders identically next March (ENGINEERING.md §9).
2. **No network, no DOM in the engine.** `core.js` would run in Node. That split
   is the brief's central architectural claim, so the report is built the same
   way as the thing it argues for.

## Traps

- `base.css` sets `.i { display: block }`, which orphans an inline icon onto its
  own line. Override in `menu.css`.
- Mockups render in stock **Ant Design v6 token values**, deliberately: what a
  reader judges should be the proposal in the system we build on, not a teal
  impression of it.
- Screenshots of very tall pages composite blank below ~2,000px, and
  `html { scroll-behavior: smooth }` makes a scripted `scrollIntoView` race the
  capture. Set `scrollBehavior = "auto"` first.
