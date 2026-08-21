"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, RotateCcw } from "lucide-react";
import { saveOverridesAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import {
  AxisGroup,
  Button,
  Callout,
  ColorField,
  Input,
  Panel,
  StatusChip,
  SubmitButton,
  Toolbar,
} from "@/components/ui";
import type { ThemeName } from "@/lib/token-editor";
import { cn } from "@/lib/utils";
import { ComponentPreview } from "./ComponentPreview";

/** One row, as the server prepared it. */
export interface ComponentToken {
  name: string;
  kind: string;
  /** What it falls through to when nothing overrides it. */
  semantic?: string;
  /** The value in force with no override — resolved for this theme. */
  base?: string;
  /** False for clinical status and identity flags. */
  editable: boolean;
}

/**
 * The component tier, made editable.
 *
 * This screen used to render the word "Override" in an accent colour. It was a
 * `<span>`. Nothing happened when you clicked it — which is the single clearest
 * example of the problem this whole rebuild exists to fix, so it is worth
 * naming here rather than quietly replacing.
 *
 * What makes it safe to open is not this file. The clinical refusal is
 * generated from the token source, enforced by the document schema, re-checked
 * by `validateTheme` on save, and the emitter cannot write a key the document
 * does not carry. This screen only has to be honest about which rows are which.
 */
export function ComponentEditor({
  themeId,
  component,
  tokens,
  savedOverrides,
  resolved,
  canWrite,
  reason,
}: {
  themeId: string;
  /** Which component is on screen, so the preview knows what to draw. */
  component: string;
  /** Per theme, because a component token resolves through the per-theme tier. */
  tokens: Record<ThemeName, ComponentToken[]>;
  savedOverrides: Record<ThemeName, Record<string, string>>;
  /** The semantic tier per theme, so the specimen sits on the customer's palette. */
  resolved: Record<ThemeName, Record<string, string>>;
  canWrite: boolean;
  reason?: string;
}) {
  const [theme, setTheme] = useState<ThemeName>("light");
  const [drafts, setDrafts] = useState(savedOverrides);

  const rows = tokens[theme];
  const current = drafts[theme];

  const set = (name: string, value: string) =>
    setDrafts((all) => ({ ...all, [theme]: { ...all[theme], [name]: value } }));

  const revert = (name: string) =>
    setDrafts((all) => {
      const next = { ...all[theme] };
      delete next[name];
      return { ...all, [theme]: next };
    });

  const count = Object.values(drafts).reduce((n, entries) => n + Object.keys(entries).length, 0);
  const locked = rows.filter((row) => !row.editable).length;

  return (
    <ActionForm
      action={saveOverridesAction}
      className="space-y-4"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="body-sm text-graphite">
            {count === 0
              ? "No component overrides — every token inherits."
              : `${count} component override${count === 1 ? "" : "s"} across three themes.`}
          </p>
          <SubmitButton reason={reason} pendingLabel="Checking…">
            Save overrides
          </SubmitButton>
        </div>
      }
    >
      <input type="hidden" name="themeId" value={themeId} />
      {/*
        `semantic` is deliberately absent from this payload.

        `saveOverrides` replaces whichever tiers the payload names, so omitting
        it would wipe the token editor's work — two screens, one document, and
        the one that saves last would win. The server merges what it is given
        over what is stored, and this screen is only ever given the component
        tier.
      */}
      <input type="hidden" name="overrides" value={JSON.stringify({ component: drafts })} />

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

      {!canWrite && (
        <Callout tone="info" title="Your role can view these but not change them">
          Editing a component token needs a designer or an admin.
        </Callout>
      )}

      {/*
        Rows and specimen side by side, and the specimen sticks.
        
        The switch alone has fifty-five tokens, so on any real screen the field
        you are editing and the component it changes were never both visible —
        which is a preview that exists and cannot be used.
      */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel padded={false}>
          <ul className="divide-y divide-rule">
            {rows.map((row) => (
              <Row
                key={row.name}
                row={row}
                value={current[row.name] ?? row.base ?? ""}
                overridden={row.name in current}
                editable={canWrite && row.editable}
                onChange={(next) => set(row.name, next)}
                onRevert={() => revert(row.name)}
              />
            ))}
          </ul>
        </Panel>

        <ComponentPreview
          component={component}
          theme={theme}
          rows={rows}
          overrides={current}
          resolved={resolved[theme]}
        />
      </div>

      {locked > 0 && (
        <p className="body-sm max-w-[68ch] text-graphite">
          {locked} of these resolve to clinical status or an identity flag. They carry a validated
          contrast floor and more than 60° of hue separation between <em>high</em> and <em>low</em>{" "}
          — you can see what that buys on the{" "}
          <Link href="./brand" className="link">
            brand screen
          </Link>{" "}
          under a colour-vision simulation. A theme cannot override them and neither can a framework
          bridge.
        </p>
      )}
    </ActionForm>
  );
}

function Row({
  row,
  value,
  overridden,
  editable,
  onChange,
  onRevert,
}: {
  row: ComponentToken;
  value: string;
  overridden: boolean;
  editable: boolean;
  onChange: (next: string) => void;
  onRevert: () => void;
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5",
        !row.editable && "bg-paper-sunk",
      )}
    >
      <div className="min-w-0 flex-1 basis-[14rem]">
        <code className="block truncate font-mono text-[0.75rem]" title={row.name}>
          {row.name}
        </code>
        <p className="truncate font-mono text-[0.625rem] text-graphite-soft">
          {row.semantic ? `inherits ${row.semantic}` : row.kind}
        </p>
      </div>

      <div className="w-[12rem] shrink-0">
        {!row.editable ? (
          <span className="inline-flex items-center gap-1.5">
            <StatusChip tone="locked" icon={<Lock aria-hidden="true" className="size-2.5" />}>
              clinical
            </StatusChip>
          </span>
        ) : row.kind === "color" ? (
          <ColorField
            label={row.name}
            value={value}
            onChange={editable ? onChange : undefined}
            disabled={!editable}
          />
        ) : (
          // A dimension, a duration, a shadow. Free text with the base value as
          // the placeholder, because the units differ per kind and a picker
          // that guessed would be wrong more often than helpful.
          <Input
            mono
            value={value}
            placeholder={row.base}
            disabled={!editable}
            onChange={(event) => onChange(event.target.value)}
            aria-label={row.name}
          />
        )}
      </div>

      <div className="flex w-[7rem] shrink-0 items-center gap-2">
        {overridden && (
          <>
            <StatusChip tone="accent">edited</StatusChip>
            <Button
              type="button"
              variant="ghost"
              onClick={onRevert}
              aria-label={`Revert ${row.name}`}
              size="icon"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
