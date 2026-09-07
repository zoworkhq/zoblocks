#!/usr/bin/env bash
#
# Serve the built docs site and audit it with axe.
#
# Extracted from ci.yml so that CI and `pnpm verify --ci` run the same code.
# Inline in the workflow it was a CI-only gate, and the site publishes a WCAG
# 2.2 AA conformance claim — the one gate whose absence locally is least
# defensible.
#
# Assumes the site is already built; `verify.sh` runs `build` before this.

set -uo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PORT="${ZOBLOCKS_A11Y_PORT:-6001}"
BASE="http://localhost:${PORT}"

# The filter is checked before starting, because `pnpm --filter` on a name that
# matches nothing prints a notice and exits quietly. Backgrounded, that surfaces
# 60s later as "timed out waiting for localhost", which points at the server
# rather than at the renamed package that actually broke it.
#
# `pnpm --filter <unmatched> exec` still exits 0, so the exit code cannot be
# used. `ls --json` prints nothing at all when no package matches, which can.
if [ -z "$(pnpm --filter @zoblocks/docs ls --depth -1 --json 2>/dev/null)" ]; then
  echo "::error::No package matched @zoblocks/docs — check the name in apps/docs/package.json."
  exit 1
fi

server=""
cleanup() {
  # Kill the whole process group: `next start` spawns workers, and killing only
  # the parent leaves the port held, so the next run fails to bind and reports
  # something unrelated.
  if [ -n "$server" ]; then
    kill -- "-$server" 2>/dev/null || kill "$server" 2>/dev/null || true
    wait "$server" 2>/dev/null || true
  fi

  # And wait for the port to actually come free.
  #
  # `kill` returns as soon as the signal is delivered, not when the socket is
  # released. `pnpm verify --ci` runs the browser suite straight after this,
  # and Playwright starts its own server on the same port — so returning early
  # made the next gate fail to bind, roughly one run in two, reporting a
  # browser-suite failure that had nothing to do with the browser suite.
  for _ in $(seq 1 40); do
    if ! lsof -ti:"$PORT" >/dev/null 2>&1; then return; fi
    sleep 0.25
  done
  echo "verify-a11y: port $PORT is still held after 10s." >&2
}
trap cleanup EXIT INT TERM

set -m
pnpm --filter @zoblocks/docs start >/tmp/zoblocks-a11y-server.log 2>&1 &
server=$!
set +m

if ! npx --yes wait-on "$BASE" -t 60000; then
  echo "::error::The docs server did not come up on $BASE within 60s."
  tail -20 /tmp/zoblocks-a11y-server.log
  exit 1
fi

pnpm a11y "$BASE"
