"use client";

import { Lock, RotateCcw, Upload } from "lucide-react";
import { ICON_SLOTS, type IconOverride, type IconSlot } from "@oxygenui-design/theme";
import { removeIconAction, uploadIconsAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Callout, Field, Panel, SubmitButton } from "@/components/ui";

/**
 * The glyphs, and the ones that are not on offer.
 *
 * Every icon is drawn here the way the copilot draws it — a span whose shape is
 * a CSS mask — so this grid is not a picture of the feature, it is the feature.
 * A replaced glyph appears here because the same custom property that changes
 * the toolbar changes this cell.
 *
 * The locked five are shown rather than hidden. Hiding them would make the list
 * look arbitrary and generate the question anyway; showing them with the reason
 * attached is the treatment clinical rows already get in the token editor, for
 * the same argument — a refusal nobody can see reads as a bug.
 */

function Slot({
  spec,
  override,
  themeId,
  canWrite,
}: {
  spec: IconSlot;
  override?: IconOverride;
  themeId: string;
  canWrite: boolean;
}) {
  const locked = Boolean(spec.locked);

  return (
    <div
      className={
        locked
          ? "surface flex flex-col items-center gap-2 p-3 opacity-70"
          : "surface flex flex-col items-center gap-2 p-3"
      }
    >
      {/*
        Drawn at 24px, which is roughly the size it renders at in the dock. A
        glyph judged at 64px and shipped at 24 is how a set arrives too detailed
        to read.
      */}
      <span
        className="grid h-11 w-11 place-items-center rounded-lg border border-rule bg-paper text-ink"
        style={
          override
            ? ({
                ["--ox-icon-" + spec.slot]: `url("${override.src}")`,
                fontSize: "24px",
              } as React.CSSProperties)
            : { fontSize: "24px" }
        }
      >
        {locked ? (
          <Lock aria-hidden="true" strokeWidth={2} className="size-4 text-graphite-soft" />
        ) : (
          <span className="ox-icon" data-icon={spec.slot} aria-hidden="true" />
        )}
      </span>

      <p className="text-center text-[0.6875rem] leading-tight">{spec.label}</p>

      {override && canWrite && (
        <ActionForm quiet action={removeIconAction}>
          <input type="hidden" name="themeId" value={themeId} />
          <input type="hidden" name="slot" value={spec.slot} />
          <SubmitButton variant="ghost" size="sm" pendingLabel="Reverting…">
            <RotateCcw aria-hidden="true" strokeWidth={2} className="size-3" />
            Revert
          </SubmitButton>
        </ActionForm>
      )}
    </div>
  );
}

export function IconGrid({
  themeId,
  overrides,
  canWrite,
  reason,
}: {
  themeId: string;
  overrides: readonly IconOverride[];
  canWrite: boolean;
  reason?: string;
}) {
  const bySlot = new Map(overrides.map((o) => [o.slot, o]));
  const replaceable = ICON_SLOTS.filter((s) => !s.locked);
  const locked = ICON_SLOTS.filter((s) => s.locked);

  return (
    <>
      <Panel
        title="Glyphs"
        description="Drop a whole set at once — each file fills the slot its name matches, so send.svg becomes the send glyph. Nothing has to be renamed first."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
          {replaceable.map((spec) => (
            <Slot
              key={spec.slot}
              spec={spec}
              override={bySlot.get(spec.slot)}
              themeId={themeId}
              canWrite={canWrite}
            />
          ))}
        </div>

        <ActionForm
          action={uploadIconsAction}
          className="mt-5 border-t border-rule pt-5"
          footer={
            <SubmitButton reason={reason} pendingLabel="Uploading…" className="mt-3">
              <Upload aria-hidden="true" strokeWidth={2} className="size-3.5" />
              Upload
            </SubmitButton>
          }
        >
          <input type="hidden" name="themeId" value={themeId} />
          <Field
            label="SVG files"
            required
            hint="Named for the slot they replace. Up to 64 KB each; a file matching no slot is reported rather than ignored."
          >
            {(props) => (
              <input
                {...props}
                type="file"
                name="files"
                multiple
                accept=".svg,image/svg+xml"
                disabled={!canWrite}
                className="block w-full text-[0.8125rem] text-graphite file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-rule-strong file:bg-paper file:px-3 file:py-1.5 file:text-[0.8125rem] file:font-medium file:text-ink hover:file:bg-paper-sunk disabled:cursor-not-allowed disabled:file:cursor-not-allowed disabled:file:border-rule disabled:file:bg-paper-sunk disabled:file:text-graphite-soft"
              />
            )}
          </Field>
        </ActionForm>

        <Callout tone="info" title="One colour, by design" className="mt-5">
          A glyph is drawn as a mask: the shape is kept and the paint discarded, so it takes the
          colour of the text beside it and works on every ground without a second file. A two-colour
          glyph will render as its silhouette.
        </Callout>
      </Panel>

      <Panel
        title="Not on offer"
        description="These carry meaning rather than decorating it, so they are fixed for the same reason the clinical colours are."
        className="mt-6"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locked.map((spec) => (
            <div key={spec.slot} className="surface p-3">
              <p className="flex items-center gap-1.5 text-[0.8125rem] font-semibold">
                <Lock aria-hidden="true" strokeWidth={2} className="size-3.5 text-graphite-soft" />
                {spec.label}
              </p>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-graphite">{spec.locked}</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
