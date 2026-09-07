#!/usr/bin/env bash
#
# The same gates CI runs, in the same order, on your machine.
#
# Why this exists: `.husky/pre-commit` runs `lint-staged`, which by design only
# sees the files in the current commit. That is the right thing for a
# pre-commit hook — it is fast, and it keeps what you wrote tidy — but it is
# structurally incapable of catching the failures that actually break a build:
#
#   · a new lint rule that flags pre-existing code in a package you did not touch
#   · a dependency change that breaks a different package (a lockfile is shared)
#   · a type error that only appears across a package boundary
#   · `format:check`, which is repo-wide and has no staged-files equivalent
#
# Every one of those is invisible to `lint-staged` and fatal in CI. This script
# closes that gap, and `.husky/pre-push` runs it so nobody has to remember.
#
# Three tiers, because one budget cannot serve both a pre-push hook and a
# pre-merge check:
#
#   pnpm verify --fast   under a minute. Everything static: generated
#                        artifacts, lint (including the workflows), format,
#                        types, dependency rules, the audit, and the synthetic
#                        data scan. This is what `pre-push` runs.
#   pnpm verify          the above, plus tests, coverage, build and bundle
#                        budgets. What you run before opening a pull request.
#   pnpm verify --ci     everything CI runs, including the accessibility audit
#                        and the browser suite in three engines.
#
# The audit and the PHI scan moved into `--fast` because they are nearly free —
# `pnpm audit` took one second in CI and the scan is a pair of greps — and both
# can fail a build for a reason worth learning in one second rather than in
# fifteen minutes.
#
# `--ci` exists because the gap it closes was expensive. Three separate red
# builds in one week came from the browser suite, none reproducible except
# under a full parallel run, and each cost a push-and-wait cycle to observe.
# With Turbo's cache warm, the build and test portions are near-instant on an
# unchanged tree, so the marginal cost of `--ci` is the browser suite alone.
#
# If you add a step to .github/workflows/ci.yml, add it here too. A gate that
# only exists in CI is a gate you find out about from a red pull request —
# `test/gate-parity.test.ts` fails when the two lists disagree.

set -uo pipefail

FAST=0
FULL_CI=0
for arg in "$@"; do
  case "$arg" in
    --fast) FAST=1 ;;
    --ci) FULL_CI=1 ;;
    *) echo "verify: unknown argument '$arg'" >&2; exit 2 ;;
  esac
done

# Non-interactive shells (hooks, CI) get no colour.
if [ -t 1 ]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; DIM=$'\033[2m'; OFF=$'\033[0m'
else
  BOLD=""; RED=""; GREEN=""; DIM=""; OFF=""
fi

FAILED=()

# Run one gate. Output is captured and only shown on failure — a gate that
# prints 400 lines when it passes trains people to stop reading it.
step() {
  local name="$1" fix="$2"; shift 2
  printf "  %-28s" "$name"
  local output
  if output=$("$@" 2>&1); then
    printf "%s✓%s\n" "$GREEN" "$OFF"
  else
    printf "%s✗%s\n" "$RED" "$OFF"
    FAILED+=("$name|$fix")
    printf "%s%s%s\n" "$DIM" "$(printf '%s\n' "$output" | tail -25)" "$OFF"
  fi
}

printf "\n%sVerifying%s %s(the same gates CI runs)%s\n\n" "$BOLD" "$OFF" "$DIM" "$OFF"

# Order mirrors .github/workflows/ci.yml so that whichever gate fails here is
# the one that would have failed there.
step "generated artifacts"  "pnpm gen"                    pnpm gen:check
step "lint"                 "pnpm lint:fix"               pnpm lint
step "format"               "pnpm format"                 pnpm format:check
step "typecheck"            "fix the type errors"         pnpm typecheck
step "dependency rules"     "see ARCHITECTURE.md"         pnpm deps
# Both of these are CI gates that lived only in CI. A high advisory and a real
# identifier in a fixture are each worth one second here rather than fifteen
# minutes of pipeline.
step "dependency audit"     "pnpm audit --fix, or pin"    pnpm audit --audit-level=high
step "synthetic data"       "use example.org fixtures"    bash scripts/no-phi.sh
step "retired name"         "use the current name"        bash scripts/retired-names.sh

if [ "$FAST" -eq 0 ]; then
  # One instrumented run, not two. `test:coverage` is a strict superset of
  # `test` now that every package defines both — verified by comparing
  # per-package suite counts, which matched at 20 packages and 2768 tests. CI
  # dropped its separate `Test` step for the same reason.
  step "tests and coverage" "fix the tests, or coverage"  pnpm test:coverage
  step "build"              "fix the build"               pnpm build
  # After build, because it measures dist. CI has always run this and this
  # script never did, so a blown budget could only be discovered from a red
  # pipeline — which is exactly how the last one was found.
  step "bundle budgets"     "trim it, or raise the budget"  pnpm size
fi

# The browser tier. Only under --ci, because it needs a production build and a
# running server, and the three engines take a few minutes between them.
#
# It is here at all because its absence was expensive: three red builds in one
# week came from this suite, none reproducible except under a full parallel
# run. Fifteen minutes to learn that, each time, from a pipeline.
if [ "$FULL_CI" -eq 1 ]; then
  step "accessibility"      "fix the axe violations"      bash scripts/verify-a11y.sh
  step "browser suite"      "see playwright-report/"      pnpm e2e:ci
fi

if [ ${#FAILED[@]} -eq 0 ]; then
  if [ "$FAST" -eq 1 ]; then
    printf "\n%s✓ fast gates pass%s %s(tests and browsers skipped — run \`pnpm verify\` or \`--ci\`)%s\n\n" "$GREEN" "$OFF" "$DIM" "$OFF"
  elif [ "$FULL_CI" -eq 1 ]; then
    printf "\n%s✓ everything CI checks passes locally%s\n\n" "$GREEN" "$OFF"
  else
    printf "\n%s✓ all gates pass%s %s(browsers skipped — run \`pnpm verify --ci\` for those)%s\n\n" "$GREEN" "$OFF" "$DIM" "$OFF"
  fi
  exit 0
fi

printf "\n%s%d gate(s) failed:%s\n" "$RED" "${#FAILED[@]}" "$OFF"
for entry in "${FAILED[@]}"; do
  printf "  %s%s%s — %s\n" "$BOLD" "${entry%%|*}" "$OFF" "${entry##*|}"
done
printf "\n"
exit 1
