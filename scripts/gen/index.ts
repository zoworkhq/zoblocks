/**
 * The generator.
 *
 * Reads every component's *.meta.ts plus its TypeScript types, and produces
 * every shared artifact the platform derives from them:
 *
 *   tsconfig.generated.json                     path mappings
 *   registry.json + apps/docs/public/r/*.json   the shadcn registry
 *   apps/docs/src/lib/generated/catalog.ts      the docs catalog
 *   apps/docs/src/app/generated-sources.css     Tailwind source globs
 *   apps/docs/public/llms.txt                   agent-readable catalog
 *   apps/docs/public/r/coverage.json            the quality gate's evidence
 *
 *   pnpm gen             write
 *   pnpm gen --check     verify nothing is stale (CI)
 *   pnpm gen --strict    also enforce the per-component coverage gate
 *
 * The point of all of this is that adding a component touches one directory.
 * See content/decisions/0004-generated-component-metadata.md.
 */

import { emitAgentManifest } from "./emit/agents";
import { buildCatalog, emitCatalog } from "./emit/catalog";
import { buildCoverage, emitCoverage } from "./emit/coverage";
import { emitReactPackage, ensureReactPackageDirs } from "./emit/react-package";
import { emitRegistry } from "./emit/registry";
import { emitTailwindSources } from "./emit/tailwind-sources";
import { emitTsconfigPaths } from "./emit/tsconfig-paths";
import { MetaError, loadComponents } from "./load";
import { diagnoseComponents, extractProps } from "./props";
import { emitTokens } from "./tokens/emit";
import { loadTokenSource } from "./tokens/load";
import { validateTokens } from "./tokens/validate";
import { Emitter } from "./write";

const CHECK = process.argv.includes("--check");
const STRICT = process.argv.includes("--strict");

function report(title: string, lines: string[]) {
  console.error(`\n✗ ${title}\n`);
  for (const line of lines) console.error(`  ${line}`);
  console.error("");
}

async function main() {
  const components = await loadComponents();
  const emitter = new Emitter(CHECK);

  // Tokens first. Every component's styling resolves through them, and a token
  // problem is the kind that renders rather than throwing — a status colour
  // below the contrast floor, a theme missing a key, a component token reaching
  // past the semantic tier to a primitive. None of those fail a typecheck, so
  // this is the only place they get caught.
  const tokenSource = await loadTokenSource();
  const tokenProblems = validateTokens(tokenSource);
  if (tokenProblems.length) {
    report(
      `${tokenProblems.length} token problem(s)`,
      tokenProblems.map((p) => p.message),
    );
    process.exit(1);
  }
  await emitTokens(tokenSource, emitter);

  /*
   * Two audiences from here on.
   *
   * `registryComponents` are the ones with source in registry/oxygen — the
   * files copied verbatim into a customer's repository. Everything that reads,
   * typechecks, or republishes that source takes this list.
   *
   * `components` is everything the *catalog* should show, including package
   * components like Signature, which have no registry source at all. Handing a
   * package component to a registry emitter is how it ends up trying to read an
   * empty path.
   */
  const registryComponents = components.filter((c) => c.meta.distribution === "registry");

  // Path mappings are emitted before anything reads types, so a newly added
  // component's imports resolve on the same run that introduces it.
  await emitTsconfigPaths(registryComponents, emitter);

  // These are the exact files copied into a customer's repository. Typechecking
  // them here is the only place it happens — the root tsconfig that covers them
  // is not part of any workspace task.
  const diagnostics = diagnoseComponents(registryComponents);
  if (diagnostics.length) {
    report(`${diagnostics.length} type error(s) in component source`, diagnostics);
    console.error("  These files ship to customers verbatim. Fix them before generating.\n");
    process.exit(1);
  }

  // Every component, not just the registry ones. The props table is the bulk
  // of a component's documentation, and a package component that renders three
  // empty headings looks broken rather than undocumented.
  const props = extractProps(components);

  const registryProblems = await emitRegistry(registryComponents, emitter);
  if (registryProblems.length) {
    report(`${registryProblems.length} registry problem(s)`, registryProblems);
    process.exit(1);
  }

  // The npm React channel is derived from the registry source rather than
  // hand-written beside it — see emit/react-package.ts for why the direction
  // runs this way.
  await ensureReactPackageDirs();
  await emitReactPackage(registryComponents, emitter);

  await emitCatalog(buildCatalog(components, props), emitter);
  await emitTailwindSources(registryComponents, emitter);
  await emitAgentManifest(components, emitter);

  const coverage = buildCoverage(components, props);
  await emitCoverage(coverage, emitter);

  // ---------------------------------------------------------------------
  // Result
  // ---------------------------------------------------------------------

  if (CHECK && emitter.drifted.length) {
    report(
      `${emitter.drifted.length} generated file(s) are stale`,
      emitter.drifted.map((d) => `${d.status === "missing" ? "missing" : "stale  "}  ${d.path}`),
    );
    console.error("  Run `pnpm gen` and commit the result.\n");
    process.exit(1);
  }

  if (coverage.failures.length) {
    const heading = `${coverage.failures.length} component(s) do not meet the bar for their stability tier`;
    if (STRICT) {
      report(heading, coverage.failures);
      process.exit(1);
    }
    console.warn(`\n⚠ ${heading}`);
    for (const failure of coverage.failures.slice(0, 8)) console.warn(`  ${failure}`);
    if (coverage.failures.length > 8) {
      console.warn(
        `  … and ${coverage.failures.length - 8} more — see apps/docs/public/r/coverage.json`,
      );
    }
    console.warn(
      "  Not fatal yet. Becomes fatal under --strict once story and test infrastructure lands.\n",
    );
  }

  const totalProps = [...props.values()].reduce(
    (n, exports) => n + exports.reduce((m, e) => m + e.props.length, 0),
    0,
  );

  if (CHECK) {
    console.log(
      `✓ generated output is current — ${components.length} components, ${totalProps} extracted props, ${emitter.results.length} files checked`,
    );
    return;
  }

  const changed = emitter.changed;
  console.log(
    `✓ ${components.length} components → ${emitter.results.length} files (${changed.length} changed), ${totalProps} props extracted from types`,
  );
  for (const file of changed.slice(0, 12)) console.log(`  ${file.path}`);
  if (changed.length > 12) console.log(`  … and ${changed.length - 12} more`);
}

main().catch((error: unknown) => {
  if (error instanceof MetaError) {
    report(error.message, error.problems);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});
