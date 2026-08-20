"use client";

import * as React from "react";
import { Scissors } from "lucide-react";
import type { BrandAssetFile } from "@oxygenui-design/theme";
import { uploadBrandAssetAction } from "@/lib/actions";
import { Button, Callout, Field, Panel, Select, SubmitButton } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { cropGeometry, type Crop } from "@/lib/crop";

/**
 * Cut a favicon out of the wordmark.
 *
 * Nothing else in this console derives one asset from another — a reversed
 * mark is a decision its owner has already made, and generating one produces
 * artwork their brand guidelines forbid. A favicon is the one place that
 * argument is weaker, because the alternative is not "somebody drew it" but
 * "the tab shows a blank page icon", which no guideline anywhere prefers.
 *
 * So the derivation is offered rather than performed, and the whole design is
 * about making the result *judgeable*: three crops, previewed at the sizes a
 * browser actually renders. At 16 pixels a wordmark is a smudge, and the point
 * of showing it at 16 pixels is that the person deciding can see that for
 * themselves rather than being told.
 *
 * The cutting happens here, in a canvas, not on the server. A favicon needs a
 * rasteriser; the browser already is one, and shipping an image decoder to the
 * server to avoid running one in the browser would be the wrong trade.
 */

const CROPS: readonly { value: Crop; label: string; note: string }[] = [
  {
    value: "leading",
    label: "The leading square",
    note: "The left-hand square of the mark. In most wordmarks that is the symbol, which is what you want.",
  },
  {
    value: "centre",
    label: "The centre square",
    note: "For a mark whose symbol sits in the middle, or a stacked lockup.",
  },
  {
    value: "whole",
    label: "The whole mark, letterboxed",
    note: "Everything, scaled to fit a square. Honest, and usually illegible at 16 pixels.",
  },
];

/** The sizes a browser actually asks for. 16 is the one that decides. */
const PREVIEW_SIZES = [16, 32, 64] as const;

/** A 1×1 transparent PNG, so the dark row has a valid src before the first draw. */
const TRANSPARENT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** Draw the source into a square canvas under one crop rule. */
function cut(image: HTMLImageElement, crop: Crop, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return canvas;

  // Smooth downscaling matters more here than anywhere else in the product:
  // this is a 400-pixel mark becoming 16 pixels.
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const { source, dest } = cropGeometry(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    crop,
    size,
  );

  // Nothing to draw from — an SVG that states no size at all, which is legal.
  if (source.width === 0) return canvas;

  context.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    dest.x,
    dest.y,
    dest.width,
    dest.height,
  );
  return canvas;
}

export function DeriveFavicon({
  themeId,
  source,
  canWrite,
  reason,
}: {
  themeId: string;
  /** The light mark. Nothing to derive from without one. */
  source?: BrandAssetFile;
  canWrite: boolean;
  reason?: string;
}) {
  const [crop, setCrop] = React.useState<Crop>("leading");
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [dataUrl, setDataUrl] = React.useState<string>("");
  const canvases = React.useRef(new Map<number, HTMLCanvasElement | null>());

  React.useEffect(() => {
    if (!source) return;
    const img = new Image();
    /*
     * Same-origin artwork, requested with CORS anyway.
     *
     * Without it the canvas is tainted the moment this is drawn, and
     * `toDataURL` throws a SecurityError — which is the one failure mode of
     * this whole component that would look like a bug in the crop maths.
     */
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setFailed(true);
    img.src = source.src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [source]);

  // Redraw whenever the crop or the source changes, and keep the 256-pixel
  // version — the previews are for judging, that is what gets uploaded.
  React.useEffect(() => {
    if (!image) return;
    for (const size of PREVIEW_SIZES) {
      const target = canvases.current.get(size);
      if (!target) continue;
      const drawn = cut(image, crop, size);
      const context = target.getContext("2d");
      context?.clearRect(0, 0, size, size);
      context?.drawImage(drawn, 0, 0);
    }
    setDataUrl(cut(image, crop, 256).toDataURL("image/png"));
  }, [image, crop]);

  if (!source) {
    return (
      <Panel
        title="Cut a favicon from the mark"
        description="Available once a light mark has been uploaded — there is nothing to cut from until then."
      >
        <p className="body-sm text-graphite">
          Upload <strong>Mark, on light</strong> above and this offers you three crops of it.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Cut a favicon from the mark"
      description="Three crops of the light mark, shown at the sizes a browser actually renders. Nothing is saved until you choose one."
    >
      {failed ? (
        <Callout tone="fail" title="That mark could not be read">
          The artwork loaded but the browser refused to draw it. Upload a favicon directly instead.
        </Callout>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="flex flex-col gap-3">
            <Field label="Crop" required hint={CROPS.find((c) => c.value === crop)?.note}>
              {(props) => (
                <Select
                  {...props}
                  size="sm"
                  value={crop}
                  onChange={(event) => setCrop(event.target.value as Crop)}
                >
                  {CROPS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <ActionForm
              action={uploadBrandAssetAction}
              footer={
                <SubmitButton reason={reason} pendingLabel="Saving…" className="mt-3">
                  <Scissors aria-hidden="true" strokeWidth={2} className="size-3.5" />
                  Use this crop
                </SubmitButton>
              }
            >
              <input type="hidden" name="themeId" value={themeId} />
              <input type="hidden" name="role" value="favicon" />
              <input type="hidden" name="alt" value={source.alt} />
              {/*
                The cut PNG travels as a data URL and is decoded on the server,
                so it arrives through exactly the same check as a hand-uploaded
                file. A derived asset is not a trusted one.
              */}
              <input type="hidden" name="derived" value={dataUrl} />
              <p className="body-sm text-graphite">
                Saved as a 256-pixel PNG, checked the same way an uploaded file is.
              </p>
            </ActionForm>
          </div>

          {/*
            The previews, at true size, on both grounds. A tab strip is light
            in one browser and dark in another, and a mark that vanishes on one
            of them is the failure this is here to make visible.
          */}
          <div className="flex flex-col gap-3">
            {(["light", "dark"] as const).map((ground) => (
              <div
                key={ground}
                className="flex flex-wrap items-end gap-5 rounded-lg border p-4"
                style={{
                  background: ground === "light" ? "#ffffff" : "#0e1116",
                  borderColor: ground === "light" ? "#e4e7ea" : "#242a32",
                }}
              >
                {PREVIEW_SIZES.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-1.5">
                    {/*
                      The canvas is the light row and the image is the dark
                      one, rather than a canvas in both with one hidden. Two
                      elements carrying the same accessible name — one of them
                      invisible — is a screen reader hearing the preview twice,
                      and it is what the browser test caught here.
                    */}
                    {ground === "light" ? (
                      <canvas
                        ref={(node) => {
                          canvases.current.set(size, node);
                        }}
                        width={size}
                        height={size}
                        style={{ width: size, height: size }}
                        role="img"
                        aria-label={`The crop at ${size} pixels`}
                      />
                    ) : (
                      <img
                        src={dataUrl || TRANSPARENT}
                        alt={`The crop at ${size} pixels, on a dark tab strip`}
                        width={size}
                        height={size}
                        style={{ width: size, height: size }}
                      />
                    )}
                    <span
                      className="text-[0.625rem] tabular-nums"
                      style={{ color: ground === "light" ? "#5c6773" : "#98a3af" }}
                    >
                      {size}px
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <p className="body-sm text-graphite">
              Sixteen pixels is the one that decides. If the mark is unreadable there, the answer is
              usually a separate symbol rather than a different crop.
            </p>
          </div>
        </div>
      )}

      {!canWrite && (
        <div className="mt-4">
          <Button variant="ghost" size="sm" disabled>
            {reason ?? "You cannot change this theme"}
          </Button>
        </div>
      )}
    </Panel>
  );
}
