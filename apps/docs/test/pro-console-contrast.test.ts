import { describe, expect, it } from "vitest";
import { contrastBetween } from "@zoblocks/tokens/validate";
import { VISION_KINDS } from "@zoblocks/theme/vision";
import { RESULTS, surfaceFor } from "@/components/site/pro-console";

/**
 * The Pro tour's application preview is `aria-hidden`, and axe therefore never
 * looks at it.
 *
 * That is the right markup — it is a picture of an application, not one, and a
 * dozen dead controls in the tab order would be worse than useless. But it
 * leaves the page's WCAG audit with a hole exactly where the most colour is,
 * on a page whose subject is a contrast gate. This closes it, and closes it
 * more thoroughly than a browser audit could: every theme the preview can
 * wear, both modes, and all four colour-vision settings, rather than whichever
 * combination a test happened to click through.
 */

/** Body text, so the AA floor. */
const TEXT_FLOOR = 4.5;
/** A control's own boundary, so the AA non-text floor. */
const EDGE_FLOOR = 3;

const MODES = ["light", "dark"] as const;

/**
 * Only the themes that got through the gate.
 *
 * Not a convenience: the tour paints `passes ? brand : live`, so a blocked
 * draft never reaches the preview. `Basil` measures 4.40:1 and `Seafoam`
 * 3.16:1 on exactly the pair the preview's filled action paints, which is why
 * both are blocked and why the preview keeps wearing the last published theme.
 */
const WEARABLE = RESULTS.filter((r) => r.passes);

const at = (fg: string, bg: string) => contrastBetween(fg, bg) ?? 0;

describe("every theme the preview can wear is readable", () => {
  it("there is more than one, so this is not passing on an empty list", () => {
    expect(WEARABLE.length).toBeGreaterThan(1);
  });

  for (const brand of WEARABLE) {
    for (const mode of MODES) {
      it(`${brand.name} · ${mode}`, () => {
        const s = surfaceFor(brand.ramp, mode, null);

        expect(at(s.ink, s.ground), "ink on ground").toBeGreaterThanOrEqual(TEXT_FLOOR);
        expect(at(s.muted, s.ground), "muted on ground").toBeGreaterThanOrEqual(TEXT_FLOOR);
        expect(at(s.ink, s.sunk), "ink on the sunk ground").toBeGreaterThanOrEqual(TEXT_FLOOR);
        expect(at(s.ink, s.accentSoft), "ink on the selected row").toBeGreaterThanOrEqual(
          TEXT_FLOOR,
        );
        expect(at(s.accentInk, s.accent), "the filled action").toBeGreaterThanOrEqual(TEXT_FLOOR);
        expect(at(s.accent, s.ground), "the accent against the ground").toBeGreaterThanOrEqual(
          EDGE_FLOOR,
        );
      });
    }
  }
});

/**
 * And it holds under simulation too, which was not a given.
 *
 * Colour-vision simulation moves measured contrast around: it collapses an
 * axis of the colour space, so two colours far apart in hue can land close
 * together in luminance. WCAG contrast is defined on the colours as specified
 * and the console's gate measures exactly those, so a theme is entitled to
 * pass the gate and then read poorly to somebody — that is the reason the
 * preview has a colour-vision axis at all.
 *
 * It happens that no theme the preview can wear does that. `Basil` and
 * `Seafoam` do, and both are blocked at the gate before they get near it. If a
 * later edit adds a brand that passes and then fails here, this test is not
 * wrong — the brand is a poor choice of demo, and the honest fixes are to swap
 * it or to say on the page that a simulated view is a finding, not a defect.
 */
describe("and it holds under every colour-vision simulation", () => {
  for (const brand of WEARABLE) {
    for (const mode of MODES) {
      for (const vision of VISION_KINDS) {
        it(`${brand.name} · ${mode} · ${vision}`, () => {
          const s = surfaceFor(brand.ramp, mode, vision);

          expect(at(s.ink, s.ground), "ink on ground").toBeGreaterThanOrEqual(TEXT_FLOOR);
          expect(at(s.muted, s.ground), "muted on ground").toBeGreaterThanOrEqual(TEXT_FLOOR);
          expect(at(s.ink, s.sunk), "ink on the sunk ground").toBeGreaterThanOrEqual(TEXT_FLOOR);
          expect(at(s.ink, s.accentSoft), "ink on the selected row").toBeGreaterThanOrEqual(
            TEXT_FLOOR,
          );
          expect(at(s.accentInk, s.accent), "the filled action").toBeGreaterThanOrEqual(TEXT_FLOOR);
        });
      }
    }
  }
});
