#!/usr/bin/env bash
#
# Lint the GitHub Actions workflows.
#
# Why this exists at all: a workflow is the only code in this repository that
# nothing typechecks. `deploy-hq` guarded five steps on `steps.gate.outputs.skip`
# while no step declared `id: gate` — GitHub does not warn on an unresolvable
# step reference, so every guarded step skipped, and a job whose steps all skip
# reports *success*. hq went undeployed for weeks with a green tick beside it.
# actionlint reports that as a static error. It also found `language:` passed to
# codeql-action, whose input is `languages:` — accepted silently and ignored.
#
# Why the binary is fetched rather than installed from npm: the `actionlint`
# package on npm is a third-party WASM repackaging by an unrelated publisher,
# a year stale, with a version that does not match upstream. This downloads the
# official release and checks it against a pinned SHA-256 before running it, so
# the same bytes run here and in CI.
#
# The binary is cached under .cache/ (gitignored). Delete that directory to
# force a re-download.

set -euo pipefail

VERSION="1.7.12"

# From actionlint_${VERSION}_checksums.txt on the GitHub release. Update the
# version and every digest together, or this refuses to run.
#
# A case statement rather than an associative array: macOS ships bash 3.2,
# where `declare -A` does not exist, and this has to run on a developer's
# machine as well as on the runner.
checksum_for() {
  case "$1" in
  darwin_arm64) echo "aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f" ;;
  darwin_amd64) echo "5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644" ;;
  linux_amd64) echo "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8" ;;
  linux_arm64) echo "325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6" ;;
  *) echo "" ;;
  esac
}

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cache="$root/.cache/actionlint/$VERSION"
bin="$cache/actionlint"

case "$(uname -s)" in
Darwin) os=darwin ;;
Linux) os=linux ;;
*)
  echo "actionlint: unsupported OS $(uname -s) — skipping." >&2
  exit 0
  ;;
esac

case "$(uname -m)" in
arm64 | aarch64) arch=arm64 ;;
x86_64 | amd64) arch=amd64 ;;
*)
  echo "actionlint: unsupported architecture $(uname -m) — skipping." >&2
  exit 0
  ;;
esac

platform="${os}_${arch}"
want="$(checksum_for "$platform")"
if [ -z "$want" ]; then
  echo "actionlint: no pinned checksum for $platform — skipping." >&2
  exit 0
fi

if [ ! -x "$bin" ]; then
  mkdir -p "$cache"
  tarball="$cache/actionlint.tar.gz"
  url="https://github.com/rhysd/actionlint/releases/download/v${VERSION}/actionlint_${VERSION}_${platform}.tar.gz"

  echo "actionlint: fetching ${VERSION} for ${platform}"
  curl -fsSL --retry 3 -o "$tarball" "$url"

  # Verified before extraction, not after: an archive that is not what we
  # pinned should never be unpacked, let alone executed.
  if command -v shasum >/dev/null 2>&1; then
    got="$(shasum -a 256 "$tarball" | cut -d' ' -f1)"
  else
    got="$(sha256sum "$tarball" | cut -d' ' -f1)"
  fi

  if [ "$got" != "$want" ]; then
    rm -f "$tarball"
    echo "actionlint: checksum mismatch for $platform" >&2
    echo "  expected $want" >&2
    echo "  got      $got" >&2
    exit 1
  fi

  tar -xzf "$tarball" -C "$cache" actionlint
  rm -f "$tarball"
  chmod +x "$bin"
fi

exec "$bin" "$@"
