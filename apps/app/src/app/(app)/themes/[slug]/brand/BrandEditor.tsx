"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import {
  ANCHOR_STEP,
  RAMP_STEPS,
  VISION_KINDS,
  VISION_LABELS,
  generateRamp,
  simulateVision,
  type VisionKind,
} from "@zoblocks/theme";
import { contrastBetween, hue, hueDistance, parseHex } from "@zoblocks/tokens/validate";
import { saveBrandAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import {
  AxisGroup,
  Button,
  Callout,
  ColorField,
  Panel,
  StatusChip,
  SubmitButton,
  Verdict,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type Ramp = Record<string, string>;

/**
 * The brand ramp, and what it looks like to someone who cannot see all of it.
 *
 * Two halves, and the second is the one that earns the screen. Every step is
 * editable, because a generated ramp is a good default and not a right answer —
 * brand guidelines usually pin two or three steps exactly. And every step is
 * shown under four kinds of colour vision, because the whole reason this system
 * refuses to let a customer touch the status colours is that hue is not
 * reliable information, and that argument is far more convincing shown than
 * written.
 */
export function BrandEditor({
  themeId,
  ramp: saved,
  /** Resolved status colours, so the simulation can make the clinical point. */
  status,
  canWrite,
  reason,
}: {
  themeId: string;
  ramp: Ramp;
  status: Record<string, string>;
  canWrite: boolean;
  reason?: string;
}) {
  const [ramp, setRamp] = useState<Ramp>(saved);
  const [vision, setVision] = useState<VisionKind | "none">("none");

  const seed = ramp[String(ANCHOR_STEP)] ?? "#1d63c9";
  const dirty = JSON.stringify(ramp) !== JSON.stringify(saved);

  const setStep = (step: string, value: string) =>
    setRamp((current) => ({ ...current, [step]: value }));

  /** Re-derive the ten from the one, keeping the anchor exactly as typed. */
  const regenerate = () => {
    const next = generateRamp(seed);
    if (next) setRamp(Object.fromEntries(Object.entries(next)));
  };

  const show = (hex: string) => (vision === "none" ? hex : (simulateVision(hex, vision) ?? hex));

  return (
    <ActionForm
      action={saveBrandAction}
      className="space-y-5"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="body-sm text-graphite">
            {dirty ? "Unsaved changes." : "Saved."} Step {ANCHOR_STEP} is your brand colour; the
            rest are derived.
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={regenerate} reason={reason}>
              <Wand2 aria-hidden="true" className="size-3.5" />
              Regenerate from {ANCHOR_STEP}
            </Button>
            <SubmitButton reason={reason} pendingLabel="Checking…">
              Save ramp
            </SubmitButton>
          </div>
        </div>
      }
    >
      <input type="hidden" name="themeId" value={themeId} />
      <input type="hidden" name="ramp" value={JSON.stringify(ramp)} />

      <AxisGroup
        label="Colour vision"
        value={vision}
        onChange={setVision}
        options={[
          { value: "none" as const, label: "Normal" },
          ...VISION_KINDS.map((kind) => ({ value: kind, label: VISION_LABELS[kind].label })),
        ]}
      />

      {vision !== "none" && (
        <Callout tone="info" title={VISION_LABELS[vision].note}>
          A simulation for review, not a diagnosis. It models <em>dichromacy</em> — a cone absent —
          which is about a quarter of colour-vision deficiency; the commoner anomalous forms sit
          between this and the original. A palette that still reads here reads for everyone.
        </Callout>
      )}

      <Panel
        title="Brand ramp"
        description="Eleven steps. Every pair they take part in is checked in light, dark and high contrast before this theme can be published."
      >
        <div className="preview-region -m-1 space-y-4 p-4">
          <div
            className="flex overflow-hidden rounded-lg border border-rule-strong"
            role="img"
            aria-label={
              vision === "none"
                ? "The brand ramp, light to dark"
                : `The brand ramp under ${VISION_LABELS[vision].label}`
            }
          >
            {RAMP_STEPS.map((step) => {
              const value = ramp[String(step)];
              return (
                <span
                  key={step}
                  title={`${step} · ${value ?? "—"}`}
                  className={cn(
                    "h-11 flex-1",
                    step === ANCHOR_STEP && "ring-2 ring-inset ring-ink",
                  )}
                  style={{ background: value ? show(value) : "transparent" }}
                />
              );
            })}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RAMP_STEPS.map((step) => {
              const value = ramp[String(step)];
              if (!value) return null;
              const anchor = step === ANCHOR_STEP;
              return (
                <li key={step} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="tabular w-8 font-mono text-[0.6875rem] text-graphite-soft">
                      {step}
                    </span>
                    {anchor && <StatusChip tone="accent">brand</StatusChip>}
                  </div>
                  <ColorField
                    label={`Brand step ${step}`}
                    value={value}
                    onChange={canWrite ? (next) => setStep(String(step), next) : undefined}
                    disabled={!canWrite}
                  />
                  {vision !== "none" && (
                    <p className="flex items-center gap-1.5 text-[0.625rem] text-graphite">
                      <span
                        aria-hidden="true"
                        className="size-3 shrink-0 rounded-sm ring-1 ring-rule-strong"
                        style={{ background: show(value) }}
                      />
                      seen as <code className="font-mono">{show(value).toUpperCase()}</code>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Panel>

      <StatusUnderVision status={status} vision={vision} />
    </ActionForm>
  );
}

/**
 * The clinical colours, under the same simulation.
 *
 * Not editable and deliberately on this screen. A customer looking at their own
 * ramp under deuteranopia is exactly the moment the rule "you may not change
 * what critical looks like" stops sounding like a limitation and starts
 * sounding like the reason they bought a clinical design system.
 */
function StatusUnderVision({
  status,
  vision,
}: {
  status: Record<string, string>;
  vision: VisionKind | "none";
}) {
  const entries = Object.entries(status);
  if (entries.length === 0) return null;

  const show = (hex: string) => (vision === "none" ? hex : (simulateVision(hex, vision) ?? hex));

  /*
   * High against low, measured two ways, because one of them is not enough.
   *
   * The first version of this reported the contrast ratio alone and claimed
   * that "when hue stops being reliable, lightness still carries the
   * direction". Running it proved that wrong: under deuteranopia ZoBlocks's
   * `high` becomes an olive and `low` a blue — clearly different — while their
   * *luminance* ratio is 1.27:1, which is nothing. The pair survives red-green
   * deficiency by hue, not by lightness, because 60° of separation puts them on
   * the blue-yellow axis that red-green deficiency leaves intact. That is the
   * actual mechanism, and it is a better story than the one that was written.
   *
   * Both numbers are shown. Hue distance is what the 60° rule is about; the
   * contrast ratio is what is left when hue goes entirely, and it is honestly
   * small — which is why no ZoBlocks component has ever used colour alone.
   */
  const high = status["status.high"];
  const low = status["status.low"];
  const pair =
    high && low
      ? {
          hue: hueDistance(hue(parseHex(show(high))!), hue(parseHex(show(low))!)),
          contrast: contrastBetween(show(high), show(low)),
        }
      : undefined;

  return (
    <Panel
      title="Clinical status, for comparison"
      description="Locked to every theme and every framework bridge. Shown here under the same simulation, because this is what the lock is for."
    >
      <ul className="flex flex-wrap gap-x-6 gap-y-3">
        {entries.map(([path, hex]) => (
          <li key={path} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-5 shrink-0 rounded ring-1 ring-rule-strong"
              style={{ background: show(hex) }}
            />
            <span className="text-[0.75rem]">
              <code className="font-mono text-[0.6875rem] text-graphite">
                {path.replace("status.", "")}
              </code>
              {vision !== "none" && (
                <span className="tabular ml-1.5 font-mono text-[0.625rem] text-graphite-soft">
                  {show(hex).toUpperCase()}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {pair && (
        <div className="mt-4 space-y-2 border-t border-rule pt-3">
          <p className="eyebrow text-graphite-soft">
            High against low
            {vision === "none"
              ? " as drawn"
              : ` under ${VISION_LABELS[vision].label.toLowerCase()}`}
          </p>

          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            <div className="flex items-baseline gap-2">
              <dt className="text-[0.75rem] text-graphite">Hue apart</dt>
              <dd className="tabular font-mono text-[0.8125rem] font-medium">
                {pair.hue.toFixed(0)}°
              </dd>
              <dd>
                <Verdict ok={pair.hue >= 60}>{pair.hue >= 60 ? "clears 60°" : "below 60°"}</Verdict>
              </dd>
            </div>
            {pair.contrast !== undefined && (
              <div className="flex items-baseline gap-2">
                <dt className="text-[0.75rem] text-graphite">Luminance</dt>
                <dd className="tabular font-mono text-[0.8125rem] font-medium">
                  {pair.contrast.toFixed(2)}:1
                </dd>
              </div>
            )}
          </dl>

          <p className="body-sm text-graphite">
            The 60° floor is what makes this pair survive red-green deficiency: it puts{" "}
            <em>high</em> and <em>low</em> on the blue-yellow axis, which protanopia and
            deuteranopia leave intact. Their <em>luminance</em> difference is small and always was —
            which is why no ZoBlocks component signals severity with colour alone. Every status also
            carries a word.
          </p>
        </div>
      )}
    </Panel>
  );
}
