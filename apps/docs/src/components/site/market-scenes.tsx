/**
 * The five marketplace previews, one per pack.
 *
 * Server-rendered markup and CSS keyframes only (`app/marketplace.css`), so a
 * preview costs no JavaScript. Motion is declared under
 * `prefers-reduced-motion: no-preference`; without it every scene rests on a
 * complete frame.
 *
 * Text inside a scene never fades. It switches colour or visibility in steps,
 * because `scripts/a11y.ts` pauses infinite animations wherever they are and a
 * half-faded label measures as a contrast failure.
 */

import type { CSSProperties, ReactNode } from "react";
import type { SceneId } from "@/lib/market-collection";

const vars = (values: Record<string, string | number>) => values as CSSProperties;

/** A 24px-grid glyph. Stroke 1.5 on the grid, whatever size it renders at. */
function Glyph({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state illustrations — one empty list, three meanings          */
/* ------------------------------------------------------------------ */

const MEANINGS = [
  {
    label: "Not asked",
    code: "notasked",
    art: (
      <>
        <path className="zbm-ns-dash" d="M34 60h72M34 76h56M34 92h64" />
        <g className="zbm-ns-q" data-sync="">
          <path
            className="zbm-ns-bubble"
            d="M92 102h28a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H99l-7 6v-6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6z"
          />
          <path className="zbm-ns-mark" d="M102.5 111a3.5 3.5 0 1 1 5 3.2c-1 .5-1.5 1.1-1.5 2.1" />
          <circle className="zbm-ns-mark-dot" cx="106" cy="120" r="1.25" />
        </g>
      </>
    ),
  },
  {
    label: "None found",
    code: "nilknown",
    art: (
      <>
        <path className="zbm-ns-row" d="M34 60h56" />
        <circle className="zbm-ns-disc" cx="80" cy="96" r="20" />
        <path className="zbm-ns-tick" data-sync="" d="M71 96.5l6 6 12-13" />
        <path className="zbm-ns-row" d="M60 128h40" />
      </>
    ),
  },
  {
    label: "Withheld",
    code: "withheld",
    art: (
      <>
        {[84, 60, 72].map((width, b) => (
          <rect
            key={b}
            className="zbm-ns-bar"
            data-sync=""
            style={vars({ "--b": b })}
            x="34"
            y={55 + b * 14}
            width={width}
            height="8"
            rx="2"
          />
        ))}
        <path className="zbm-ns-shackle" data-sync="" d="M73 111v-6a7 7 0 0 1 14 0v6" />
        <rect className="zbm-ns-lock" x="66" y="110" width="28" height="22" rx="5" />
        <circle className="zbm-ns-key" cx="80" cy="119" r="2.5" />
        <path className="zbm-ns-key-line" d="M80 121v4" />
      </>
    ),
  },
] as const;

function EmptyStates() {
  return (
    <div className="zbm-ns">
      {MEANINGS.map((meaning, i) => (
        <figure key={meaning.code} className="zbm-ns-fig" data-sync="" style={vars({ "--i": i })}>
          <svg viewBox="0 0 160 150" className="zbm-ns-art" data-sync="" aria-hidden="true">
            <rect
              className="zbm-ns-sheet"
              data-sync=""
              x="20.5"
              y="10.5"
              width="119"
              height="129"
              rx="10"
            />
            <rect className="zbm-ns-title" x="34" y="24" width="44" height="8" rx="4" />
            <circle className="zbm-ns-status" data-meaning={meaning.code} cx="124" cy="28" r="4" />
            <path className="zbm-ns-rule" d="M34 44.5h92" />
            {meaning.art}
          </svg>
          <figcaption className="zbm-ns-caption">
            <span className="zbm-ns-label" data-sync="">
              {meaning.label}
            </span>
            <code className="zbm-ns-code">{meaning.code}</code>
            <span className="zbm-ns-progress" data-sync="" aria-hidden="true" />
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Clinical icon set — the glyphs on their grid                        */
/* ------------------------------------------------------------------ */

const CLINICAL_ICONS: readonly { name: string; body: ReactNode }[] = [
  {
    name: "syringe",
    body: (
      <g transform="rotate(45 12 12)">
        <rect x="9.5" y="6" width="5" height="10" rx="1" />
        <path d="M12 16v5.5M12 6V3M9.5 2.5h5M9.5 9H11M9.5 12H11" />
      </g>
    ),
  },
  {
    name: "capsule",
    body: (
      <g transform="rotate(-45 12 12)">
        <path
          d="M8 12V7.5a4 4 0 0 1 8 0V12z"
          fill="currentColor"
          fillOpacity={0.18}
          stroke="none"
        />
        <rect x="8" y="3.5" width="8" height="17" rx="4" />
        <path d="M8 12h8" />
      </g>
    ),
  },
  {
    name: "iv-bag",
    body: (
      <>
        <path d="M8 3h8a1 1 0 0 1 1 1v9a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V4a1 1 0 0 1 1-1z" />
        <path d="M10 7.5h2.5M10 10.5h2.5M12 17v4.5" />
      </>
    ),
  },
  {
    name: "stethoscope",
    body: (
      <>
        <path d="M6 3v5a4 4 0 0 0 8 0V3M5 3h2M13 3h2" />
        <path d="M10 12v3a5 5 0 0 0 10 0v-2" />
        <circle cx="20" cy="11" r="2" />
      </>
    ),
  },
  {
    name: "thermometer",
    body: (
      <>
        <path d="M10 14.13V5a2 2 0 0 1 4 0v9.13a3.5 3.5 0 1 1-4 0z" />
        <path d="M12 15.5V9M14 7h1.5M14 10h1.5" />
      </>
    ),
  },
  {
    name: "sample-tube",
    body: (
      <>
        <path
          d="M10 11h4v5.5a2 2 0 0 1-4 0z"
          fill="currentColor"
          fillOpacity={0.18}
          stroke="none"
        />
        <path d="M8.5 3.5h7M10 3.5v13a2 2 0 0 0 4 0v-13M10 11h4" />
      </>
    ),
  },
  {
    name: "heart-rate",
    body: (
      <>
        <path d="M12 20 4.9 12.9a4.5 4.5 0 0 1 6.4-6.4l.7.7.7-.7a4.5 4.5 0 0 1 6.4 6.4z" />
        <path d="M3 12.5h4.5L9 10l2 4.5 1.5-2.5H21" />
      </>
    ),
  },
  {
    name: "bed",
    body: (
      <>
        <path d="M3 5v14M3 16h18M21 13v6M3 13h18" />
        <path d="M10 13v-1.5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5V13" />
        <circle cx="6.5" cy="10.5" r="1.75" />
      </>
    ),
  },
  {
    name: "vial",
    body: (
      <>
        <rect x="9" y="3" width="6" height="3" rx=".75" />
        <path d="M8.5 8.5A1.5 1.5 0 0 1 10 7h4a1.5 1.5 0 0 1 1.5 1.5V19a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2z" />
        <path d="M8.5 12h7M8.5 17h7" />
      </>
    ),
  },
  {
    name: "plaster",
    body: (
      <g transform="rotate(-45 12 12)">
        <rect x="3" y="8.5" width="18" height="7" rx="3.5" />
        <path d="M9.5 8.5v7M14.5 8.5v7" />
        <circle cx="11" cy="11" r=".5" fill="currentColor" />
        <circle cx="13" cy="11" r=".5" fill="currentColor" />
        <circle cx="11" cy="13" r=".5" fill="currentColor" />
        <circle cx="13" cy="13" r=".5" fill="currentColor" />
      </g>
    ),
  },
  {
    name: "chart-check",
    body: (
      <>
        <path d="M8 4H6.5A1.5 1.5 0 0 0 5 5.5v14A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 17.5 4H16" />
        <rect x="8" y="2.5" width="8" height="3.5" rx="1" />
        <path d="m9 13.5 2 2 4-4" />
      </>
    ),
  },
  {
    name: "blood-drop",
    body: (
      <>
        <path d="M12 3.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
        <path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5" />
      </>
    ),
  },
];

function ClinicalIcons() {
  return (
    <div className="zbm-rounds">
      <ul className="zbm-rounds-grid">
        {CLINICAL_ICONS.map((glyph, i) => (
          <li key={glyph.name} className="zbm-rounds-tile" style={vars({ "--i": i })}>
            <svg viewBox="0 0 24 24" className="zbm-rounds-keys" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 0v24M0 12h24" />
            </svg>
            <Glyph className="zbm-rounds-glyph">{glyph.body}</Glyph>
          </li>
        ))}
      </ul>
      <p className="zbm-rounds-caption" aria-hidden="true">
        <span className="zbm-rounds-path">clinical/</span>
        <span className="zbm-rounds-names">
          {CLINICAL_ICONS.map((glyph, i) => (
            <span key={glyph.name} style={vars({ "--i": i })}>
              {glyph.name}
            </span>
          ))}
        </span>
        <span className="zbm-rounds-spec">24 · 1.5</span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Behavioural health icon set — connection, not anatomy               */
/* ------------------------------------------------------------------ */

const BEHAVIOURAL_ICONS: readonly { name: string; body: ReactNode }[] = [
  {
    name: "talk",
    body: (
      <>
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v5a1.5 1.5 0 0 1-1.5 1.5H9l-3 2.5V12h-.5A1.5 1.5 0 0 1 4 10.5z" />
        <path d="M18 8.5h.5A1.5 1.5 0 0 1 20 10v5a1.5 1.5 0 0 1-1.5 1.5H18V19l-3-2.5h-3.5A1.5 1.5 0 0 1 10 15v-.5" />
      </>
    ),
  },
  {
    name: "group",
    body: (
      <>
        <circle cx="12" cy="8" r="2.5" />
        <path d="M7.5 18.5a4.5 4.5 0 0 1 9 0" />
        <circle cx="5.5" cy="10" r="2" />
        <circle cx="18.5" cy="10" r="2" />
        <path d="M2.5 18a3.5 3.5 0 0 1 4-3.4M21.5 18a3.5 3.5 0 0 0-4-3.4" />
      </>
    ),
  },
  {
    name: "telehealth",
    body: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M9 20h6M12 16v4" />
        <circle cx="12" cy="8.25" r="1.75" />
        <path d="M8.5 14a3.5 3.5 0 0 1 7 0" />
      </>
    ),
  },
  {
    name: "peer",
    body: (
      <>
        <circle cx="8" cy="11.5" r="2" />
        <circle cx="16" cy="11.5" r="2" />
        <path d="M4 19a4 4 0 0 1 8 0M12 19a4 4 0 0 1 8 0" />
        <path
          d="M12 7.5 10.2 5.7a1.27 1.27 0 0 1 1.8-1.8 1.27 1.27 0 0 1 1.8 1.8z"
          fill="currentColor"
        />
      </>
    ),
  },
  {
    name: "journal",
    body: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
        <path d="M8.5 3.5v17M11 8h5M11 11h3.5" />
      </>
    ),
  },
  {
    name: "sunrise",
    body: (
      <>
        <path d="M3 17h18M8 20.5h8M7 17a5 5 0 0 1 10 0" />
        <path d="M12 6.5v2M5.2 10.2l1.4 1.4M18.8 10.2l-1.4 1.4" />
      </>
    ),
  },
];

function BehaviouralIcons() {
  return (
    <div className="zbm-kin">
      <span className="zbm-kin-ring" aria-hidden="true" />
      <span className="zbm-kin-halo" aria-hidden="true" />
      <span className="zbm-kin-core" aria-hidden="true">
        <Glyph className="zbm-kin-mark">
          <circle cx="9.5" cy="12" r="5" />
          <circle cx="14.5" cy="12" r="5" />
          <path
            d="M12 7.67a5 5 0 0 1 0 8.66 5 5 0 0 1 0-8.66z"
            fill="currentColor"
            fillOpacity={0.28}
            stroke="none"
          />
        </Glyph>
      </span>
      <ul className="zbm-kin-orbit" aria-hidden="true">
        {BEHAVIOURAL_ICONS.map((glyph, i) => (
          <li key={glyph.name} style={vars({ "--i": i })}>
            <span className="zbm-kin-sat">
              <Glyph>{glyph.body}</Glyph>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Behavioural health design system — a check-in and its kit           */
/* ------------------------------------------------------------------ */

const STILL_SWATCHES = ["Mist", "Sage", "Clay", "Dusk", "Tide"] as const;

function BehaviouralSystem() {
  return (
    <div className="zbm-sw">
      <div className="zbm-sw-checkin">
        <p className="zbm-sw-head">
          <span className="zbm-sw-avatar" aria-hidden="true" />
          <span>Tuesday check-in</span>
          <span className="zbm-sw-time">09:30</span>
        </p>
        <p className="zbm-sw-q">How are you arriving today?</p>
        <div className="zbm-sw-scale" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((step) => (
            <span key={step} className="zbm-sw-step" style={vars({ "--s": step })} />
          ))}
          <span className="zbm-sw-pick" />
        </div>
        <p className="zbm-sw-legend">
          <span>Heavy</span>
          <span>Light</span>
        </p>
        <div className="zbm-sw-breathe">
          <span className="zbm-sw-orb" aria-hidden="true">
            <span />
          </span>
          <span className="zbm-sw-cue">
            <span>Breathe in</span>
            <span>Breathe out</span>
          </span>
          <span className="zbm-sw-count">4 · 4</span>
        </div>
      </div>

      <div className="zbm-sw-kit">
        <ul className="zbm-sw-swatches">
          {STILL_SWATCHES.map((name) => (
            <li key={name} data-swatch={name.toLowerCase()}>
              <span aria-hidden="true" />
              {name}
            </li>
          ))}
        </ul>
        <div className="zbm-sw-type">
          <span className="zbm-sw-aa" aria-hidden="true">
            Aa
          </span>
          <span>
            <span className="zbm-sw-type-name">Calm by default</span>
            <span className="zbm-sw-type-note">Soft type, long leading</span>
          </span>
        </div>
        <div className="zbm-sw-row">
          <span className="zbm-sw-btn">Start session</span>
          <span className="zbm-sw-toggle" aria-hidden="true">
            <span />
          </span>
        </div>
        <div className="zbm-sw-plan">
          <p>
            <span>Care plan</span>
            <span>3 of 5</span>
          </p>
          <span className="zbm-sw-bar" aria-hidden="true">
            <span />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Figma UI kit — a component, labelled part by part                   */
/* ------------------------------------------------------------------ */

const LAYERS = ["Avatar", "Name", "Details", "Allergy"] as const;
const SIZES = ["40 × 40", "104 × 20", "136 × 16", "84 × 24"] as const;
const MODES = ["Light", "Dark", "HC"] as const;
const VARIABLES = [
  { name: "surface", values: ["#FFFFFF", "#151A21", "#FFFFFF"] },
  { name: "ink", values: ["#08110F", "#EDF2F7", "#000000"] },
  { name: "accent", values: ["#0A5D4F", "#6CE7CB", "#00443A"] },
  { name: "rule", values: ["#C3D0CC", "#303B47", "#000000"] },
] as const;

function FigmaKit() {
  return (
    <div className="zbm-an">
      <div className="zbm-an-bar">
        <p className="zbm-an-crumb">
          <span>UI Kit</span>
          <span aria-hidden="true">/</span>
          <span>PatientBanner</span>
        </p>
        <p className="zbm-an-modes" aria-hidden="true">
          <span className="zbm-an-thumb" />
          {MODES.map((mode, m) => (
            <span key={mode} className="zbm-an-mode" style={vars({ "--m": m })}>
              {mode}
            </span>
          ))}
        </p>
      </div>

      <div className="zbm-an-body">
        <div className="zbm-an-layers">
          <p className="zbm-an-heading">Layers</p>
          <ul>
            <li className="zbm-an-root">PatientBanner</li>
            {LAYERS.map((layer, p) => (
              <li key={layer} className="zbm-an-layer" style={vars({ "--p": p })}>
                {layer}
              </li>
            ))}
          </ul>
        </div>

        <div className="zbm-an-canvas">
          <div className="zbm-an-fit">
            <div className="zbm-an-frame" aria-hidden="true">
              <span className="zbm-an-avatar">MO</span>
              <span className="zbm-an-name">Maya Okafor</span>
              <span className="zbm-an-details">34 · she/her · 204118</span>
              <span className="zbm-an-flag">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4 3 19.5h18z" />
                  <path d="M12 10v4.5M12 17v.01" />
                </svg>
                Penicillin
              </span>
            </div>
            <span className="zbm-an-sel" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            {SIZES.map((size, p) => (
              <span
                key={size}
                className="zbm-an-size"
                data-part={p}
                style={vars({ "--p": p })}
                aria-hidden="true"
              >
                {size}
              </span>
            ))}
            {LAYERS.map((layer, p) => (
              <span
                key={layer}
                className="zbm-an-pin"
                data-part={p}
                style={vars({ "--p": p })}
                aria-hidden="true"
              >
                {p + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="zbm-an-vars">
          <p className="zbm-an-heading">Variables</p>
          <ul>
            {VARIABLES.map((variable) => (
              <li key={variable.name} data-var={variable.name}>
                <span className="zbm-an-chip" aria-hidden="true" />
                <span className="zbm-an-var">{variable.name}</span>
                <span className="zbm-an-hex">
                  {variable.values.map((value, m) => (
                    <span key={m} style={vars({ "--m": m })}>
                      {value}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function MarketScene({ scene }: { scene: SceneId }) {
  switch (scene) {
    case "empty-states":
      return <EmptyStates />;
    case "clinical-icons":
      return <ClinicalIcons />;
    case "behavioural-icons":
      return <BehaviouralIcons />;
    case "behavioural-system":
      return <BehaviouralSystem />;
    case "figma-kit":
      return <FigmaKit />;
  }
}
