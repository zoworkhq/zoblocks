# Recorder — build spec

The design brief is `oxygen-recorder-brief.html` at the repo root. **Open it and
read it** — it is the specification, not a summary of one. This file is the
build order, the acceptance gates, and the traps.

Everything below is derived from that brief. Where the two disagree, the brief
wins on design and this file wins on repo mechanics.

---

## What is being built

One component, `Recorder`, over one zero-dependency engine, `recorder-core`.
Five arts selected by a `variant` prop: **pulse, bars, strip, duet, stream**.

The load-bearing claim, and the thing that must never be compromised for
convenience: **the art is a pure function of the signal.** No timer, no phase,
no clock of its own. If the analyser reports nothing, nothing moves — and then
the surface must *say* it is not capturing, because a flat waveform and a quiet
room look identical and have opposite consequences.

---

## Order of work — commit and push after EVERY numbered step

Each step must leave `main`-quality work on the branch. A run that stops after
step 3 must be useful, not wreckage. Push after each step; do not batch.

### 1. `packages/recorder-core` — the engine
Mirror `packages/tabs-core` exactly for layout: `package.json`, `tsconfig.json`,
`vitest.config.ts`, `src/`, `test/`, `README.md`. Zero runtime dependencies
(ADR 0009, ENGINEERING.md §2.5). No React. No DOM types in the public API.

- `createSignal({ stream, release, floor })` — AnalyserNode →
  `getFloatTimeDomainData` → **peak** magnitude per frame (not RMS: RMS smooths
  away exactly the transients that prove the microphone is open) → envelope →
  30 Hz peak buckets → subscribers.
  - **Attack 0 ms, release 180 ms exponential.** Symmetric smoothing is the
    single commonest defect in audio UI. Do not "improve" this.
  - Voice floor `0.085`. Visual gain `x ** 0.62` (ears are logarithmic).
  - Split the loop so `step(dt)` takes its own delta and the rAF wrapper only
    supplies it. Output must not depend on when it rendered, or no visual
    regression test can ever pin it down. Expose a `pump(n, dt)` test hook.
- `PeakBuffer` — `Float32Array` ring, binary reduction for overviews, plus the
  peaks-sidecar serialiser. A 20-minute encounter is 36,000 buckets = 144 kB.
- `createRecorderMachine()` — the eleven phases and four terminals in §06 of the
  brief. **The `armed → recording` edge is blocked without resolved consent, and
  that check lives here, not in a button handler.**
- `describeSilence()` and `resolveConsent()` — pure, so the copy is testable and
  translatable rather than inline JSX.

Tests: unit-test the envelope numerically (feed a step function, assert the
attack is instant and the release hits 1/e at 180 ms), the bucket rate, the
machine's illegal transitions, and the silence budget.

### 2. The thirteen fault detectors
§11 of the brief, each with a test that simulates it. Rows 3, 4, 6 and 7 produce
**byte-identical** signal output and are separated by *device state* — so this
listens to `devicechange` and the track lifecycle, not only the analyser.
**Row 7 (wrong device selected) has no signal-level defence at all**; the API
must therefore surface the device name as a first-class, always-rendered value.
This step is unglamorous and it is the actual product. Do not let it slip.

### 3. `registry/oxygen/lib/recorder.ts` + `recorder.css`
The shared frame and stylesheet, following `registry/oxygen/lib/loader.tsx` and
`loader.css` as the closest precedent.

### 4. The five arts + `<Recorder>`
Read the brief's §04 markup and §14 API. Below 280 px, `bars` reports itself as
`strip` — the same self-demotion `pulse-loader` already does below 40 px.

**Duet is the differentiated one.** The waveform's axis carries the speaker —
clinician above the line, patient below — not lanes underneath. It needs peaks
*and* one speaker byte per bucket. Where diarisation is absent it must collapse
to a single rail rather than guess: a wrongly attributed rail is worse than no
attribution.

Two things from the brief that a reasonable engineer will get wrong:
- **The transport does not grey out when muted.** The recording is still
  running and the file is still growing. Greying the record dot says "not
  recording", which is false. Only the *signal* greys.
- **The played/unplayed boundary is not carried by fill colour.** §10 shows the
  two requirements have no common solution on one hue ramp. Unplayed is solved
  to 3:1 against the pane; the boundary is a tinted region wash plus the
  playhead. Colour is redundancy.

### 5. The seven gates
`pnpm gen:strict` and the root tests fail on any of these. All seven, or the
step is not done:

1. `registry/oxygen/lib/recorder.ts` + `.css`, **and** a `recorder-core` support
   item in `scripts/gen/emit/registry.ts` **and** in `SUPPORT_ITEM_NAMES` in
   `scripts/gen/config.ts` (currently a 21-entry Set — append, do not rewrite).
2. Path aliases in `scripts/gen/emit/tsconfig-paths.ts` **and** in
   `apps/docs/tsconfig.json`. The second is hand-kept and policed by
   `test/generated-paths.test.ts`.
3. Stylesheet registered in `scripts/gen/emit/react-package.ts` (copy list,
   import rewriter, styles map), an owner entry in
   `test/css-namespace.test.ts`, and an import in
   `apps/docs/src/app/globals.css`.
4. Every `--ox-recorder-*` custom property declared in
   `packages/tokens/tokens/component.json` **before** the CSS references it.
5. Preview scenarios in `apps/docs/src/components/site/component-preview.tsx`
   **and** card art in `component-card.tsx`. `test/docs-coverage.test.ts`
   requires both.
6. Reciprocal `related` edges on both ends.
7. A core importing another core declares it in that item's
   `registryDependencies`.

---

## Traps that have already cost this repo time

- **The npm barrel is flat**, so every core's helpers collide on the obvious
  name. `describeElapsed` was taken and became `describeElapsedShort`. Name
  yours `describeSilence`, `recorderStatusWord`, `recorderFromObservation` from
  the start. Guarded by `test/react-barrel.test.ts`.
- **A stylesheet naming a token that does not exist fails silently**, because
  the `var()` fallback wins. `--ox-surface-sunken` and `--ox-radius-md` never
  existed; the real names are `--ox-bg-muted` and `--ox-radius`. Guarded by
  `test/stylesheet-tokens.test.ts`.
- **`@/lib/utils` resolves to the docs app's own utils inside the docs build**,
  not the registry's. Shared helpers go in their own `@/lib/oxygen-*` module.
  Guarded by `test/shared-alias-shadowing.test.ts`.
- A registry component may depend on a workspace package, but that package must
  be in the **root** devDependencies or the generator's typecheck cannot
  resolve it.
- Events are **hyphenated, never colon-separated**: `ox-recorder-start`, not
  `ox-recorder:start`. Angular reserves the colon in `(event)` bindings for
  global targets and a colon name is uncompilable in an Angular template. The
  loaders learned this expensively; a reflection test enforces it.
- Throttle `ox-recorder-level` to 10 Hz. Nobody wants 60 React renders a second.

---

## Acceptance — run these, and do not report success without them passing

```
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm gen:strict
```

`pnpm lint` runs a `--max-warnings 8` ratchet. If you push it over budget, fix
the warnings; do not raise the ceiling.

## Out of scope — do not build

**Phase 4 of the brief: consent copy, disclosure wording, the redaction control,
and Part 2 behaviour.** It is blocked on a named clinical reviewer and a legal
review that do not exist. Leave `consent` as a typed, host-supplied opaque object
that the component renders and never authors — no copy, no defaults, no
guidance. Writing confident sentences about lawful basis is not an engineering
decision.

Do not build the custom-element/web-component build either. React first; revisit
if a Vue or Angular customer asks.
