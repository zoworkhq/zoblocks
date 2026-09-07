---
"@zoblocks/cli": minor
---

First release: Zoblocks installs its own components.

`npx @zoblocks/cli add pulse-loader` replaces the third-party CLI the
registry channel used to depend on. The public catalog now needs no
configuration, no namespace, and no account — a bare name resolves against
`zoblocks.design`, built into the binary.

Paid components keep their namespace and bearer token, declared in `zoblocks.json`
(which replaces `components.json`). Credentials are written as `${ZOBLOCKS_TOKEN}`
and expanded from the environment; a token written literally into that file is
refused rather than used, because the file is meant to be committed.

Zero runtime dependencies, per ADR 0009 — this binary runs with write access to
a customer's repository, so its transitive tree is the first thing a vendor
security review opens.

**Breaking for registry-channel consumers.** Registry documents now declare
`zoblocks:*` file kinds and a `$schema` under `zoblocks.design`, so the old CLI
cannot read them and this one cannot read the old ones. Deploy the docs site
before publishing this package. See
[ADR 0016](../content/decisions/0016-the-installer-is-ours.md).
