#!/usr/bin/env bash
#
# The retired name must stay retired.
#
# A repository this size regrows a name within a week of hand-written commits —
# a copied import, a pasted URL, a comment written from memory. The September
# 2026 sweep from Oxygen UI to ZoBlocks is only true today unless something
# keeps it true, and this is that something.
#
# Five exemptions, each narrow and each deliberate:
#
#   - `content/archive/` is a dated record of what was decided before the
#     rename. Rewriting it would make the record say something that was never
#     true. See content/archive/README.md.
#   - The `oxygen-to-zoblocks` codemod and its documentation. A migration exists
#     to name the thing it migrates from; a gate that forbade it would forbid
#     shipping the migration at all. Scoped to those paths, so the rest of the
#     codemod package is still held to the rule.
#   - Release notes — `.changeset/` and `CHANGELOG.md`. A changelog that cannot
#     name what changed is not a changelog. This is also why the gate is called
#     `retired-names.sh` rather than being named after the word it forbids: a
#     check should not need an exemption for its own filename.
#   - This script itself. A grep-based gate has to contain the word it searches
#     for. Renaming the file kept the retired name out of the filename; nothing
#     can keep it out of the pattern. It stayed invisible until the file was
#     first committed, because `git grep` does not read untracked files.
#   - A line carrying the marker `rename-sweep-exempt` opts itself out. One
#     legitimate use today: the CLI's `LEGACY_CONFIG_FILE`, which must name the
#     retired config file in order to read it. The marker has to be on the same
#     line, so an exemption is visible in every diff that touches it.
#
# Run: pnpm check:names
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

# `git grep -I` skips binary files. That is a real hole: a file with a stray NUL
# byte reads as binary and slips past every text tool, which is exactly how one
# file escaped the original sweep. So the binary set is checked separately and
# reported as unscannable rather than silently passing.
BINARY=$(comm -13 \
  <(git grep -I -l '' -- . 2>/dev/null | sort) \
  <(git ls-files | sort) \
  | grep -vE '\.(png|jpg|jpeg|gif|ico|svg|woff2?|ttf|otf|pdf|zip|mp4|webm|webp|avif)$' || true)

HITS=$(git grep -I -n -i -E 'oxygen' -- . \
    ':!content/archive' \
    ':!packages/codemod/src/oxygen-to-zoblocks.ts' \
    ':!packages/codemod/test/oxygen-to-zoblocks.test.ts' \
    ':!packages/codemod/README.md' \
    ':!.changeset' \
    ':!CHANGELOG.md' \
    ':!scripts/retired-names.sh' \
  2>/dev/null \
  | grep -v 'rename-sweep-exempt' \
  | grep -viE 'spo2|spo₂' || true)

# Filenames as well as contents. A file called `oxygen.json` passes a content
# scan and still puts the retired name in front of every consumer — one was
# left behind by the generator and only turned up at commit time.
NAMED=$({ git ls-files; git ls-files --others --exclude-standard; } \
  | grep -i 'oxygen' \
  | grep -v '^content/archive/' \
  | grep -v 'oxygen-to-zoblocks' || true)

STATUS=0

if [ -n "$NAMED" ]; then
  STATUS=1
  echo "These paths carry the retired name in the filename:"
  echo
  printf '%s\n' "$NAMED" | sed 's/^/  /'
  echo
  echo "Fix: rename the file. The only exemption is the migration codemod,"
  echo "which is named for what it migrates from."
  echo
fi

if [ -n "$HITS" ]; then
  STATUS=1
  echo "The retired name is back in $(printf '%s\n' "$HITS" | cut -d: -f1 | sort -u | wc -l | tr -d ' ') file(s):"
  echo
  printf '%s\n' "$HITS" | sed 's/^/  /'
  echo
  echo "Fix: use the current name. If this line genuinely must keep the old one,"
  echo "put 'rename-sweep-exempt' in a comment on the same line and say why."
fi

if [ -n "$BINARY" ]; then
  STATUS=1
  echo "These tracked files are not plain text, so this gate cannot read them:"
  echo
  printf '%s\n' "$BINARY" | sed 's/^/  /'
  echo
  echo "A source file that reads as binary usually holds a stray NUL byte."
  echo "Write it as an escape (\\u0000) so the file stays scannable."
fi

if [ "$STATUS" -eq 0 ]; then
  echo "✓ no retired names outside content/archive"
fi

exit "$STATUS"
