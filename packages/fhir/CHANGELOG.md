# @oxygenui-design/fhir

## 0.1.1

### Patch Changes

- Fix ESM resolution: emit explicit `.js` extensions on relative imports.

  `dist/index.js` and `dist/index.d.ts` in 0.1.0 emitted `export * from "./types"`
  with no file extension. Node's ESM resolver requires explicit extensions, so any
  consumer importing the package outside a bundler failed with
  `ERR_MODULE_NOT_FOUND`, and TypeScript projects on `moduleResolution: NodeNext`
  could not resolve the types either. Bundled consumers (Next, Vite) were
  unaffected, which is why the build, typecheck, and `npm publish --dry-run` all
  passed.

  Relative imports in `src` now carry `.js`, which TypeScript resolves back to the
  `.ts` source during development and emits verbatim for Node at runtime.

  Also corrects the README example, which called `formatHumanName(patient.name)` —
  that helper takes a single `HumanName`, not the array on a Patient. The correct
  entry point for a Patient is `resolvePatientName`, which applies FHIR name-use
  precedence and skips names marked `old`.
