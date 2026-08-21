"use client";

import { Trash2, Upload } from "lucide-react";
import {
  BRAND_ASSETS,
  BRAND_ASSET_GROUPS,
  type BrandAssetFile,
  type BrandAssetSpec,
} from "@oxygenui-design/theme";
import { removeBrandAssetAction, uploadBrandAssetAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Callout, Field, Input, Panel, Select, SubmitButton } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Every piece of brand artwork, grouped by who renders it.
 *
 * The grouping is the information. A wordmark is drawn by the stylesheet, a
 * favicon by the browser chrome, a link-preview card by somebody else's mail
 * client — and the reason a customer's favicon is wrong is almost always that
 * nobody realised those were three different jobs with three different rules.
 *
 * Nothing here is derived. The app does not recolour a mark, invert it, or
 * cut a favicon out of the wordmark: a reversed mark is a decision its owner
 * has already made, and generating one produces something their brand
 * guidelines forbid.
 */

/**
 * The two grounds a preview can sit on, as fixed values.
 *
 * Deliberately not theme tokens. The swatch is a simulation of the customer's
 * page, not a surface of this app — and when it followed the app's
 * theme, "Mark, on light" previewed on black for anybody working in dark mode.
 * A reversed mark then looked correct on the ground that would hide it, which
 * is precisely the failure the per-ground preview exists to catch.
 *
 * The muted text is paired to its ground and measured: 5.2:1 on the white,
 * 7.4:1 on the near-black, both above the 4.5:1 floor for text this size.
 */
const GROUND = {
  light: { surface: "#ffffff", border: "#e4e7ea", muted: "#5c6773" },
  dark: { surface: "#0e1116", border: "#242a32", muted: "#98a3af" },
} as const;

function Slot({
  spec,
  asset,
  themeId,
  canWrite,
}: {
  spec: BrandAssetSpec;
  asset?: BrandAssetFile;
  themeId: string;
  canWrite: boolean;
}) {
  // Neutral artwork — a favicon, a print mark — is judged on paper, which is
  // what a tab strip, a letterhead and an email body all approximate.
  const ground = GROUND[spec.ground === "dark" ? "dark" : "light"];

  /*
   * An illustration gets both grounds, side by side.
   *
   * It is one file that has to survive light and dark, because nobody ships
   * two of them. A drawing with a baked white background looks perfect on the
   * light swatch and is a white rectangle in the dark theme — and previewing
   * it on one ground is exactly how that reaches a customer.
   */
  const bothGrounds = spec.ground === "both";

  /*
   * Subgrid, so the four bands line up across the row.
   *
   * The notes are genuinely different lengths — that is content, not a bug —
   * and a card that lays itself out puts its preview at whatever height its own
   * text ends. Three cards side by side then show three preview boxes at three
   * heights, which reads as carelessness. Subgrid hands the row's tracks to
   * every card, so each band starts on the same line without clamping anybody's
   * prose to a height guessed here.
   */
  return (
    <div className="surface grid grid-rows-subgrid gap-2 p-3 [grid-row:span_4]">
      <div>
        <p className="text-[0.8125rem] font-semibold">{spec.label}</p>
        <p className="text-[0.6875rem] leading-relaxed text-graphite-soft">{spec.note}</p>
      </div>

      {/*
        The preview sits on the ground the asset is *for*. Showing a reversed
        mark on white proves nothing about whether it works, and is how a
        broken dark logo ships looking fine.
      */}
      {bothGrounds ? (
        <div className="grid grid-cols-2 gap-1.5">
          {(["light", "dark"] as const).map((which) => (
            <div
              key={which}
              className="grid h-20 place-items-center rounded-lg border p-3"
              style={{ background: GROUND[which].surface, borderColor: GROUND[which].border }}
            >
              {asset ? (
                <img
                  src={asset.src}
                  alt={which === "light" ? asset.alt : ""}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-[0.6875rem]" style={{ color: GROUND[which].muted }}>
                  {which === "light" ? "On light" : "On dark"}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid h-20 place-items-center rounded-lg border p-3"
          style={{ background: ground.surface, borderColor: ground.border }}
        >
          {asset ? (
            /*
            A plain `<img>`, not `next/image`. The asset is customer artwork of
            unknown intrinsic size served from our own origin — `next/image`
            would want a width and a height we do not have and cannot infer
            without decoding the file.
          */
            <img src={asset.src} alt={asset.alt} className="max-h-full max-w-full object-contain" />
          ) : (
            /*
              The muted colour is taken from the ground, not from the page. A
              page-themed grey on a fixed ground is how a caption ends up at
              1.4:1 — which the axe sweep caught the first time it ran here.
            */
            <span className="text-[0.6875rem]" style={{ color: ground.muted }}>
              Nothing uploaded
            </span>
          )}
        </div>
      )}

      {/*
        What the slot wants and where it ends up, stated on the slot. A person
        deciding which file to drag here should not have to read documentation
        to learn that the home-screen icon is 180×180 and takes no SVG.
      */}
      <dl className="space-y-0.5 text-[0.6875rem] leading-relaxed text-graphite-soft">
        <div className="flex gap-1.5">
          <dt className="shrink-0 font-medium">Format</dt>
          <dd className="truncate">{spec.formats.map((f) => f.toUpperCase()).join(", ")}</dd>
        </div>
        {spec.shape && (
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-medium">Size</dt>
            <dd>
              {spec.shape.width}×{spec.shape.height}
              {spec.shape.exact ? " exactly" : " or larger"}
            </dd>
          </div>
        )}
        <div className="flex gap-1.5">
          <dt className="shrink-0 font-medium">Used as</dt>
          <dd className="min-w-0 break-words">{spec.delivery}</dd>
        </div>
      </dl>

      {/*
        The fourth band exists on every card, filled or not. Rendering it only
        where there is artwork would let one card in a row claim three tracks
        and the rest four, which is the same misalignment by another route.
      */}
      <div className="flex items-end">
        {asset && canWrite && (
          <ActionForm quiet action={removeBrandAssetAction}>
            <input type="hidden" name="themeId" value={themeId} />
            <input type="hidden" name="role" value={spec.role} />
            <SubmitButton variant="ghost" size="sm" pendingLabel="Removing…">
              <Trash2 aria-hidden="true" strokeWidth={2} className="size-3.5" />
              Remove
            </SubmitButton>
          </ActionForm>
        )}
      </div>
    </div>
  );
}

export function BrandAssets({
  themeId,
  assets,
  canWrite,
  reason,
}: {
  themeId: string;
  assets: readonly BrandAssetFile[];
  canWrite: boolean;
  reason?: string;
}) {
  const byRole = new Map(assets.map((a) => [a.role, a]));

  return (
    <Panel
      title="Brand assets"
      description="Artwork this theme ships with. Grouped by what renders it, because that is what decides the rules each one has to follow."
    >
      <div className="space-y-6">
        {BRAND_ASSET_GROUPS.map((group) => (
          <section key={group.id}>
            <h3 className="text-[0.8125rem] font-semibold">{group.title}</h3>
            <p className="body-sm mt-0.5 max-w-[64ch] text-graphite">{group.note}</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BRAND_ASSETS.filter((spec) => spec.group === group.id).map((spec) => (
                <Slot
                  key={spec.role}
                  spec={spec}
                  asset={byRole.get(spec.role)}
                  themeId={themeId}
                  canWrite={canWrite}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <ActionForm
        action={uploadBrandAssetAction}
        className="mt-6 grid gap-3 border-t border-rule pt-5 sm:grid-cols-[14rem_1fr_1fr]"
        footer={
          <SubmitButton reason={reason} pendingLabel="Uploading…" className="mt-4">
            <Upload aria-hidden="true" strokeWidth={2} className="size-3.5" />
            Upload
          </SubmitButton>
        }
      >
        <input type="hidden" name="themeId" value={themeId} />

        <Field label="Asset" required>
          {(props) => (
            <Select {...props} name="role" size="sm" disabled={!canWrite}>
              {BRAND_ASSETS.map((spec) => (
                <option key={spec.role} value={spec.role}>
                  {spec.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {/*
          Required, and the requirement is the point. This artwork renders at
          the top of every screen the customer's application draws, so an
          unnamed one is a WCAG 1.1.1 failure repeated on every page. Leaving it
          empty is allowed and means *decorative* — a real choice when the
          organisation's name is already beside the mark in text.
        */}
        <Field
          label="Alternative text"
          hint="Usually the organisation's name. Leave empty only if the name already appears beside the artwork."
        >
          {(props) => <Input {...props} name="alt" maxLength={120} disabled={!canWrite} />}
        </Field>

        <Field label="File" required hint="Up to 512 KB. Each slot lists what it accepts.">
          {(props) => (
            <input
              {...props}
              type="file"
              name="file"
              accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
              disabled={!canWrite}
              className={cn(
                "block w-full text-[0.8125rem] text-graphite",
                "file:mr-3 file:rounded-lg file:border file:border-rule-strong file:bg-paper",
                "file:px-3 file:py-1.5 file:text-[0.8125rem] file:font-medium file:text-ink",
                "file:cursor-pointer hover:file:bg-paper-sunk",
                "disabled:cursor-not-allowed disabled:file:cursor-not-allowed",
                "disabled:file:border-rule disabled:file:bg-paper-sunk disabled:file:text-graphite-soft",
              )}
            />
          )}
        </Field>
      </ActionForm>

      <Callout tone="info" title="An SVG is a document, not a picture" className="mt-5">
        Artwork carrying a script, an event handler or an embedded document is refused rather than
        stripped — served from this origin it would run with the app&rsquo;s privileges. Most design
        tools have an export option that omits interactivity; a PNG always works.
      </Callout>
    </Panel>
  );
}
