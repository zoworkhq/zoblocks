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
#   pnpm verify          run everything CI runs
#   pnpm verify --fast   the quick pass: generated, lint, format, types, deps
#
# Full gates, in CI's order: generated artifacts · lint · format · typecheck ·
# dependency rules · tests · coverage thresholds · build.
#
# Turbo caches typecheck, test and build, so a second run costs seconds.
#
# If you add a step to .github/workflows/ci.yml, add it here too. A gate that
# only exists in CI is a gate you find out about from a red pull request.

set -uo pipefail

FAST=0
for arg in "$@"; do
  case "$arg" in
    --fast) FAST=1 ;;
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

if [ "$FAST" -eq 0 ]; then
  step "tests"              "fix the failing tests"       pnpm test
  # A separate gate from `tests`, and it has to be: coverage thresholds are
  # declared per package and a suite can pass while its package drops below
  # the bar for its stability tier. CI runs this as its own step; leaving it
  # out here was the second thing that reached a red PR.
  step "coverage"           "raise coverage, or justify"  pnpm test:coverage
  step "build"              "fix the build"               pnpm build
fi

if [ ${#FAILED[@]} -eq 0 ]; then
  if [ "$FAST" -eq 1 ]; then
    printf "\n%s✓ fast gates pass%s %s(tests skipped — CI still runs them)%s\n\n" "$GREEN" "$OFF" "$DIM" "$OFF"
  else
    printf "\n%s✓ everything CI checks passes locally%s\n\n" "$GREEN" "$OFF"
  fi
  exit 0
fi

printf "\n%s%d gate(s) failed:%s\n" "$RED" "${#FAILED[@]}" "$OFF"
for entry in "${FAILED[@]}"; do
  printf "  %s%s%s — %s\n" "$BOLD" "${entry%%|*}" "$OFF" "${entry##*|}"
done
printf "\n"
exit 1
