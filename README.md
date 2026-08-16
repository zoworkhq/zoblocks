<div align="center">

# Oxygen UI

**Healthcare components that already know what the data means.**

React components typed to FHIR R4, delivered through a shadcn registry.
The source is copied into your repository — yours to read, audit, and change.

[oxygenui.design](https://oxygenui.design) · MIT core

</div>

---

## What this is

Most component libraries render a value. They have no opinion about a result
that came back preliminary, a reference range that doesn't exist, a record
flagged restricted, or a potassium of 6.8. Those aren't edge cases in
healthcare — they are the normal working set.

Every component ships the states a demo would skip, handles reduced motion with
a designed still state rather than a paused one, and announces itself in words:

```tsx
import { PageLoader } from "@/components/oxygen/pulse-loader";

<PageLoader label="Loading your records" />;
```

The catalog is being rebuilt. The **Loaders** category ships today — five
independently installable components paced to resting physiology rather than to
a spinner. The clinical layer, which takes FHIR resources as props directly with
no adapter and no bespoke prop shape, follows on the rebuilt foundation.

Two clinical components ship on npm alongside it, both wrapping Ant Design:
[`@oxygenui-design/signature`](packages/signature/README.md), which records the
times nobody signed as carefully as the times somebody did, and
[`@oxygenui-design/identity`](packages/identity/README.md) — a patient avatar,
chip and banner, with a pass that keeps two patients who share a name apart on
a worklist.

**Not React?** The same loaders ship as dependency-free custom elements for Vue,
Angular, Svelte, or plain HTML — see
[`@oxygenui-design/loaders`](packages/loaders/README.md).

## Install

Register the namespace once, in your project's `components.json`:

```json
{
  "registries": {
    "@oxygenui": "https://oxygenui.design/r/{name}.json"
  }
}
```

Then add components by name:

```bash
pnpm dlx shadcn@latest add @oxygenui/pulse-loader
```

Without that `registries` entry the CLI has no way to resolve `@oxygenui`, so
the add command fails before it reaches the network. If you would rather not
edit `components.json`, pass the URL directly instead:

```bash
pnpm dlx shadcn@latest add https://oxygenui.design/r/pulse-loader.json
```

Components are distributed as source. The CLI writes the files into your
project, pulls in anything they share (`loader-core`, `utils`, `tokens`), and
adds any runtime dependencies to your `package.json`. The loaders add none.

Available today: `pulse-loader` · `rhythm-loader` · `breath-loader` ·
`helix-loader` · `infusion-loader`.

The `@oxygenui` in the install command is a shadcn registry namespace, not an
npm scope — it is a local alias for the URL above, and you can name it whatever
you like. The npm packages it pulls in are published under `@oxygenui-design`.

## Repository layout

```
oxygenui/
├─ apps/docs/           # oxygenui.design — marketing site, catalog, registry host
├─ packages/
│  ├─ fhir/             # @oxygenui-design/fhir — FHIR R4 types + pure read helpers
│  ├─ tokens/           # @oxygenui-design/tokens — semantic clinical CSS variables
│  ├─ intl/             # @oxygenui-design/intl — locale, units, message catalog
│  ├─ loaders/          # @oxygenui-design/loaders — the five loaders, as custom elements
│  ├─ react/            # @oxygenui-design/react — the React loader shells
│  ├─ signature-core/   # @oxygenui-design/signature-core — capture engine, no React
│  ├─ signature/        # @oxygenui-design/signature — the Ant Design surface
│  ├─ identity-core/    # @oxygenui-design/identity-core — identity engine, no React
│  ├─ identity/         # @oxygenui-design/identity — avatar, chip, patient banner
│  ├─ fixtures/         # synthetic, non-PHI FHIR fixtures for docs and tests
│  ├─ component-meta/   # the metadata schema every generated artifact derives from
│  ├─ eslint-plugin/    # lint rules enforcing the architectural invariants
│  └─ tsconfig/         # shared TypeScript configs
├─ registry/oxygen/     # component source — this is what customers receive
├─ content/decisions/   # architecture decision records
├─ scripts/gen/         # the generator
└─ ARCHITECTURE.md      # how it all fits together, and why
```

`registry/` is the source of truth for anything a customer installs. Those
files are copied verbatim into their project, so they must be self-contained
and readable on their own.

`registry.json`, `tsconfig.generated.json`, `apps/docs/src/lib/generated/`,
`apps/docs/public/r/`, and `apps/docs/public/llms.txt` are **generated**. Edit a
component's `*.meta.ts` and run `pnpm gen`; CI fails if they are stale.

## Development

```bash
pnpm install
pnpm gen              # generate the registry, catalog, and path mappings
pnpm dev              # docs site on http://localhost:6001
```

| Command                     | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `pnpm dev`                  | Run the docs site                                     |
| `pnpm build`                | Build every package and app                           |
| `pnpm test`                 | Package tests, then every registry component          |
| `pnpm test:registry`        | Just the components (no build needed)                 |
| `pnpm test:watch`           | Components, in watch mode                             |
| `pnpm test:coverage`        | Component coverage report                             |
| `pnpm lint`                 | Lint the workspace                                    |
| `pnpm typecheck`            | Typecheck the workspace, including registry source    |
| `pnpm gen`                  | Regenerate everything derived from component metadata |
| `pnpm gen:check`            | Verify nothing generated is stale (CI)                |
| `pnpm gen:component <name>` | Scaffold a new component                              |
| `pnpm changeset`            | Record a release intent                               |

### Adding a component

```bash
pnpm gen:component vitals-trend
```

Then fill in `registry/oxygen/vitals-trend/vitals-trend.tsx` and its
`vitals-trend.meta.ts`, and run `pnpm gen`.

**That is the whole process.** No shared file is edited. The registry manifest,
the docs catalog and its prop tables, TypeScript path mappings, the Tailwind
source list, and the agent manifest are all derived from the metadata and the
component's own types. `pnpm gen` refuses to run while the scaffolded
placeholders are still in place, and names each field it is waiting on.

Prop documentation is **extracted from the TypeScript types** and must never be
written by hand — a prop table is read as a contract, and one that has silently
drifted is worse than none.

Two things that used to break a component silently are now enforced:

- **Never build a class name from a variable.** Tailwind resolves classes by
  scanning source text, so `` `text-[var(--ox-status-${token})]` `` produces no
  CSS and severity styling vanishes. Use a literal lookup map.
  → `@oxygenui/no-dynamic-class-name`
- **Components reference semantic tokens, never raw palette values.** A
  component that reaches past `--ox-status-critical` to `--ox-red-600` ignores
  every brand override. → `@oxygenui/no-primitive-token`

The Tailwind `@source` list, previously a manual step with the same failure
mode, is generated.

### Testing a component

Every component has a colocated `<name>.test.tsx`, run against the same source
a customer receives. `pnpm gen` reports any component without one, and the
generated `coverage.json` records the count.

A test here asserts **the safety claim the component exists to make**, not that
it renders. The distinction matters, because the failures worth catching all
look fine on screen:

```tsx
it("shows an uninterpreted result as uninterpreted, never as normal", () => {
  render(<PulseLoader label="Loading results" />);
  expect(screen.getByText(/not interpreted/i)).toBeInTheDocument();
  expect(screen.queryByText(/^normal$/i)).not.toBeInTheDocument();
});
```

Three conventions:

- **Start from the component's own doc comment.** Each one states its rules in
  prose — comparators survive, unknown is loud, absence routes to `AbsentValue`.
  Those sentences are the test list, and quoting the relevant one above a test
  keeps the two from drifting apart.
- **Use `@oxygenui-design/fixtures`.** It deliberately over-represents the hard
  states — critical, uninterpreted, masked, refuted, expired — which are the
  ones products get wrong and demos skip. Never write PHI-shaped data.
- **Assert the meaning is in words.** `expectStatedInWords` from
  [`test/contract.tsx`](test/contract.tsx) checks that a state is readable
  without colour. `itMeetsTheContract` adds the floor every component owes: no
  `undefined` or `Invalid Date` reaching the screen, every interactive control
  accessibly named, and never rendering nothing at all.

### Architecture

[`ARCHITECTURE.md`](ARCHITECTURE.md) describes the target platform — layer
model, package topology, distribution channels, theming, testing, versioning,
and the phased path from here. Individual decisions and their rejected
alternatives live in [`content/decisions/`](content/decisions/).

## Principles

**Absence is a state.** A missing value renders as explicitly missing. A blank
cell is indistinguishable from a rendering failure, and in a chart that
ambiguity is dangerous.

**Never color alone.** Every severity carries an icon, a text label, and a
second structural cue. Components must stay readable in forced-colors mode and
in grayscale.

**Don't infer clinical meaning.** An interpretation stated in the payload
always wins. Where none is stated, it is derived only by comparing a value to
its own reference range. Nothing else is guessed.

**Synthetic data only.** Every fixture, demo, and screenshot uses invented
values on reserved `example.org` systems. No PHI enters this repository, its
issues, or its analytics.

## What this is not

Oxygen UI is **not a compliance boundary**. Installing it does not make an
application HIPAA, GDPR, or DPDP compliant, and it is not a medical device or
clinical decision support. Access control, audit, data residency, and clinical
validation remain yours.

It is well-built UI with healthcare implementation guidance. That is the claim,
and it is the only one we make.

## Contributing

Read [`ENGINEERING.md`](ENGINEERING.md) first — it is the standard every
component, fix, and release is evaluated against, and it opens with a
one-page definition of done. Then [`CONTRIBUTING.md`](CONTRIBUTING.md) for the
mechanics.

Security issues go to the process in [`SECURITY.md`](SECURITY.md), never to a
public issue.

## License

MIT for the core — see [LICENSE](LICENSE). Premium registry resources, when
introduced, will carry a separate commercial license stated on each item.

Built by [Zowork](https://github.com/zoworkhq).
