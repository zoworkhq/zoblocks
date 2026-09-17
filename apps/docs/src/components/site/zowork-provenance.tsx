"use client";

import Image from "next/image";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ZOWORK_CASE_STUDIES,
  ZOWORK_CASE_STUDIES_HREF,
  ZOWORK_CLIENTS,
  ZOWORK_HREF,
  ZOWORK_INTEGRATIONS,
  ZOWORK_SERVICES,
  ZOWORK_SINCE,
  clientYears,
  zoworkClientTenure,
  zoworkYears,
  type ZoworkAccent,
  type ZoworkClient,
} from "@/lib/zowork";

/**
 * Provenance: Zowork as the hub, its clients as the spokes.
 *
 * Every spoke is a named client with what Zowork built for it, how long it has
 * stayed and one published result. The small screen inside each tile shows the
 * kind of system — a call, a scribe, an EHR sync, a curriculum — and is
 * labelled as an illustration under the section.
 *
 * Wires run from the hub to the four clients only, beneath solid tiles, so
 * they show in the gaps and never across a tile's text.
 *
 * Motion runs only while the bento is on screen and never under
 * `prefers-reduced-motion`; at rest every tile shows its finished state.
 */

const WORDMARK = { src: "/brand/zowork-wordmark-white.png", width: 701, height: 133 };

const CREDENTIALS: { label: string; held?: boolean }[] = [
  { label: "HIPAA", held: true },
  { label: "SOC 2", held: true },
  { label: "FHIR" },
  { label: "HL7" },
  { label: "Epic" },
  { label: "Cerner" },
];

const SERVICE_ACCENTS: ZoworkAccent[] = ["cyan", "violet", "mint", "coral"];

const pad = (n: number) => String(n).padStart(2, "0");

/* -------------------------------------------------------------------------- */

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );
}

function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      {
        rootMargin: "120px",
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

/** A counter that advances every `ms` while `running`, and holds still otherwise. */
function useTick(ms: number, running: boolean): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [ms, running]);
  return tick;
}

/* -------------------------------------------------------------------------- */

type Wire = { key: string; d: string; accent: string };

export function ZoworkProvenance() {
  const bentoRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const reduced = useReducedMotion();
  const inView = useInView(bentoRef);
  const live = inView && !reduced;

  const [active, setActive] = useState<ZoworkClient | null>(null);
  const [wires, setWires] = useState<{ w: number; h: number; list: Wire[] }>({
    w: 0,
    h: 0,
    list: [],
  });

  /*
   * The wires are measured, not drawn to a fixed grid: the bento reflows from
   * three columns to two to one, and a tile's reveal moves it 14px while it
   * fades in. Re-measured on resize and after any transition settles, and only
   * committed when a path actually changed.
   */
  useEffect(() => {
    const bento = bentoRef.current;
    const hub = hubRef.current;
    if (!bento || !hub) return;
    let frame = 0;
    let last = "";

    const measure = () => {
      frame = 0;
      const b = bento.getBoundingClientRect();
      const h = hub.getBoundingClientRect();
      const hx = h.left - b.left + h.width / 2;
      const hy = h.top - b.top + h.height / 2;
      const list: Wire[] = [];
      nodes.current.forEach((el, key) => {
        const r = el.getBoundingClientRect();
        const tx = r.left - b.left + r.width / 2;
        const ty = r.top - b.top + r.height / 2;
        const cx = (hx + tx) / 2 + (ty - hy) * 0.18;
        const cy = (hy + ty) / 2 - (tx - hx) * 0.18;
        list.push({
          key,
          d: `M${hx.toFixed(0)} ${hy.toFixed(0)} Q${cx.toFixed(0)} ${cy.toFixed(0)} ${tx.toFixed(0)} ${ty.toFixed(0)}`,
          accent: el.dataset.accent ?? "cyan",
        });
      });
      const signature = `${b.width.toFixed(0)}x${b.height.toFixed(0)}|${list.map((w) => w.d).join("|")}`;
      if (signature === last) return;
      last = signature;
      setWires({ w: Math.round(b.width), h: Math.round(b.height), list });
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    schedule();
    const resize = new ResizeObserver(schedule);
    resize.observe(bento);
    bento.addEventListener("transitionend", schedule);
    return () => {
      resize.disconnect();
      bento.removeEventListener("transitionend", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const node = (key: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(key, el);
    else nodes.current.delete(key);
  };

  // The cursor spotlight: one listener for the whole bento rather than one per tile.
  const spotlight = (event: PointerEvent<HTMLDivElement>) => {
    const tile = (event.target as HTMLElement).closest<HTMLElement>(".zwpTile");
    if (!tile) return;
    const rect = tile.getBoundingClientRect();
    tile.style.setProperty("--zwp-mx", `${event.clientX - rect.left}px`);
    tile.style.setProperty("--zwp-my", `${event.clientY - rect.top}px`);
  };

  const years = zoworkYears();
  const tenure = zoworkClientTenure();
  const [netsmart, evisit, remarkable, change] = ZOWORK_CLIENTS;

  const client = (c: ZoworkClient, delay: number, screen: ReactNode) => (
    <ClientTile
      client={c}
      delay={delay}
      nodeRef={node(c.name)}
      onEnter={() => setActive(c)}
      onLeave={() => setActive(null)}
    >
      {screen}
    </ClientTile>
  );

  return (
    <div ref={bentoRef} className="zwpBento" onPointerMove={spotlight}>
      {wires.w > 0 && (
        <svg className="zwpWires" viewBox={`0 0 ${wires.w} ${wires.h}`} aria-hidden="true">
          {wires.list.map((wire) => (
            <path
              key={wire.key}
              d={wire.d}
              className={active?.name === wire.key ? "is-lit" : undefined}
              style={{ "--zwp-acc": `var(--zwp-${wire.accent})` } as CSSProperties}
            />
          ))}
          {live &&
            wires.list.map((wire, i) => (
              <circle
                key={`pulse-${wire.key}`}
                r="2.8"
                className="zwpPulse"
                style={{ "--zwp-acc": `var(--zwp-${wire.accent})` } as CSSProperties}
              >
                <animateMotion
                  dur={`${(2.6 + i * 0.3).toFixed(1)}s`}
                  begin={`${(i * 0.4).toFixed(1)}s`}
                  repeatCount="indefinite"
                  path={wire.d}
                />
              </circle>
            ))}
        </svg>
      )}

      <div className="zwpTile zwpHead" data-accent="brand" data-reveal>
        <p className="zwpByline">
          <span className="zwpDisc" aria-hidden="true">
            <span className="zwpGlyph" />
          </span>
          ZoBlocks is made by Zowork
        </p>
        <h2 id="zwp-title" className="zwpTitle">
          {/*
            Who built it, not where it came from. "Came out of Zowork's work for
            healthcare clients" read as if the components were lifted from
            client projects. The chip above already names Zowork, so this says
            what Zowork is.
          */}
          Built by the engineering team <span className="zwpWarm">healthcare companies hire.</span>
        </h2>
        <div className="zwpHeadFoot">
          <p className="zwpLede">
            Zowork engineers software for healthcare companies. {netsmart.name} has been a client
            for {clientYears(netsmart)} years.
          </p>
          <ul className="zwpCreds" aria-label="Credentials">
            {CREDENTIALS.map(({ label, held }) => (
              <li key={label}>
                {held && <Check aria-hidden="true" className="zwpCredIcon" />}
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {client(netsmart, 80, <EhrSync live={live} />)}
      {client(remarkable, 0, <ScribeNote live={live} />)}

      <div
        ref={hubRef}
        className="zwpTile zwpHub"
        data-accent={active?.accent ?? "cyan"}
        data-reveal
        style={{ "--reveal-delay": "80ms" } as CSSProperties}
      >
        <div className="zwpOrbit" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <defs>
              <path
                id="zwp-orbit-path"
                d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0"
              />
            </defs>
            <text>
              <textPath href="#zwp-orbit-path" textLength="535" lengthAdjust="spacing">
                {`HEALTHCARE ENGINEERING · SINCE ${ZOWORK_SINCE} · ${ZOWORK_CLIENTS.length} LONG-TERM CLIENTS · ZERO CHURN · HIPAA · SOC 2 ·`}
              </textPath>
            </text>
          </svg>
          <span className="zwpCore">
            <span className="zwpGlyph" />
          </span>
        </div>
        <Image
          src={WORDMARK.src}
          alt="Zowork"
          width={WORDMARK.width}
          height={WORDMARK.height}
          className="zwpWordmark zwpWordmark--hub"
          unoptimized
        />
        <p className="zwpHubLine">
          {active
            ? `${active.name} · client ${clientYears(active)} yrs`
            : "Healthcare engineering services"}
        </p>
      </div>

      {client(evisit, 160, <TelehealthCall live={live} />)}
      {client(change, 0, <Curriculum live={live} />)}

      <div
        className="zwpTile zwpProof"
        data-accent="live"
        data-reveal
        style={{ "--reveal-delay": "80ms" } as CSSProperties}
      >
        {/*
          One statement, read the way the client tiles read "0 incidents". It
          was "Zero" on the left and a green live dot beside "Clients lost" on
          the right: two halves a row apart, and a status colour that means
          "running" set against the word "lost".
        */}
        <p className="zwpEyebrow">Client retention</p>
        <p className="zwpProofLine">
          <strong className="zwpBig">0</strong>
          <span>clients lost</span>
        </p>
        <ul className="zwpStill" aria-label="Still clients">
          {ZOWORK_CLIENTS.map((c) => (
            <li key={c.name}>
              <span>{c.name}</span>
              <span className="zwpStillSince">
                <i className="zwpDot" aria-hidden="true" />
                since {c.since}
              </span>
            </li>
          ))}
        </ul>
        <dl className="zwpMinis">
          <div>
            <dt>{years}+</dt>
            <dd>years in healthcare</dd>
          </div>
          <div>
            <dt>{ZOWORK_INTEGRATIONS}</dt>
            <dd>EHR integrations</dd>
          </div>
          <div>
            <dt>
              {tenure.min}&ndash;{tenure.max}
            </dt>
            <dd>years per client</dd>
          </div>
        </dl>
      </div>

      <div
        className="zwpTile zwpCta"
        data-accent="brand"
        data-reveal
        style={{ "--reveal-delay": "160ms" } as CSSProperties}
      >
        <div className="zwpCtaTop">
          <Image
            src={WORDMARK.src}
            alt="Zowork"
            width={WORDMARK.width}
            height={WORDMARK.height}
            className="zwpWordmark zwpWordmark--cta"
            unoptimized
          />
          {/* Zowork's own promise, the same line the `/premium` desk carries. */}
          <p className="zwpCtaReply">
            <i className="zwpDot" aria-hidden="true" />
            Usually replies within a business day
          </p>
        </div>
        <p className="zwpCtaLine">Talk to the team behind ZoBlocks.</p>
        <div className="zwpActions zwpActions--stack">
          <a className="zwpBtn zwpBtn--block" href={ZOWORK_HREF} rel="noopener">
            Book a consultation
            <ArrowRight aria-hidden="true" className="zwpBtnIcon" />
          </a>
          <a className="zwpOutline" href={ZOWORK_CASE_STUDIES_HREF} rel="noopener">
            See case studies
            <ArrowUpRight aria-hidden="true" className="zwpGhostIcon" />
          </a>
        </div>
      </div>

      <div className="zwpTile zwpServicesTile" data-accent="violet" data-reveal>
        <div className="zwpServicesMain">
          <div className="zwpRow">
            <h3 className="zwpEyebrow">Hire Zowork for</h3>
            <a className="zwpGhost zwpGhost--small" href={ZOWORK_HREF} rel="noopener">
              All services
              <ArrowUpRight aria-hidden="true" className="zwpGhostIcon" />
            </a>
          </div>
          <ul className="zwpServices">
            {ZOWORK_SERVICES.map((service, i) => (
              <li key={service.name} className="zwpService" data-accent={SERVICE_ACCENTS[i]}>
                <span className="zwpServiceIndex">{pad(i + 1)}</span>
                <span className="zwpServiceName">{service.name}</span>
                <ul>
                  {service.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <div className="zwpCasesCol">
          <h3 className="zwpEyebrow">Healthcare case studies</h3>
          <CaseStudies live={live} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ClientTile({
  client,
  delay,
  nodeRef,
  onEnter,
  onLeave,
  children,
}: {
  client: ZoworkClient;
  delay: number;
  nodeRef: (el: HTMLElement | null) => void;
  onEnter: () => void;
  onLeave: () => void;
  children: ReactNode;
}) {
  const years = clientYears(client);
  const longest = years === zoworkClientTenure().max;
  return (
    <article
      ref={nodeRef}
      className="zwpTile zwpClient"
      data-accent={client.accent}
      data-reveal
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <header className="zwpClientHead">
        <h3 className="zwpClientName">{client.name}</h3>
        {/* The years sit once, in the footer, beside their bar. */}
        <span className="zwpChip">{longest ? "Longest client" : "Client"}</span>
      </header>
      <p className="zwpBuilt">
        Zowork {client.verb} · {client.work}
      </p>
      <div className="zwpScreen" aria-hidden="true">
        {children}
      </div>
      <p className="zwpFoot">
        <strong className="zwpFootValue">{client.result.value}</strong>
        <span className="zwpFootLabel">{client.result.label}</span>
        <span className="zwpTenure" style={{ "--zwp-years": years } as CSSProperties}>
          {years} yrs · since {client.since}
          {longest && " · still shipping"}
          <i aria-hidden="true" />
        </span>
      </p>
    </article>
  );
}

/* ---- the four illustrated screens ---------------------------------------- */

function TelehealthCall({ live }: { live: boolean }) {
  const tick = useTick(1000, live);
  const seconds = 12 * 60 + 4 + tick;
  const speaker = Math.floor(tick / 3) % 2;
  return (
    <div className="zwpCall">
      <span className="zwpCallLive">
        <i className="zwpDot zwpDot--rec" />
        In session{" "}
        <span className="tabular-nums">
          {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
        </span>
      </span>
      {["Clinician", "Patient"].map((who, i) => (
        <div key={who} className="zwpCallPane" data-speaking={i === speaker || undefined}>
          <span className="zwpCallAvatar">{i ? "PT" : "DR"}</span>
          <span className="zwpCallTag">{who}</span>
          <span className="zwpCallMic">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      ))}
    </div>
  );
}

const SCRIBE_LINE = "Better since we changed the dose.";

function ScribeNote({ live }: { live: boolean }) {
  const [typed, setTyped] = useState(SCRIBE_LINE.length);

  useEffect(() => {
    if (!live) return;
    let count = 0;
    let timer = 0;
    const step = () => {
      count += 1;
      setTyped(count);
      timer = window.setTimeout(
        count < SCRIBE_LINE.length ? step : restart,
        count < SCRIBE_LINE.length ? 42 : 4600,
      );
    };
    const restart = () => {
      count = 0;
      setTyped(0);
      timer = window.setTimeout(step, 400);
    };
    timer = window.setTimeout(restart, 600);
    return () => window.clearTimeout(timer);
  }, [live]);

  const shown = live ? typed : SCRIBE_LINE.length;
  const drafted = shown >= SCRIBE_LINE.length;
  return (
    <div className="zwpScribe">
      <p className="zwpScribeLine">
        <span className="zwpScribeWho">Clinician</span>
        <span className="zwpScribeSaid zwpScribeSaid--quiet">How has sleep been this week?</span>
      </p>
      <p className="zwpScribeLine">
        <span className="zwpScribeWho">Patient</span>
        <span className="zwpScribeSaid">
          {SCRIBE_LINE.slice(0, shown)}
          <i className="zwpCaret" />
        </span>
      </p>
      {/* While the line is still being heard the note shows that, not a gap. */}
      <div className="zwpScribeNote" data-drafted={drafted || undefined}>
        <span>{drafted ? "Drafted note · Subjective" : "Listening…"}</span>
        <b>
          {drafted ? "Reports improved sleep after dose change." : <i className="zwpSkeleton" />}
        </b>
      </div>
    </div>
  );
}

const SYSTEMS = ["Epic", "Cerner", "Athena"];

function EhrSync({ live }: { live: boolean }) {
  const tick = useTick(700, live);
  const phase = tick % (SYSTEMS.length * 2);
  const syncing = live && phase % 2 === 0 ? phase / 2 : -1;
  return (
    <div className="zwpEhr">
      <pre className="zwpFhir">
        {"{ "}
        <span className="zwpFhirKey">{'"resourceType"'}</span>
        {": "}
        <span className="zwpFhirValue">{'"Encounter"'}</span>
        {",\n  "}
        <span className="zwpFhirKey">{'"status"'}</span>
        {": "}
        <span className="zwpFhirValue">{'"finished"'}</span>
        {" }"}
      </pre>
      <div className="zwpSystems">
        {SYSTEMS.map((system, i) => (
          <div key={system} className="zwpSystem">
            <span>{system}</span>
            <em data-syncing={i === syncing || undefined}>
              {i === syncing ? "syncing…" : "✓ synced"}
            </em>
          </div>
        ))}
      </div>
    </div>
  );
}

const MODULES = [
  "Understanding triggers",
  "Building support",
  "Coping skills",
  "Relapse prevention",
];

function Curriculum({ live }: { live: boolean }) {
  const tick = useTick(2400, live);
  const current = (2 + tick) % MODULES.length;
  return (
    <div className="zwpCourse">
      <div className="zwpCourseHead">
        <span>Recovery curriculum</span>
        <span className="zwpCourseStep">Module {current + 2} of 12</span>
      </div>
      <div className="zwpCourseBar">
        <i style={{ width: `${((current + 1) / 12) * 100}%` }} />
      </div>
      <ol className="zwpCourseList">
        {MODULES.map((module, i) => (
          <li key={module} data-state={i < current ? "done" : i === current ? "now" : undefined}>
            {module}
          </li>
        ))}
      </ol>
    </div>
  );
}

function CaseStudies({ live }: { live: boolean }) {
  const tick = useTick(2800, live);
  const current = tick % ZOWORK_CASE_STUDIES.length;
  return (
    <ol className="zwpCases">
      {ZOWORK_CASE_STUDIES.map((study, i) => (
        <li key={study.title} data-active={i === current || undefined}>
          <span className="zwpCaseIndex">{pad(i + 1)}</span>
          <span className="zwpCaseBody">
            <span className="zwpCaseTitle">{study.title}</span>
            <span className="zwpCaseTags">{study.tags}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
