"use client";

import { useMemo, useState } from "react";
import { Check, Lock, RotateCcw, Wand2, X } from "lucide-react";
import { contrastBetween } from "@zoblocks/tokens/validate";
import { nearestPassing } from "@zoblocks/theme";
import { saveOverridesAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import {
  AxisGroup,
  Button,
  Callout,
  ColorField,
  Panel,
  StatusChip,
  SubmitButton,
  Toolbar,
} from "@/components/ui";
import type { EditorModel, EditorPair, EditorToken, ThemeName } from "@/lib/token-editor";
import { cn } from "@/lib/utils";
import { TokenPreview } from "./TokenPreview";

/**
 * The screen the product is named after.
 *
 * Three panes, and the middle one is the product: a token, what it resolves to,
 * every pair the gate measures it in, and — when a pair fails — the nearest
 * shade of the customer's own colour that would pass.
 *
 * The last of those is the reason this screen exists rather than a list of
 * errors. Customers reliably accept a shade they did not choose; they do not
 * reliably accept a rejection, and a rejection with no route out is how an
 * accessibility gate becomes a thing a team works around instead of with.
 */
export function TokenEditor({
  themeId,
  models,
  ramp,
  canWrite,
  reason,
}: {
  themeId: string;
  /** One per theme. The semantic tier *is* the per-theme tier. */
  models: Record<ThemeName, EditorModel>;
  /**
   * The brand ramp, handed to the picker.
   *
   * Eleven steps this customer has already approved. Most semantic edits are
   * "the 700 one", and finding it in a gradient is how a palette drifts into
   * eleven near-identical blues that nobody chose.
   */
  ramp?: Record<string, string>;
  canWrite: boolean;
  /** Why this member may not edit, when they may not. */
  reason?: string;
}) {
  const [theme, setTheme] = useState<ThemeName>("light");
  const [group, setGroup] = useState<string>("accent");

  /*
   * Every theme's overrides, held together.
   *
   * A theme is validated as a *set*, so the editor holds all three and submits
   * them together. Holding only the visible theme would mean switching tabs
   * silently discarded the edits behind them — which is the kind of data loss
   * nobody reports as a bug because they assume they forgot to save.
   */
  const [drafts, setDrafts] = useState<Record<ThemeName, Record<string, string>>>(() => ({
    light: { ...models.light.groups.reduce(collectOverrides, {}) },
    dark: { ...models.dark.groups.reduce(collectOverrides, {}) },
    "high-contrast": { ...models["high-contrast"].groups.reduce(collectOverrides, {}) },
  }));

  const model = models[theme];
  const current = drafts[theme];
  const active = model.groups.find((g) => g.name === group) ?? model.groups[0];

  /** The value in force for a token, draft first. */
  const valueOf = (token: EditorToken) => current[token.path] ?? token.base;

  const set = (path: string, value: string) =>
    setDrafts((all) => ({ ...all, [theme]: { ...all[theme], [path]: value } }));

  const revert = (path: string) =>
    setDrafts((all) => {
      const next = { ...all[theme] };
      delete next[path];
      return { ...all, [theme]: next };
    });

  const overrideCount = useMemo(
    () => Object.values(drafts).reduce((n, entries) => n + Object.keys(entries).length, 0),
    [drafts],
  );

  return (
    <ActionForm
      action={saveOverridesAction}
      className="space-y-5"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="body-sm text-graphite">
            {overrideCount === 0
              ? "No overrides — this theme is your brand ramp and ZoBlocks's defaults."
              : `${overrideCount} override${overrideCount === 1 ? "" : "s"} across three themes.`}
          </p>
          <SubmitButton reason={reason} pendingLabel="Checking…">
            Save overrides
          </SubmitButton>
        </div>
      }
    >
      <input type="hidden" name="themeId" value={themeId} />
      {/*
        Submitted as one JSON field rather than as a form control per token.
        Eighty-odd named inputs would put the shape of the payload in the
        markup, where a renamed token becomes a silently dropped override.
      */}
      <input
        type="hidden"
        name="overrides"
        value={JSON.stringify({ semantic: drafts, component: {} })}
      />

      {/*
        In the bar, not floating above the grid.
        
        On its own it sat flush against the tier list below and shared that
        column's left edge, so it read as the first item *of* that list rather
        than as a control for the whole screen. The bar is what says "these
        change what you are looking at", and it is the component that already
        exists for saying it.
      */}
      <Toolbar>
        <AxisGroup
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "light" as const, label: "Light" },
            { value: "dark" as const, label: "Dark" },
            { value: "high-contrast" as const, label: "High contrast" },
          ]}
        />
      </Toolbar>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,17rem)] xl:items-start">
        <TierNavigator model={model} group={active?.name} onSelect={setGroup} drafts={current} />

        <div className="min-w-0 space-y-3">
          {active && (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h2 className="font-display text-[1.0625rem] font-semibold tracking-[-0.015em]">
                  Semantic · {active.name}
                </h2>
                <p className="text-[0.8125rem] text-graphite">
                  {active.tokens.length} token{active.tokens.length === 1 ? "" : "s"}
                  {active.locked > 0 && ` · ${active.locked} locked`}
                </p>
              </div>

              <Panel padded={false}>
                <ul className="divide-y divide-rule">
                  {active.tokens.map((token) => (
                    <TokenRow
                      key={token.path}
                      token={token}
                      value={valueOf(token)}
                      overridden={token.path in current}
                      pairs={model.pairs[token.path] ?? []}
                      ramp={ramp}
                      editable={canWrite}
                      onChange={(next) => set(token.path, next)}
                      onRevert={() => revert(token.path)}
                    />
                  ))}
                </ul>
              </Panel>
            </>
          )}
        </div>

        <TokenPreview theme={theme} model={model} overrides={current} />
      </div>
    </ActionForm>
  );
}

function collectOverrides(
  acc: Record<string, string>,
  group: { tokens: EditorToken[] },
): Record<string, string> {
  for (const token of group.tokens) if (token.override) acc[token.path] = token.override;
  return acc;
}

function TierNavigator({
  model,
  group,
  onSelect,
  drafts,
}: {
  model: EditorModel;
  group?: string;
  onSelect: (name: string) => void;
  drafts: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      {/*
        The three tiers, with only one of them editable here.
        Shown rather than hidden: "why can I not edit a primitive" is a question
        a customer asks once, and the answer — the ramp is the brand screen, the
        component tier is its own screen — belongs where they ask it.
      */}
      <dl className="surface divide-y divide-rule text-[0.75rem]">
        {[
          { label: "Primitive", n: model.counts.primitive, where: "Brand screen" },
          { label: "Semantic", n: model.counts.semantic, where: "Here" },
          { label: "Component", n: model.counts.component, where: "Components screen" },
        ].map((tier) => (
          <div key={tier.label} className="flex items-baseline justify-between gap-2 px-3 py-2">
            <dt className={cn(tier.where === "Here" && "font-medium text-brand-deep")}>
              {tier.label}
            </dt>
            <dd className="tabular font-mono text-[0.6875rem] text-graphite-soft">{tier.n}</dd>
          </div>
        ))}
      </dl>

      <nav aria-label="Token groups">
        <p className="eyebrow mb-1.5 px-2.5 text-[0.5625rem] text-graphite-soft">Groups</p>
        <ul className="space-y-0.5">
          {model.groups.map((entry) => {
            const edited = entry.tokens.filter((t) => t.path in drafts).length;
            const active = entry.name === group;
            return (
              <li key={entry.name}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.name)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5",
                    "text-left text-[0.8125rem] transition-colors duration-200",
                    active
                      ? "bg-accent-wash font-medium text-brand-deep"
                      : "text-graphite hover:bg-paper-sunk hover:text-ink",
                  )}
                >
                  <span className="truncate">
                    {entry.name}
                    {entry.locked > 0 && (
                      <Lock
                        aria-label=" (contains locked tokens)"
                        strokeWidth={2}
                        className="ml-1 inline size-3 align-[-0.1em] text-graphite-soft"
                      />
                    )}
                  </span>
                  <span className="tabular text-[0.6875rem] text-graphite-soft">
                    {edited > 0 ? `${edited}/${entry.tokens.length}` : entry.tokens.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function TokenRow({
  token,
  value,
  overridden,
  pairs,
  ramp,
  editable,
  onChange,
  onRevert,
}: {
  token: EditorToken;
  value: string;
  overridden: boolean;
  pairs: readonly EditorPair[];
  /** The brand ramp, offered inside the picker as approved starting points. */
  ramp?: Record<string, string>;
  editable: boolean;
  onChange: (next: string) => void;
  onRevert: () => void;
}) {
  // Measured in the browser as the customer types. `contrastBetween` is the
  // same function the build's gate calls, so the number here and the verdict on
  // save cannot disagree.
  const readings = pairs
    .filter((pair) => pair.isForeground)
    .map((pair) => ({ pair, ratio: contrastBetween(value, pair.against) }))
    .filter((r): r is { pair: EditorPair; ratio: number } => r.ratio !== undefined);

  const worst = readings.reduce<{ pair: EditorPair; ratio: number } | undefined>(
    (lowest, r) =>
      !lowest || r.ratio - r.pair.floor < lowest.ratio - lowest.pair.floor ? r : lowest,
    undefined,
  );
  const fails = worst && worst.ratio < worst.pair.floor;
  const suggestion = fails
    ? nearestPassing(value, worst.pair.against, worst.pair.floor)
    : undefined;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-[13rem]">
          <code className="block truncate font-mono text-[0.75rem]" title={token.cssVar}>
            {token.path}
          </code>
          <p className="mt-0.5 font-mono text-[0.625rem] text-graphite-soft">{token.cssVar}</p>
        </div>

        <div className="w-[12rem] shrink-0">
          {token.isColour ? (
            <ColorField
              label={token.path}
              value={value}
              onChange={editable && !token.locked ? onChange : undefined}
              disabled={!editable}
              /*
                The picker is given what this row already knows: the brand's own
                ramp to pick from, and the pairing this value has to clear. A
                generic picker cannot offer either, which is the whole reason
                the app stopped using the native one.
              */
              ramp={ramp}
              against={
                worst
                  ? {
                      value: worst.pair.against,
                      label: worst.pair.againstPath,
                      floor: worst.pair.floor,
                    }
                  : undefined
              }
              lockedReason={
                token.locked
                  ? "Clinical. Carries a validated contrast floor and 60° of hue separation, so the direction of an abnormal result survives colour-vision deficiency."
                  : undefined
              }
            />
          ) : (
            <p className="rounded-lg border border-rule bg-paper-sunk px-2.5 py-2 font-mono text-[0.75rem] text-graphite">
              {value}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {overridden && (
            <>
              <StatusChip tone="accent">edited</StatusChip>
              <Button
                type="button"
                variant="ghost"
                onClick={onRevert}
                aria-label={`Revert ${token.path}`}
                size="icon"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {readings.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {readings.map(({ pair, ratio }) => {
            const passes = ratio >= pair.floor;
            return (
              <li key={pair.againstPath} className="flex items-center gap-1.5 text-[0.6875rem]">
                <StatusChip
                  tone={passes ? "pass" : "fail"}
                  icon={
                    passes ? (
                      <Check aria-hidden="true" strokeWidth={2.5} className="size-3" />
                    ) : (
                      <X aria-hidden="true" strokeWidth={2.5} className="size-3" />
                    )
                  }
                >
                  <span className="tabular">{ratio.toFixed(2)}:1</span>
                </StatusChip>
                <span className="tabular text-graphite">
                  on {pair.againstPath} · needs {pair.floor}:1 · {pair.criterion}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {fails && worst && (
        <Callout
          tone="fail"
          title={`${worst.ratio.toFixed(2)}:1 against ${worst.pair.againstPath} — below the ${worst.pair.floor}:1 floor for ${worst.pair.criterion}`}
          className="mt-2"
          action={
            suggestion && editable ? (
              <Button type="button" variant="secondary" onClick={() => onChange(suggestion)}>
                <Wand2 aria-hidden="true" className="size-3.5" />
                Apply nearest passing · {suggestion.toUpperCase()}
              </Button>
            ) : undefined
          }
        >
          {suggestion
            ? "Same hue and saturation — only lightness moves, and only as far as it has to, so the result is still recognisably your colour."
            : "No shade of this hue clears the floor against that background. Try a different background token, or a different hue."}
        </Callout>
      )}
    </li>
  );
}
