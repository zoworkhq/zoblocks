#!/usr/bin/env bash
#
# Fixtures must stay synthetic.
#
# This catches the obvious mistakes — a real terminology system, a vendor
# hostname, an SSN-shaped literal, a real person's email address — not every
# possible one. It is a backstop for review, not a substitute for it.
#
# It lives in a script rather than inline in the workflow so that CI and
# `pnpm verify` run the identical patterns. Inline, it was a CI-only gate: a
# developer could not run it without copying shell out of a YAML file, so in
# practice nobody did, and it could only fail after a push.
#
# The bare acronym "PHI" was once in this pattern. It matched our own prose
# explaining the PHI policy — in the fixtures header, on the homepage, in
# component documentation — so the job was red on every commit and told us
# nothing. A check that always fails is a check nobody reads. Patterns here
# must match DATA, never discussion of data.

set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TARGETS="packages/fixtures registry apps/docs/src"
fail=0

# Real terminology systems, vendor hostnames, and SSN-shaped literals.
# Plain -E only: portable, and testable on a developer's machine.
patterns='hl7\.org/fhir/sid/us-ssn|hl7\.org/fhir/sid/us-mbi'
patterns="$patterns"'|epic\.com|cerner\.com|athenahealth|allscripts\.com'
patterns="$patterns"'|[0-9]{3}-[0-9]{2}-[0-9]{4}'

# shellcheck disable=SC2086  # TARGETS is a deliberate word-split list.
if grep -rInE "$patterns" $TARGETS; then
  echo "::error::Real identifier system, vendor hostname, or SSN-shaped literal found above."
  fail=1
fi

# Email addresses outside the reserved example domains. Two passes rather than
# a PCRE lookahead, so the same command runs locally.
#
# zowork.com is allowed: our own contact address on the marketing pages is not
# patient data. The point of this pass is a real person's address reaching a
# fixture or a component default.
# shellcheck disable=SC2086
if grep -rInE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' $TARGETS \
  | grep -vE '@(example\.(org|com)|zowork\.com)'; then
  echo "::error::Email address outside example.org / example.com / zowork.com found above."
  fail=1
fi

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "No non-synthetic identifiers found."
