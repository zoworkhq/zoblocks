import { currentMember } from "@/lib/auth";
import { scoped } from "@/db/scope";
import { can } from "@/lib/roles";
import { TOKEN_LIFETIME_DAYS } from "@/lib/market/tokens";
import { revokeTokenAction } from "@/lib/actions";
import { scopeOf } from "@/lib/market/tokens";
import { ActionForm } from "@/components/action-form";
import { MintForm } from "./MintForm";
import { Callout, EmptyState, PageHeader, Panel, StatusChip, SubmitButton } from "@/components/ui";
import { notFound } from "next/navigation";

export const metadata = { title: "Access tokens" };

/**
 * Credentials for installing paid components.
 *
 * The screen exists at all because the alternative is a developer asking an
 * admin every time they set up a machine, and the thing they would ask for is
 * a permanent shared secret in a Slack message.
 *
 * What makes handing this to developers reasonable is on the page rather than
 * in a policy: the value is shown once, only its digest is stored, every token
 * is labelled so it can be revoked without guessing what breaks, they expire,
 * and last use is visible — which is how a leaked one is noticed at all.
 */
export default async function TokensPage() {
  const member = (await currentMember())!;
  // Not a disabled screen: a member without the capability has no reason to
  // know this route exists, and the rail does not offer it to them either.
  if (!can(member.role, "market.token")) notFound();

  const tokens = await scoped(member.orgId).registryTokens.find().sort({ createdAt: -1 }).toArray();

  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Access tokens"
        lede="A key for the shadcn CLI or for the Figma plugin — one scope each, chosen when it is minted. Tokens belong to the organisation and are visible to every admin and developer in it."
      />

      <Panel className="mt-6" title="Mint a token">
        <MintForm />

        <Callout tone="info" className="mt-4" title="It is shown once.">
          The database stores only a SHA-256 of the value, so there is no screen that can show it
          again — the same reason a session cookie cannot be re-read. Tokens expire after{" "}
          {TOKEN_LIFETIME_DAYS} days.
        </Callout>
      </Panel>

      {tokens.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No tokens yet"
          body="Mint one per machine rather than sharing a single value — that is what makes revoking one of them harmless."
        />
      ) : (
        <Panel className="mt-4" title="Live tokens" padded={false}>
          <ul className="divide-y divide-rule">
            {tokens.map((token) => (
              <li key={token._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{token.label}</span>
                    {/*
                      The scope, beside the label.
                      A revocation screen that does not say what each key
                      reaches asks somebody to decide from a name alone, which
                      is how the one key nobody recognised turns out to be CI.
                    */}
                    <StatusChip tone="neutral">
                      {scopeOf(token) === "figma" ? "Figma" : "Registry"}
                    </StatusChip>
                    {token.revokedAt ? (
                      <StatusChip tone="fail">Revoked</StatusChip>
                    ) : token.expiresAt.getTime() < Date.now() ? (
                      <StatusChip tone="neutral">Expired</StatusChip>
                    ) : (
                      <StatusChip tone="pass">Live</StatusChip>
                    )}
                  </div>
                  <p className="body-xs mt-0.5 text-graphite-soft">
                    Created {token.createdAt.toISOString().slice(0, 10)} · expires{" "}
                    {token.expiresAt.toISOString().slice(0, 10)} ·{" "}
                    {token.lastUsedAt
                      ? `last used ${token.lastUsedAt.toISOString().slice(0, 10)}`
                      : "never used"}
                  </p>
                </div>

                {!token.revokedAt && (
                  <ActionForm action={revokeTokenAction} quiet>
                    <input type="hidden" name="hash" value={token._id} />
                    <SubmitButton size="sm" variant="secondary" pendingLabel="Revoking…">
                      Revoke
                    </SubmitButton>
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {/*
        Reference material, after the list and closed by default.
        
        It used to sit inside the mint panel: a tall dark slab pushing the
        actual list of tokens — the reason an administrator opens this page —
        below the fold and into a panel that read as unrelated. You read this
        once, on your first token, and never again.
      */}
      <details className="mt-4 rounded-xl border border-rule bg-paper-sunk px-4 py-3">
        <summary className="cursor-pointer text-[0.8125rem] font-medium text-ink">
          Wiring a registry token into the shadcn CLI
        </summary>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-panel p-3 font-mono text-[0.6875rem] text-panel-fg">
          {`// components.json — the token stays in the environment, never in the repo
"registries": {
  "@oxygen-pro": {
    "url": "${"https://console.oxygenui.design/r/pro/{name}.json"}",
    "headers": { "Authorization": "Bearer \${OXYGEN_TOKEN}" }
  }
}

# .env.local
OXYGEN_TOKEN=oxy_live_…

npx shadcn@latest add @oxygen-pro/vitals-flowsheet`}
        </pre>
      </details>
    </>
  );
}
