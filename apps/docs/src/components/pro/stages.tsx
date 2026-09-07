/**
 * Ten glances.
 *
 * A glance is a small stage that runs one transformation on a loop. Not a
 * video, not a screenshot, not a GIF: markup, so it themes with the page,
 * scales without artefacts, respects reduced motion, and costs bytes rather
 * than megabytes to say one thing.
 *
 * The reason it is markup rather than a screen recording is worth stating,
 * because a recording is the obvious choice: a recording is fixed to one
 * theme, one viewport and one moment of the interface, so it starts lying the
 * first time a button moves. On a page whose argument is "we do not ship
 * promises", a stale video is the worst possible detail to be caught on.
 *
 * Each stage names the file whose behaviour it claims, so a stage describing a
 * gate that has since moved is findable by grep rather than by someone
 * noticing.
 */

const RAMP = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const RAMP_L = [0.96, 0.92, 0.84, 0.73, 0.6, 0.52, 0.45, 0.37, 0.29, 0.2, 0.14] as const;

/** One brand colour, eleven derived steps, anchored so 600 stays yours. */
export function StageRamp() {
  return (
    <div style={{ width: "100%" }}>
      <p className="sLabel" style={{ marginBottom: 8 }}>
        One colour → eleven steps
      </p>
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 52 }}>
        {RAMP.map((step, i) => {
          const seed = step === 600;
          return (
            <span
              key={step}
              className={`rampStep${seed ? " rampSeed" : ""}`}
              style={{
                ["--i" as string]: i,
                flex: 1,
                height: seed ? 52 : 34,
                borderRadius: 3,
                transformOrigin: "bottom",
                background: `color-mix(in srgb, var(--site-brand) ${Math.round((RAMP_L[i] ?? 0.5) * 100)}%, var(--site-paper))`,
                ...(seed ? { outline: "1.5px solid var(--site-ink)", outlineOffset: 1 } : {}),
              }}
            />
          );
        })}
      </div>
      <div
        className="sMono"
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: "var(--site-graphite-soft)",
          marginTop: 7,
        }}
      >
        <span>50</span>
        <span style={{ color: "var(--site-ink)", fontWeight: 700 }}>600 · yours</span>
        <span>950</span>
      </div>
    </div>
  );
}

/** Contrast falls below the floor and the publish locks. */
export function StageGate() {
  return (
    <div style={{ width: "100%" }}>
      <div
        className="sMono"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          fontSize: 10.5,
        }}
      >
        <span style={{ color: "var(--site-graphite)" }}>contrast</span>
        <span className="gateNum" style={{ fontWeight: 700, color: "var(--norm)" }}>
          floor 4.5:1
        </span>
      </div>
      <div
        style={{
          height: 7,
          borderRadius: 4,
          background: "var(--site-rule)",
          overflow: "hidden",
          marginTop: 7,
        }}
      >
        <i
          className="gateFill"
          style={{
            display: "block",
            height: "100%",
            width: "78%",
            background: "var(--norm)",
            borderRadius: 4,
          }}
        />
      </div>
      <div
        className="gateWhy"
        style={{
          marginTop: 9,
          fontSize: 10.5,
          padding: "6px 9px",
          borderRadius: 7,
          background: "var(--crit-bg)",
          color: "var(--crit)",
        }}
      >
        refused before it can ship
      </div>
      <div style={{ marginTop: 10, textAlign: "right" }}>
        <span className="btnFake gateBtn" style={{ fontSize: 10 }}>
          Publish
        </span>
      </div>
    </div>
  );
}

/** Draft becomes a pinned, immutable version with a public URL. */
export function StagePin() {
  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <div style={{ position: "relative", height: 30 }}>
        <span
          className="chip pinDraft"
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
        >
          draft
        </span>
        <span
          className="pinVer sMono"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--site-accent-text)",
          }}
        >
          @7
        </span>
      </div>
      <div
        className="pinUrl sMono"
        style={{
          marginTop: 12,
          fontSize: 10,
          color: "var(--site-graphite)",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        /t/northwind/clinical@7.css
      </div>
      <div style={{ marginTop: 9, fontSize: 10, color: "var(--site-graphite-soft)" }}>
        immutable · public · no credentials
      </div>
    </div>
  );
}

/** A palette cycled through three colour-vision simulations. */
export function StageVision() {
  const swatches = ["var(--crit)", "var(--high)", "var(--low)", "var(--norm)", "var(--site-brand)"];
  return (
    <div style={{ width: "100%" }}>
      <p className="sLabel" style={{ marginBottom: 9 }}>
        Colour vision
      </p>
      <div className="cvRow" style={{ display: "flex", gap: 5 }}>
        {swatches.map((c) => (
          <span key={c} style={{ flex: 1, height: 38, borderRadius: 5, background: c }} />
        ))}
      </div>
      <p
        className="sMono"
        style={{ fontSize: 9, color: "var(--site-graphite-soft)", marginTop: 8 }}
      >
        normal → protanopia → deuteranopia → tritanopia
      </p>
    </div>
  );
}

const VERSIONS = [
  ["@7", "live"],
  ["@6", ""],
  ["@5", "restore"],
  ["@4", ""],
] as const;

/** Immutable versions, one of them restored. */
export function StageHistory() {
  return (
    <div style={{ width: "100%" }}>
      {VERSIONS.map(([v, state], i) => (
        <div
          key={v}
          className={`hRow${state === "restore" ? " restore" : ""}`}
          style={{
            ["--i" as string]: i,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 8px",
            borderRadius: 6,
            fontSize: 11,
            borderBottom: "1px solid color-mix(in srgb, var(--site-rule) 60%, transparent)",
          }}
        >
          <span className="sMono" style={{ fontWeight: 600 }}>
            {v}
          </span>
          {state === "live" ? (
            <span className="chip" style={{ color: "var(--norm)", borderColor: "var(--norm)" }}>
              live
            </span>
          ) : state === "restore" ? (
            <span
              className="chip"
              style={{ color: "var(--site-accent-text)", borderColor: "var(--site-accent-text)" }}
            >
              restore →
            </span>
          ) : (
            <span style={{ color: "var(--site-graphite-soft)", fontSize: 10 }}>archived</span>
          )}
        </div>
      ))}
      <p style={{ fontSize: 10, color: "var(--site-graphite-soft)", marginTop: 8 }}>
        restoring publishes it again
      </p>
    </div>
  );
}

/** The same component wearing three host design languages. */
export function StageBridge() {
  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <p className="sMono" style={{ fontSize: 10, color: "var(--site-graphite-soft)" }}>
        one component, three hosts
      </p>
      <div style={{ marginTop: 14 }}>
        <span
          className="bridgeBtn"
          style={{
            display: "inline-block",
            padding: "8px 18px",
            background: "var(--site-cta)",
            color: "var(--site-paper)",
            fontSize: 12,
            fontWeight: 560,
          }}
        >
          Admit patient
        </span>
      </div>
      <p style={{ marginTop: 14, fontSize: 10, color: "var(--site-graphite-soft)" }}>
        Ant Design · MUI · neither
      </p>
    </div>
  );
}

/** A token travelling out to Figma and back. */
export function StageFigma() {
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <span className="chip" style={{ width: 74, textAlign: "center" }}>
          Figma
        </span>
        <span style={{ flex: 1, position: "relative", height: 16 }}>
          <span
            style={{
              position: "absolute",
              top: 7,
              left: 0,
              right: 0,
              height: 1,
              background: "var(--site-rule-strong)",
            }}
          />
          <span
            className="ftok"
            style={{
              position: "absolute",
              top: 2,
              left: 0,
              width: 12,
              height: 12,
              borderRadius: 3,
              background: "var(--site-brand)",
            }}
          />
        </span>
        <span className="chip" style={{ width: 74, textAlign: "center" }}>
          Console
        </span>
      </div>
      <p
        className="sMono"
        style={{
          fontSize: 9.5,
          color: "var(--site-graphite-soft)",
          marginTop: 12,
          textAlign: "center",
        }}
      >
        /api/v1/themes · scoped bearer token
      </p>
    </div>
  );
}

/** Twelve capabilities, granted per role. */
export function StageRoles() {
  return (
    <div style={{ width: "100%" }}>
      <p className="sLabel" style={{ marginBottom: 8 }}>
        Capabilities, not job titles
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="capDot"
            style={{
              ["--i" as string]: i,
              height: 16,
              borderRadius: 4,
              background:
                i < 8
                  ? "color-mix(in srgb, var(--site-brand) 55%, transparent)"
                  : "var(--site-rule)",
            }}
          />
        ))}
      </div>
      <p
        className="sMono"
        style={{ fontSize: 9.5, color: "var(--site-graphite-soft)", marginTop: 9 }}
      >
        editor · 8 of 12 · an administrator decides
      </p>
    </div>
  );
}

/** Rows tightening through three densities. */
export function StageDensity() {
  return (
    <div style={{ width: "100%" }}>
      <p className="sLabel" style={{ marginBottom: 9 }}>
        Density
      </p>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="dRow"
          style={{
            height: 20,
            borderBottom: "1px solid var(--site-rule)",
            display: "flex",
            alignItems: "center",
            padding: "0 6px",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              height: 5,
              width: "60%",
              borderRadius: 3,
              background: "color-mix(in srgb, var(--site-graphite) 35%, transparent)",
            }}
          />
        </div>
      ))}
      <p
        className="sMono"
        style={{ fontSize: 9.5, color: "var(--site-graphite-soft)", marginTop: 8 }}
      >
        patient → standard → clinical
      </p>
    </div>
  );
}

/** A pack bought once and installed. */
export function StageMarket() {
  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      <svg
        width="42"
        height="42"
        viewBox="0 0 24 24"
        fill="none"
        style={{ marginBottom: 8 }}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="var(--site-rule-strong)" strokeWidth="1.5" />
        <path
          className="mkTick"
          d="M7.5 12.4l3 3 6-6.4"
          stroke="var(--site-brand)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="22"
          strokeDashoffset="22"
        />
      </svg>
      <div style={{ fontSize: 11.5, fontWeight: 560 }}>Empty-state system</div>
      <div className="mkState" style={{ fontSize: 10, color: "var(--norm)", marginTop: 3 }}>
        installed · licensed to the organisation
      </div>
    </div>
  );
}

/**
 * The colour-vision matrices, mounted once.
 *
 * SVG filters are referenced by id, so they must exist exactly once in the
 * document however many stages use them.
 */
export function VisionFilters() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="oxp-prot">
          <feColorMatrix
            type="matrix"
            values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"
          />
        </filter>
        <filter id="oxp-deut">
          <feColorMatrix
            type="matrix"
            values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"
          />
        </filter>
        <filter id="oxp-trit">
          <feColorMatrix
            type="matrix"
            values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
