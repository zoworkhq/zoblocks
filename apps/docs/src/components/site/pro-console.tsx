"use client";

import * as React from "react";
import { ANCHOR_STEP, RAMP_STEPS, contrastBetween, generateRamp } from "@zoblocks/tokens/validate";
import { simulateVision, type VisionKind } from "@zoblocks/theme/vision";
import { Figma, ShoppingBag, SlidersHorizontal, Users } from "lucide-react";
import {
  AntDesignMark,
  BootstrapMark,
  MaterialUiMark,
  ZoBlocksLanguageMark,
} from "@/components/site/framework-marks";

/**
 * The Pro page's console, as a bento.
 *
 * ## The third design, and what the first two got wrong
 *
 * A grid of ten equal panels: accurate, and flat. Ten things at identical
 * weight is no hierarchy at all, and the page read as documentation.
 *
 * Then a scroll tour — one console held on screen while six chapters walked
 * past it. Better container, same failure underneath, plus two new ones I
 * could measure once it was built: the page ran to **17,435px** because six
 * chapters at 80vh each is a very long way to scroll, and the console sat at
 * **527 x 433** inside a 1440px window, which is a widget floating in white
 * space rather than a product.
 *
 * So this one is short and deliberately unequal. Every tile is sized to how
 * much it deserves: the application wearing the theme is four columns wide and
 * two rows tall because it is the thing worth looking at, the ramp is a tall
 * narrow strip because that is its shape, and the four capabilities that are a
 * sentence rather than a demonstration get one small tile between them. No
 * scrolling required to see the argument.
 *
 * ## The hero is dark, the tiles are not
 *
 * `--site-panel` and its family are the site's always-dark surfaces — the
 * tokens this design system reserves for "hardware, not document". The hero
 * takes them, so the page lands before it explains anything; the tiles below
 * stay on paper so the brand colour inside them is the brightest thing on the
 * screen.
 *
 * These are tokens, not literals. A version of this page wrote its darks as
 * hex and cost twice for it — a light reader got a slab wedged between a light
 * header and footer, and the high-contrast reader was the only one who did not
 * get high contrast. `e2e/pro.spec.ts` fails if a literal reaches the chrome.
 *
 * ## The numbers are the console's own
 *
 * `generateRamp` and `contrastBetween` come from `@zoblocks/tokens/validate`
 * and `simulateVision` from `@zoblocks/theme/vision` — the same functions the
 * server calls before it will emit a stylesheet. Nothing here is a screenshot,
 * so nothing here can drift from the product. The brand colours are the one
 * deliberate exception to the tokens-only rule: they are a customer's brand,
 * which is the subject of the page rather than the chrome around it.
 */

/**
 * Five brands, muted on purpose and measured before being chosen.
 *
 * Desaturated mid-tones with the hues spread wide, because the interesting
 * question is what the gate says about a colour a real customer would hand
 * over. Their lightness sits near the 600 step's own target so every ramp
 * reads dark-to-light in order.
 *
 * Three pass. `Basil` misses the floor by a tenth and `Seafoam` misses it by a
 * lot, and neither was arranged — eighteen muted candidates were measured and
 * the greens and teals are simply the ones that struggle. White text on a mid
 * green is hard, which is the whole argument the gate exists to make.
 */
const BRANDS = [
  { name: "Slate", seed: "#42597f" },
  { name: "Mauve", seed: "#7d5570" },
  { name: "Clay", seed: "#9a6048" },
  { name: "Basil", seed: "#4f8459" },
  { name: "Seafoam", seed: "#4f9e93" },
] as const;

/** The customer's paper. Not this page's — see the note on colours above. */
const PAPER = "#ffffff";

type Ramp = Record<(typeof RAMP_STEPS)[number], string>;

/**
 * Three pairs a theme cannot ship without: a filled action, a link on the page
 * ground, and text on a tinted panel. 4.5:1 is the WCAG AA floor for body
 * text, and the floor the console applies.
 */
const CHECKS: { id: string; label: string; fg: (r: Ramp) => string; bg: (r: Ramp) => string }[] = [
  { id: "action", label: "Label on brand 600", fg: () => PAPER, bg: (r) => r[600] },
  { id: "link", label: "Link on paper", fg: (r) => r[700], bg: () => PAPER },
  { id: "panel", label: "Brand on brand 50", fg: (r) => r[600], bg: (r) => r[50] },
];

const FLOOR = 4.5;

/**
 * The published path, in the shape `themeHref` produces.
 *
 * Rewritten rather than imported: `@zoblocks/theme` pulls a schema library and
 * the whole document model behind it, which is a great deal to send a browser
 * for one template string. `packages/theme/src/emit.ts` is the source of truth
 * for the shape and this must follow it if it ever changes.
 */
const publishedHref = (version: number) => `/t/northwind/northwind-clinical@${version}.css`;

interface Reading {
  id: string;
  label: string;
  ink: string;
  ground: string;
  ratio: number;
  ok: boolean;
}

interface Result {
  name: string;
  seed: string;
  ramp: Ramp;
  readings: Reading[];
  passes: boolean;
  /** Absent when the gate blocked it, which is the point of it being optional. */
  version?: number;
}

/**
 * Every brand run through the console's own two functions, once, at load.
 *
 * Deriving all five up front rather than the current one per render lets the
 * version numbers be assigned in list order, so a brand's published URL is the
 * same every time the tour returns to it. That is what "immutable" means, and
 * it is impossible to show if the number is recomputed from whatever the
 * reader last clicked. It also leaves the component with no derivation in it
 * at all.
 */
const RESULTS: Result[] = (() => {
  let version = 7;
  return BRANDS.map(({ name, seed }) => {
    const ramp = generateRamp(seed) as Ramp;
    const readings = CHECKS.map(({ id, label, fg, bg }) => {
      const ink = fg(ramp);
      const ground = bg(ramp);
      const ratio = contrastBetween(ink, ground) ?? 0;
      return { id, label, ink, ground, ratio, ok: ratio >= FLOOR };
    });
    const passes = readings.every((r) => r.ok);
    // A blocked theme never takes a version. The next passing one gets the
    // number it did not, exactly as the console would hand them out.
    return { name, seed, ramp, readings, passes, version: passes ? version++ : undefined };
  });
})();

const FIRST = RESULTS[0]!;
const PUBLISHED = RESULTS.filter((r) => r.version !== undefined).reverse();

/**
 * What is serving while a brand is only a draft.
 *
 * The last brand before this one that got through the gate, wrapping so index
 * zero has an answer. Never the current brand: the thing being shown is that
 * an edit does not reach a running application, and a panel where the draft
 * and the live theme are the same colour shows nothing.
 */
function liveBefore(index: number): Result {
  for (let step = 1; step <= RESULTS.length; step += 1) {
    const candidate = RESULTS[(index - step + RESULTS.length) % RESULTS.length];
    if (candidate?.version !== undefined) return candidate;
  }
  return FIRST;
}

/**
 * A whole application surface derived from one ramp.
 *
 * The neutrals are fixed rather than brand-derived, and that is load-bearing:
 * ink on ground is the one pair here that must hold whatever a visitor picks.
 * The brand goes where a customer's brand actually goes — the accent, the
 * tinted selection, the rules. `apps/docs/test/pro-tour-contrast.test.ts`
 * measures every combination this can reach.
 */
export function surfaceFor(ramp: Ramp, mode: "light" | "dark", vision: VisionKind | null) {
  const dark = mode === "dark";
  const raw = {
    ground: dark ? ramp[950] : "#ffffff",
    sunk: dark ? ramp[900] : ramp[50],
    ink: dark ? "#f8fafc" : "#0f172a",
    muted: dark ? "#cbd5e1" : "#475569",
    rule: dark ? ramp[800] : ramp[100],
    ruleStrong: dark ? ramp[700] : ramp[200],
    accent: dark ? ramp[400] : ramp[600],
    accentInk: dark ? ramp[950] : "#ffffff",
    accentSoft: dark ? ramp[900] : ramp[100],
  };
  if (!vision) return raw;
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, simulateVision(value, vision) ?? value]),
  ) as typeof raw;
}

export { RESULTS };

const MODES = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
] as const;

const DENSITIES = [
  { id: "comfortable", name: "Comfortable", row: "3.25rem" },
  { id: "standard", name: "Standard", row: "2.75rem" },
  { id: "compact", name: "Compact", row: "2.25rem" },
] as const;

const VISIONS = [
  { kind: null, name: "Typical" },
  { kind: "deuteranopia", name: "Deuter" },
  { kind: "protanopia", name: "Protan" },
  { kind: "tritanopia", name: "Tritan" },
] as const;

/** One row of a worklist. Ordinary clinic data, so the surface reads as one. */
const WORKLIST = [
  { at: "09:15", who: "A. Okafor", why: "Follow-up", flag: "Consent due" },
  { at: "09:40", who: "M. Ibrahim", why: "Intake", flag: null },
  { at: "10:05", who: "S. Lindqvist", why: "Medication review", flag: null },
  { at: "10:30", who: "R. Adeyemi", why: "Discharge summary", flag: null },
];

/**
 * Where the anchor step lands in each host's own vocabulary, and each host's
 * own mark.
 *
 * The marks come from `framework-marks.tsx`, which already carries them for
 * the component pages' language switcher along with their provenance: Ant
 * Design's is the project's own MIT glyph, Bootstrap's is redrawn from the
 * published mark, and MUI's is a stand-in that has to be replaced with the
 * official asset before this ships publicly. None is recoloured to the
 * ZoBlocks palette — a logo tinted to suit its host is no longer the logo.
 */
const HOSTS = [
  { id: "zb", host: "ZoBlocks", token: "--zb-accent", Mark: ZoBlocksLanguageMark },
  { id: "antd", host: "Ant Design", token: "colorPrimary", Mark: AntDesignMark },
  { id: "mui", host: "MUI", token: "palette.primary.main", Mark: MaterialUiMark },
  { id: "bs", host: "Bootstrap", token: "--bs-primary", Mark: BootstrapMark },
] as const;

/**
 * The four capabilities that are a sentence rather than a demonstration.
 *
 * The console has ten. Six of them do something a picture can show; these four
 * do not, and giving them a tile each purely for symmetry is what made the
 * first version of this page a wall of equal boxes. They share one tile.
 */
const ALSO = [
  {
    name: "Figma plugin",
    body: "Variables out, a proposal back. Proposing is not publishing.",
    Icon: Figma,
  },
  {
    name: "Roles",
    body: "Thirteen capabilities per role. Publish and rollback are admin only.",
    Icon: Users,
  },
  {
    name: "Marketplace",
    body: "Packs and themes, licensed to the organisation, perpetually.",
    Icon: ShoppingBag,
  },
  {
    name: "Playground",
    body: "Brand, mode, density and colour vision over real components.",
    Icon: SlidersHorizontal,
  },
];

export function ProConsole() {
  const [index, setIndex] = React.useState(0);
  const [mode, setMode] = React.useState<"light" | "dark">("light");
  const [modePicked, setModePicked] = React.useState(false);
  const [density, setDensity] = React.useState(1);
  const [vision, setVision] = React.useState<VisionKind | null>(null);

  const brand = RESULTS[index] ?? FIRST;
  const { ramp, readings, passes, version } = brand;
  const live = liveBefore(index);

  /*
   * The theme anything shipped is wearing: the draft when it passes, the last
   * published one when it does not.
   *
   * The console's real behaviour, and also what keeps this page accessible.
   * The applied surface paints white on step 600, which is exactly the pair
   * the gate refuses, so drawing a blocked draft there would put a genuine
   * contrast failure on a page about a contrast gate.
   */
  /*
   * The preview follows the site's theme until somebody chooses for it.
   *
   * It defaulted to light whatever the page was doing, which put a blazing
   * white application in the middle of a dark page — the one element on the
   * screen not answering to the theme, on a page about theming.
   *
   * Set in an effect rather than in the initial state, because the server has
   * no theme to read and a state that differs between the two is a hydration
   * mismatch. `Mode` is still a real control: the first click on it takes over
   * and the observer stops, since a preview that snaps back to the page's
   * theme the moment somebody looks away is worse than one that never
   * followed.
   */
  React.useEffect(() => {
    if (modePicked) return;
    const read = () => {
      setMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [modePicked]);

  const applied = passes ? brand : live;
  const worn = applied.ramp;
  const surface = React.useMemo(() => surfaceFor(worn, mode, vision), [worn, mode, vision]);
  const rowHeight = (DENSITIES[density] ?? DENSITIES[1]).row;

  return (
    <div className="pbento">
      {/* ---- the input, above the grid, because everything answers to it ---- */}
      <div className="pbentoBar">
        <div className="pbentoPicker" role="group" aria-label="Brand colour">
          {RESULTS.map((option, i) => (
            <button
              key={option.seed}
              type="button"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className="pbentoSwatch"
              style={{ "--tile": option.seed } as React.CSSProperties}
            >
              <span className="pbentoSwatchName">{option.name}</span>
            </button>
          ))}
        </div>
        <p className="pbentoBarNote">
          One colour drives every tile below. <code>{brand.seed}</code>, live in your browser.
        </p>
      </div>

      <div className="pbentoGrid">
        {/* ============ the big one: an application wearing the theme ======= */}
        <section className="pbentoTile pbentoTile--app" aria-labelledby="pb-app">
          <header className="pbentoHead">
            <h3 id="pb-app" className="pbentoName">
              Your brand, in the application
            </h3>
            <p className="pbentoWhat">
              Brand, mode, density and colour vision, over an interface rather than a swatch board.
            </p>
          </header>

          {/*
            A picture of an application, not one: its buttons do nothing and
            its rows lead nowhere, so a dozen dead controls in the tab order
            would be worse than useless. Everything it says is in the caption.
          */}
          <div
            className="pbentoApp"
            aria-hidden="true"
            style={
              {
                "--s-ground": surface.ground,
                "--s-sunk": surface.sunk,
                "--s-ink": surface.ink,
                "--s-muted": surface.muted,
                "--s-rule": surface.rule,
                "--s-rule-strong": surface.ruleStrong,
                "--s-accent": surface.accent,
                "--s-accent-ink": surface.accentInk,
                "--s-accent-soft": surface.accentSoft,
                "--s-row": rowHeight,
              } as React.CSSProperties
            }
          >
            <div className="pbentoAppBar">
              <span className="pbentoAppMark" />
              <span className="pbentoAppOrg">Northwind Clinical</span>
              <span className="pbentoSpacer" />
              <span className="pbentoAppGhost">Export</span>
              <span className="pbentoAppCta">New note</span>
            </div>
            <div className="pbentoAppTabs">
              {["Worklist", "Schedule", "Messages"].map((tab, i) => (
                <span key={tab} data-active={i === 0 ? "" : undefined}>
                  {tab}
                </span>
              ))}
            </div>
            <ul className="pbentoAppRows">
              {WORKLIST.map((row, i) => (
                <li key={row.who} data-selected={i === 0 ? "" : undefined}>
                  <span className="pbentoAppRail" />
                  <span className="pbentoAppAt">{row.at}</span>
                  <span className="pbentoAppWho">{row.who}</span>
                  <span className="pbentoAppWhy">{row.why}</span>
                  {row.flag ? <span className="pbentoAppFlag">{row.flag}</span> : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="pbentoAxes">
            <Axis label="Mode">
              {MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={mode === option.id}
                  onClick={() => {
                    setMode(option.id);
                    setModePicked(true);
                  }}
                >
                  {option.name}
                </button>
              ))}
            </Axis>
            <Axis label="Density">
              {DENSITIES.map((option, i) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={i === density}
                  onClick={() => setDensity(i)}
                >
                  {option.name}
                </button>
              ))}
            </Axis>
            <Axis label="Colour vision">
              {VISIONS.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  aria-pressed={vision === option.kind}
                  onClick={() => setVision(option.kind)}
                >
                  {option.name}
                </button>
              ))}
            </Axis>
          </div>

          <p className="pbentoSay" data-warn={passes ? undefined : ""}>
            {passes
              ? `Wearing ${brand.name}, version ${version}.`
              : `${brand.name} is blocked, so this is still wearing ${live.name}, version ${live.version}. A draft that fails the gate repaints nothing.`}
          </p>
        </section>

        {/* ============ tall and narrow, because that is a ramp's shape ===== */}
        <section className="pbentoTile pbentoTile--ramp" aria-labelledby="pb-ramp">
          <header className="pbentoHead">
            <h3 id="pb-ramp" className="pbentoName">
              One colour in, eleven out
            </h3>
            <p className="pbentoWhat">Anchored so step 600 is exactly what you gave it.</p>
          </header>
          <ol className="pbentoRamp" key={`ramp-${brand.seed}`}>
            {RAMP_STEPS.map((step, i) => (
              <li
                key={step}
                data-anchor={step === ANCHOR_STEP ? "" : undefined}
                style={{ "--i": i, "--stop": ramp[step] } as React.CSSProperties}
              >
                <span aria-hidden="true" className="pbentoStop" />
                <span className="pbentoStopStep">{step}</span>
                <span className="pbentoStopHex">{ramp[step]}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ============ the gate ============================================ */}
        <section className="pbentoTile pbentoTile--gate" aria-labelledby="pb-gate">
          <header className="pbentoHead">
            <h3 id="pb-gate" className="pbentoName">
              A failing theme cannot go live
            </h3>
            <p className="pbentoWhat">
              Measured on the server. The boundary is at publish, so a failure cannot be clicked
              past.
            </p>
          </header>
          <ul className="pbentoChecks" key={`gate-${brand.seed}`}>
            {readings.map((reading, i) => (
              <li
                key={reading.id}
                data-ok={reading.ok ? "" : undefined}
                style={{ "--i": i } as React.CSSProperties}
              >
                {/* The pair as colour, never as letters: a failing pair set in
                    real type would be a real contrast failure on this page. */}
                <span
                  aria-hidden="true"
                  className="pbentoPair"
                  style={{ background: reading.ground }}
                >
                  <span style={{ background: reading.ink }} />
                </span>
                <span className="pbentoCheckLabel">{reading.label}</span>
                <span className="pbentoCheckBar" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (reading.ratio / 9) * 100)}%` }} />
                </span>
                <span className="pbentoRatio">{reading.ratio.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="pbentoVerdict" data-ok={passes ? "" : undefined}>
            {passes
              ? `All three clear ${FLOOR.toFixed(1)}:1.`
              : `${readings.filter((r) => !r.ok).length} of 3 below ${FLOOR.toFixed(1)}:1. Publish refused.`}
          </p>
        </section>

        {/* ============ delivery =========================================== */}
        <section className="pbentoTile pbentoTile--deliver" aria-labelledby="pb-deliver">
          <header className="pbentoHead">
            <h3 id="pb-deliver" className="pbentoName">
              Pinned to a version
            </h3>
            <p className="pbentoWhat">
              An edit here cannot change a running application until somebody moves the pin.
            </p>
          </header>
          <ol className="pbentoVersions" key={`deliver-${brand.seed}`}>
            {PUBLISHED.slice(0, 3).map((entry, i) => (
              <li
                key={entry.seed}
                data-current={entry.seed === applied.seed ? "" : undefined}
                style={{ "--i": i, "--stop": entry.ramp[600] } as React.CSSProperties}
              >
                <span aria-hidden="true" className="pbentoDot" />
                <code>{publishedHref(entry.version ?? 0)}</code>
              </li>
            ))}
          </ol>
        </section>

        {/* ============ frameworks ========================================= */}
        <section className="pbentoTile pbentoTile--hosts" aria-labelledby="pb-hosts">
          <header className="pbentoHead">
            <h3 id="pb-hosts" className="pbentoName">
              It speaks your host&rsquo;s language
            </h3>
            <p className="pbentoWhat">
              The same value under four house styles, and the library imports none of them.
            </p>
          </header>
          <ul className="pbentoHosts" key={`hosts-${applied.seed}`}>
            {HOSTS.map(({ id, host, token, Mark }, i) => (
              <li
                key={id}
                data-host={id}
                style={{ "--i": i, "--h-accent": worn[ANCHOR_STEP] } as React.CSSProperties}
              >
                <span className="pbentoHostName">
                  <Mark className="pbentoHostMark" />
                  {host}
                </span>
                {/* A picture of that host's primary action. The shape is the
                    information — label and colour are identical in all four. */}
                <span aria-hidden="true" className="pbentoHostBtn">
                  New note
                </span>
                <code className="pbentoHostToken">{token}</code>
              </li>
            ))}
          </ul>
        </section>

        {/* ============ the four that are a sentence ======================= */}
        <section className="pbentoTile pbentoTile--also" aria-labelledby="pb-also">
          <header className="pbentoHead">
            <h3 id="pb-also" className="pbentoName">
              Also in the console
            </h3>
          </header>
          {/* An icon per entry, and two columns rather than four.

              Four columns of unadorned text at this width gave each item about
              twelve characters a line and four ragged paragraphs; there was
              nothing to catch the eye and nothing to tell them apart. */}
          <dl className="pbentoAlso">
            {ALSO.map(({ name, body, Icon }) => (
              <div key={name}>
                <dt>
                  <Icon aria-hidden="true" className="pbentoAlsoIcon size-4" />
                  {name}
                </dt>
                <dd>{body}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}

/** A labelled group of exclusive controls, used for the three preview axes. */
function Axis({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pbentoAxis">
      <span className="pbentoAxisLabel">{label}</span>
      <div className="pbentoSeg" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
