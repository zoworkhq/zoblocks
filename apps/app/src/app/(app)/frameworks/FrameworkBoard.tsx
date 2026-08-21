"use client";

import { useState } from "react";
import { Check, Lock, Minus } from "lucide-react";
import { setFrameworksAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Checkbox, Panel, StatusChip, SubmitButton } from "@/components/ui";
import type { FrameworkFacts } from "@/lib/frameworks";
import { cn } from "@/lib/utils";

/**
 * Choosing which host frameworks this organisation runs on.
 *
 * Each card states the same three facts, so the two are comparable rather than
 * merely described: the major it is written against, how much of the library
 * it reaches, and what it cannot express. The third is the honest one and the
 * reason this screen is worth building — a customer who discovers after
 * integration that their `colorError` never reached a clinical chip will file
 * it as a bug, and the answer is easier to accept before the work than after.
 */
export function FrameworkBoard({
  frameworks,
  enabled,
  surfaceTotal,
  reason,
}: {
  frameworks: readonly FrameworkFacts[];
  enabled: readonly string[];
  surfaceTotal: number;
  /** Present when this member may not change the setting. */
  reason?: string;
}) {
  /*
   * Local state, so the cards respond immediately and the count in the footer
   * is honest before saving. The server is still the authority — the action
   * re-reads the organisation and rejects anything it does not recognise.
   */
  const [selected, setSelected] = useState<readonly string[]>(enabled);
  const locked = Boolean(reason);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  return (
    <ActionForm
      action={setFrameworksAction}
      className="space-y-5"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          <p className="body-sm text-graphite">
            {selected.length === 0
              ? "No framework selected — Oxygen components use their own tokens."
              : `${selected.length} of ${frameworks.length} enabled.`}
          </p>
          {/*
            Not dimmed when there is nothing to save.

            The first version faded it to 45% opacity, which dropped the label
            below 4.5:1 against its own background — the axe sweep caught it.
            Opacity is never a safe way to say "inactive": it multiplies both
            sides of a contrast pair by a number nobody checked.

            So the button stays fully legible and the sentence beside it carries
            the state. Saving an unchanged selection returns "No change.",
            which is a truthful answer rather than a wasted click.
          */}
          <SubmitButton id="save-frameworks" reason={reason} pendingLabel="Saving…">
            Save selection
          </SubmitButton>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {frameworks.map((framework) => (
          <FrameworkCard
            key={framework.id}
            framework={framework}
            checked={selected.includes(framework.id)}
            locked={locked}
            surfaceTotal={surfaceTotal}
            onToggle={() => toggle(framework.id)}
          />
        ))}
      </div>
    </ActionForm>
  );
}

function FrameworkCard({
  framework,
  checked,
  locked,
  surfaceTotal,
  onToggle,
}: {
  framework: FrameworkFacts;
  checked: boolean;
  locked: boolean;
  surfaceTotal: number;
  onToggle: () => void;
}) {
  const clinical = framework.unmapped.filter((token) => token.kind === "clinical");
  const gaps = framework.unmapped.filter((token) => token.kind === "no-counterpart");
  const reach = Math.round((framework.componentTokensReached / surfaceTotal) * 100);

  return (
    <Panel
      padded={false}
      className={cn(
        "transition-[border-color,box-shadow] duration-300",
        checked && "border-oxygen/40 shadow-[0_0_0_1px_var(--color-oxygen)]",
      )}
    >
      {/*
        The whole head is the control. A checkbox alone is a 16px target beside
        a 300px card that looks clickable and is not — and `<label>` gives the
        larger target without inventing a click handler on a div.
      */}
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 border-b border-rule px-5 py-4",
          locked && "cursor-not-allowed",
        )}
      >
        <Checkbox
          name="framework"
          value={framework.id}
          checked={checked}
          disabled={locked}
          onChange={onToggle}
          className="mt-0.5"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[0.9375rem] font-semibold tracking-[-0.008em]">
            {framework.name}
          </span>
          <span className="tabular mt-0.5 block font-mono text-[0.6875rem] text-graphite-soft">
            @oxygenui-design/bridge-{framework.id} · peer {framework.supports}
          </span>
        </span>
        <StatusChip tone={checked ? "pass" : "neutral"} icon={checked ? <Check size={10} /> : null}>
          {checked ? "enabled" : "off"}
        </StatusChip>
      </label>

      <dl className="grid grid-cols-3 divide-x divide-rule border-b border-rule">
        <Stat value={framework.writes.length} label="tokens written" />
        <Stat value={framework.componentTokensReached} label={`of ${surfaceTotal} reached`} />
        <Stat value={`${reach}%`} label={`${framework.componentsReached} components`} />
      </dl>

      <div className="space-y-3 px-5 py-4">
        <p className="body-sm text-graphite">
          Writes {framework.writes.length} semantic and component tokens from the host&rsquo;s
          resolved theme. Those reach {framework.componentTokensReached} of the {surfaceTotal}{" "}
          component tokens through the fallback chain, across {framework.componentsReached}{" "}
          components.
        </p>

        <Gap
          icon={<Lock aria-hidden="true" className="size-3" />}
          tone="locked"
          title={`${clinical.length} clinical tokens, never mapped`}
          body="Status and identity colours carry a validated contrast floor and a 60° hue separation, so the direction of an abnormal result survives colour-vision deficiency. A host's semantic colour has passed neither gate."
          tokens={clinical.map((token) => token.token)}
        />

        {gaps.length > 0 && (
          <Gap
            icon={<Minus aria-hidden="true" className="size-3" />}
            tone="neutral"
            title={`${gaps.length} with no counterpart in ${framework.name}`}
            body="Declared rather than approximated. Each falls through to Oxygen's own value, which is a better answer than a guess — and a future major of the host may close some of these."
            tokens={gaps.map((token) => token.token)}
          />
        )}
      </div>
    </Panel>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    // `dt` before `dd` in the DOM because that is the order a definition list
    // is defined in and the order a screen reader announces; `flex-col-reverse`
    // puts the number on top visually, where it belongs.
    <div className="flex flex-col-reverse px-4 py-3">
      <dt className="mt-1 text-[0.6875rem] leading-tight text-graphite-soft">{label}</dt>
      <dd className="tabular font-display text-[1.25rem] font-semibold leading-none">{value}</dd>
    </div>
  );
}

/**
 * A gap, with the tokens behind it available rather than asserted.
 *
 * `<details>` because the count is what most readers need and the list is what
 * the one integrating needs — and a native disclosure is keyboard-operable and
 * findable by in-page search when closed in every current browser.
 */
function Gap({
  icon,
  tone,
  title,
  body,
  tokens,
}: {
  icon: React.ReactNode;
  tone: "locked" | "neutral";
  title: string;
  body: string;
  tokens: readonly string[];
}) {
  return (
    <details className="rounded-lg border border-rule bg-paper-sunk px-3.5 py-2.5">
      <summary className="flex cursor-pointer items-center gap-2 text-[0.75rem] font-medium">
        <StatusChip tone={tone} icon={icon}>
          {tone === "locked" ? "locked" : "gap"}
        </StatusChip>
        {title}
      </summary>
      <p className="mt-2 text-[0.75rem] leading-relaxed text-graphite">{body}</p>
      <ul className="mt-2 flex flex-wrap gap-1">
        {tokens.map((token) => (
          <li
            key={token}
            className="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.625rem] text-graphite"
          >
            {token}
          </li>
        ))}
      </ul>
    </details>
  );
}
