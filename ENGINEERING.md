# Oxygen UI — Engineering Standard

**This is the document every component, feature, bug fix, release, and
contribution is evaluated against.** If a review and this document disagree,
this document is wrong and should be changed by pull request — not worked
around.

It opens with the definition of done, because that is the part people actually
read.

---

## 0. Definition of done

### A pull request is done when

- [ ] It does one logical thing.
- [ ] `pnpm gen:check && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` passes locally.
- [ ] Public API changes are reflected in the committed `api.md` and reviewed.
- [ ] A changeset is attached for every published package it touches.
- [ ] Visual changes have updated, **reviewed** VRT baselines and screenshots in both themes.
- [ ] No new runtime dependency without an ADR.
- [ ] No real patient data anywhere in the diff.

### A component is done when

|                                                              | experimental | beta | stable |
| ------------------------------------------------------------ | :----------: | :--: | :----: |
| Implementation + `meta.ts`                                   |      ✅      |  ✅  |   ✅   |
| Unit tests                                                   |      ✅      |  ✅  |   ✅   |
| Shared contract suite                                        |      ✅      |  ✅  |   ✅   |
| Stories covering **every** declared state                    |      —       |  ✅  |   ✅   |
| axe clean × 2 themes × 3 densities                           |      —       |  ✅  |   ✅   |
| Coverage ≥ 90% lines / 85% branches                          |      —       |  ✅  |   ✅   |
| Interaction tests (if interactive)                           |      —       |  ✅  |   ✅   |
| VRT baselines                                                |      —       |  —   |   ✅   |
| Type tests (`expect-type`)                                   |      —       |  —   |   ✅   |
| `api.md` committed                                           |      —       |  —   |   ✅   |
| Forced-colours + 200% zoom + 320px reflow verified           |      —       |  —   |   ✅   |
| Manual screen-reader pass recorded (NVDA · JAWS · VoiceOver) |      —       |  —   |   ✅   |

Enforced by `pnpm gen --strict` in CI. **Nothing starts at `stable`.**

### A release is done when

- [ ] Every gate in §16 is green on the release commit.
- [ ] `check-tarball.mjs` passes for every publishable package.
- [ ] Changelogs are generated and readable by someone upgrading.
- [ ] A migration guide exists for every breaking change.
- [ ] SBOM attached; provenance signed.
- [ ] A maintainer approved the version PR.

---

## 1. Purpose and scope

Oxygen UI is a component library for healthcare interfaces. It is used by teams
building software that clinicians and patients depend on. Two consequences run
through everything below:

1. **The states a demo skips are the states users hit.** Absence, uncertainty,
   partial failure, restricted records, and long waits are the normal working
   set, not edge cases.
2. **A silent defect is worse than a loud one.** A component that renders
   _something_ wrong outranks a component that throws, because nobody
   investigates a screen that looks fine.

Oxygen is **not a compliance boundary**, not a medical device, and not clinical
decision support. Say so on every surface that could be mistaken for a claim.

## 2. Architecture invariants

These are not preferences. A change that breaks one needs an ADR.

1. **Dependencies point away from the domain.** `L0 foundation` (tokens, FHIR
   types, intl) → `L1 behaviour` → `L2 components` → `L3 composition` →
   `L4 distribution`. A module imports from its own layer or below, never above.
   Enforced by `dependency-cruiser`.
2. **L0 holds no React.** It must be consumable by a Vue app, a server, or a
   test harness.
3. **One behaviour source.** No component's logic is written twice. Every
   delivery channel is a thin binding over the same core, or generated from it.
4. **Adding a component touches one directory.** Everything shared is generated.
   If you are hand-editing a shared file to add a component, the generator is
   wrong.
5. **Zero runtime dependencies by default.** Each one is a supply-chain entry a
   customer's security team must review.
6. **Components cannot reach the environment, the network, `eval`, `innerHTML`,
   or the app.** Lint-enforced and re-checked at registry build.
7. **Generated files are never hand-edited.** They carry a banner; CI fails on
   drift.

## 3. Component anatomy

One directory, no variants of the layout:

```
<name>/
├── <name>.tsx           implementation — bindings only, no duplicated logic
├── <name>.meta.ts       the single source of truth for docs and registry
├── <name>.stories.tsx   docs + VRT + a11y + interaction fixture, written once
├── <name>.test.tsx      unit and integration
├── <name>.api.md        api-extractor report (stable tier)
└── <name>.css           only when tokens cannot express it — rare
```

Scaffold with `pnpm gen:component <name>`. Never by hand.

## 4. Naming

**Files and folders** — `kebab-case`. The directory name _is_ the registry name,
the URL slug, and the npm subpath; the generator fails if `meta.name` disagrees.

**Symbols** — React components `PascalCase`; hooks `useCamelCase`; custom
elements `ox-kebab-case`; CSS classes `ox-<component>__<part>`; custom
properties `--ox-<component>-<property>`.

**Props**

| Rule                              | Yes                                        | No                             |
| --------------------------------- | ------------------------------------------ | ------------------------------ |
| Booleans read as state or ability | `showLabel`, `disabled`, `lockScroll`      | `isVisible`, `hasLabel`        |
| Time carries its unit in the name | `delay`, `minDuration`, `slowAfter`        | `timeout`, `wait`              |
| Enums are lowercase string unions | `mode="inline\|overlay\|page"`             | `overlay` + `page` booleans    |
| Handlers name the event           | `onSlow`, `onOpenChange`                   | `onSlowCallback`, `handleSlow` |
| Controlled pairs                  | `value` + `defaultValue` + `onValueChange` | `value` + `onChange` alone     |
| Clinical vocabulary               | follows [CONTENT.md](CONTENT.md) §7        | invented shorthand             |

**Every component accepts** `className`, `style`, `id`, `data-*`, `aria-*`, and
**forwards `ref`**.

## 5. Public API design

- Everything exported from a package entry point is public and semver-protected.
  Internals are `@internal` and excluded from the `api.md` report.
- **Composition over configuration** past three related props.
- **Do not export helpers to make tests easier.** A test may import from a
  relative path; the public surface is for consumers.
- **Model states as types, not booleans.** `progress?: number` switching
  `role="status"` to `role="progressbar"` is one prop and two coherent
  behaviours. Two booleans that can both be true is a bug waiting.
- **Clamp inputs that could produce an unsafe render.** A cadence prop that
  accepts 180 bpm on a clinical screen will be read as a measurement.

## 6. Accessibility bar

WCAG 2.2 AA is the floor for every component, in every theme and density.

- Zero axe violations across themes and densities, per story.
- Keyboard path documented and tested; visible focus; no focus traps.
- `prefers-reduced-motion` gets a **designed** still state — a paused animation
  frozen mid-sweep looks like a component that failed.
- Nothing above 3 Hz; no meaning carried by colour alone; forced-colours
  verified.
- 200% zoom and 320px reflow verified before `stable`.
- Live regions announce **content** — an empty one announces nothing, so a
  visually hidden label is still a rendered label.
- Screen-reader pass on NVDA, JAWS, and VoiceOver recorded before `stable`.

A VPAT/ACR is published per release.

## 7. Content and clinical copy

[CONTENT.md](CONTENT.md) is normative. The two rules with lint behind them:

- **Absence is stated, never punctuated.** Not `—`, not `N/A`.
- **An uninterpreted result is not a normal one.**

All user-visible strings go through `@oxygenui/intl`. Patient-facing and
clinician-facing strings are **different catalogs**, not different tones.

## 8. Tokens and theming

- Three tiers: primitive → semantic → component. A component token may reference
  semantic or density, **never** a primitive. Lint-enforced.
- Every colour a component uses resolves through a semantic token. No literals,
  no Tailwind palette classes.
- New colour pairs are added to the contrast gate in the same PR that adds them.
  A pair the gate does not name is a pair that is not checked.
- Logical properties only (`ms-`, `pe-`, `text-start`) — physical ones do not
  flip in RTL and the bug is invisible until someone opens the interface in
  Arabic.

## 9. Testing requirements

See §0 for the tier table. Beyond it:

- **Test behaviour, not implementation.** Assert what a reader or a screen
  reader gets.
- **Every declared state in `meta.ts` has a story.** That is what makes the
  states honest.
- **VRT must be deterministic** — pinned browser, frozen time, paused
  animations, fixed viewport, subset fonts. A flaky VRT suite is worse than none
  because the team learns to ignore it.
- **Never read the wall clock to decide what to render.** Output that depends on
  when it rendered cannot be visually regression-tested.
- **A bug fix ships with the test that would have caught it.** State in the PR
  why the existing suite did not.

## 10. Documentation

Every component page carries: purpose · when to use and when not to · a live
preview of **every** declared state · a generated props table · accessibility
notes · keyboard map (if interactive) · i18n notes · install command · source ·
related components.

Props tables are generated from types. Never write a prop down twice.

## 11. Performance budgets

| Budget                           | Limit                                            |
| -------------------------------- | ------------------------------------------------ |
| Per-component CSS                | ≤ 2.5 KB gz                                      |
| Element runtime                  | ≤ 3.5 KB gz                                      |
| Animated properties              | `transform`, `opacity`, `stroke-dashoffset` only |
| Frame rate under 4× CPU throttle | ≥ 55 fps                                         |
| Layout shift on mount            | CLS 0                                            |
| Long tasks on mount              | none > 50 ms                                     |

Enforced by `size-limit` and a Playwright trace.

## 12. Security constraints

- No `process.env`, `fetch`, `WebSocket`, `EventSource`, `eval`, `Function`,
  `dangerouslySetInnerHTML`, or `console.*` in component source.
- Caller-supplied text is set with `textContent`, never as markup.
- No real patient data in the repository, its issues, or its analytics.
- New runtime dependencies require an ADR naming the alternative considered.
- Report vulnerabilities per [SECURITY.md](SECURITY.md), never in a public
  issue.

## 13. Versioning and breaking changes

| Change                               | Bump      | Also required             |
| ------------------------------------ | --------- | ------------------------- |
| New optional prop                    | minor     | changeset                 |
| New component                        | minor     | changeset                 |
| New **required** prop                | **major** | migration guide + codemod |
| Rename or remove a prop or export    | **major** | deprecate ≥ 1 minor first |
| Default value change altering output | **major** | migration note            |
| Visual change beyond token values    | minor     | VRT baseline reviewed     |
| Public token rename                  | **major** | alias kept for one major  |
| ARIA role or name change             | **major** | a11y re-verification      |
| Bug fix, no API change               | patch     | changeset                 |

**Support window:** current major, plus the previous major for 12 months.

## 14. Deprecation policy

1. Announce in a minor. Mark `@deprecated` with the replacement named.
2. Document the migration on the component page.
3. Ship a codemod where the change is mechanical.
4. Keep it working for **at least two minors**.
5. Remove in the next major, listed in the migration guide.

Never remove something in a minor because "nobody uses it". You cannot know
that about a copy-source library.

## 15. Release process

Changesets. Every published change needs one — CI-enforced. `changeset version`
opens a version PR; a **maintainer approves it**; merging publishes with npm
provenance via OIDC. SBOM is attached to the GitHub release.

Release notes are written for the person upgrading.

## 16. CI quality gates

The authoritative list. All are blocking.

| Gate                        | Command                                              |
| --------------------------- | ---------------------------------------------------- |
| Generated files current     | `pnpm gen` + `git diff --exit-code`                  |
| Dependency advisories       | `pnpm audit --audit-level=high`                      |
| Lint                        | `pnpm lint` (warning budget ratchets down, never up) |
| Format                      | `pnpm format:check`                                  |
| Types                       | `pnpm typecheck`                                     |
| Tests + coverage thresholds | `pnpm test`                                          |
| Build                       | `pnpm build`                                         |
| Accessibility               | `pnpm a11y` — axe, all pages, both themes            |
| Synthetic data              | PHI scan                                             |
| Static analysis             | CodeQL                                               |
| Tarball inspection          | `check-tarball.mjs`, every publishable package       |
| Catalog quality             | `pnpm gen --strict`                                  |

**The release workflow runs at least what a merge runs.** Publishing is the most
irreversible thing this repository does.

## 17. Review checklist

Reviewers check, in this order:

1. **Is it correct for the clinical case?** Absent, unverified, restricted,
   partial, stale.
2. **Is it accessible?** Keyboard, screen reader, contrast, motion,
   forced colours.
3. **Is the API consistent with §4 and §5?**
4. **Are the declared states real?** Every one has a story.
5. **Does it scale?** Would this pattern still be right at 200 components?
6. **Is the test the one that would have caught the bug?**
7. **Is the copy right?** [CONTENT.md](CONTENT.md).

Approve, or request changes with a reason and a suggested direction. "I would
have done it differently" is not a blocking comment.

## 18. Commit conventions

[Conventional Commits](https://www.conventionalcommits.org), enforced by
`commitlint`. Breaking changes get `!` and a `BREAKING CHANGE:` footer.

## 19. Dependency policy

Default answer is no. A new runtime dependency needs an ADR covering: what it
does that we cannot, its transitive footprint, its maintenance status, and the
licence. Dev dependencies are lower-stakes but still reviewed.

Dependabot opens grouped weekly PRs; the full gate set decides them.

## 20. ADR process

Anything that changes an invariant in §2 gets an ADR in
[`content/decisions/`](content/decisions/): context, decision, consequences,
status. Propose it in the PR that implements it. An ADR that stays `proposed`
past its implementation is a documentation bug — ratify or supersede it.

## 21. Amending this document

By pull request, with a maintainer review, and a note in `CHANGELOG.md`. If you
found a rule here that made you do the wrong thing, that is the most valuable
pull request you can send.
