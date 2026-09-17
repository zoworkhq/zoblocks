"use client";

import Image from "next/image";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  ZOWORK_CASE_STUDIES_HREF,
  ZOWORK_CLIENTS,
  ZOWORK_HREF,
  ZOWORK_INTEGRATIONS,
  ZOWORK_SERVICES,
  ZOWORK_SINCE,
  clientYears,
  zoworkClientTenure,
  zoworkYears,
  type ZoworkClient,
} from "@/lib/zowork";

/**
 * Two halves: Zowork on the left, what it does and for whom on the right.
 *
 * The left tile is the orb, three numbers and the way to hire Zowork. The
 * right tile is the pitch — four services — and one card that rotates through
 * the clients and the work Zowork does for each, Netsmart first and longest.
 * The orb's ring takes the colour of the client on show, so the two halves
 * read as one piece.
 *
 * The rotation stops while a pointer or focus is on the card, has a visible
 * pause (WCAG 2.2.2: it moves for longer than five seconds), stops off screen,
 * and never starts under `prefers-reduced-motion`.
 */

const WORDMARK = { src: "/brand/zowork-wordmark-white.png", width: 701, height: 133 };

/** Netsmart stays up longer: it is the client the section most wants seen. */
const DWELL_MS = { lead: 7000, rest: 4500 };

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
      { rootMargin: "80px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

export function ZoworkHalves() {
  const [index, setIndex] = useState(0);
  const active: ZoworkClient = ZOWORK_CLIENTS[index] ?? ZOWORK_CLIENTS[0];
  const tenure = zoworkClientTenure();

  return (
    <div className="zwhGrid">
      <div className="zwpTile zwhLeft" data-accent={active.accent} data-reveal>
        <div className="zwpHub">
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
            className="zwpWordmark"
            unoptimized
          />
          <p className="zwpHubLine">Healthcare engineering services</p>
        </div>

        <dl className="zwhStats">
          <div>
            <dt>{zoworkYears()}+</dt>
            <dd>years in healthcare</dd>
          </div>
          <div>
            <dt>{ZOWORK_INTEGRATIONS}</dt>
            <dd>EHR integrations</dd>
          </div>
          <div>
            <dt>0</dt>
            <dd>clients lost</dd>
          </div>
        </dl>

        <div className="zwhActions">
          <a className="zwpBtn" href={ZOWORK_HREF} rel="noopener">
            Book a consultation
            <ArrowRight aria-hidden="true" className="zwpBtnIcon" />
          </a>
          <a className="zwpOutline" href={ZOWORK_CASE_STUDIES_HREF} rel="noopener">
            See case studies
            <ArrowUpRight aria-hidden="true" className="zwpGhostIcon" />
          </a>
        </div>
      </div>

      <div
        className="zwpTile zwhRight"
        data-accent="violet"
        data-reveal
        style={{ "--reveal-delay": "80ms" } as CSSProperties}
      >
        <p className="zwpByline">
          <span className="zwpDisc" aria-hidden="true">
            <span className="zwpGlyph" />
          </span>
          ZoBlocks is made by Zowork
        </p>
        <h2 id="zwp-title" className="zwpTitle">
          Healthcare expertise, <span className="zwpWarm">on your team.</span>
        </h2>

        <ul className="zwhServices" aria-label="Services">
          {ZOWORK_SERVICES.map((service) => (
            <li key={service.name} data-accent={service.accent}>
              <i aria-hidden="true" />
              <span>
                <b>{service.name}</b>
                <small>{service.line}</small>
              </span>
            </li>
          ))}
        </ul>

        <ClientRotator index={index} onIndex={setIndex} maxYears={tenure.max} />
      </div>
    </div>
  );
}

function ClientRotator({
  index,
  onIndex,
  maxYears,
}: {
  index: number;
  onIndex: (next: number) => void;
  maxYears: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  // Bumped whenever the rotation may resume, so the bar restarts with the timer.
  const [epoch, setEpoch] = useState(0);
  const release = () => {
    setHeld(false);
    setEpoch((e) => e + 1);
  };
  const running = !reduced && !paused && !held && inView;
  const count = ZOWORK_CLIENTS.length;
  const dwell = index === 0 ? DWELL_MS.lead : DWELL_MS.rest;

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => onIndex((index + 1) % count), dwell);
    return () => window.clearTimeout(timer);
  }, [running, index, dwell, count, onIndex]);

  return (
    <div
      ref={ref}
      className="zwhClients"
      data-accent={ZOWORK_CLIENTS[index]?.accent}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={release}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) release();
      }}
    >
      <div className="zwhClientsTop">
        <h3 className="zwpEyebrow">Clients and work</h3>
        <div className="zwhControls">
          {/* One segment per client; the active one fills for as long as it stays up. */}
          {ZOWORK_CLIENTS.map((client, i) => (
            <button
              key={client.name}
              type="button"
              className="zwhSeg"
              aria-label={`Show ${client.name}`}
              aria-pressed={i === index}
              data-state={i === index ? "on" : i < index ? "done" : undefined}
              onClick={() => onIndex(i)}
            >
              {/*
                Re-keyed on resume, never on pause: a pause happens as the
                pointer arrives, and swapping this element out between
                pointerdown and pointerup makes the browser drop the click.
              */}
              <i
                key={`${index}-${i}-${epoch}`}
                style={
                  {
                    "--zwh-dwell": `${dwell}ms`,
                    animationPlayState: running ? "running" : "paused",
                  } as CSSProperties
                }
              />
            </button>
          ))}
          {!reduced && (
            <button
              type="button"
              className="zwhPause"
              aria-label={paused ? "Play client rotation" : "Pause client rotation"}
              onClick={() => {
                setPaused((p) => !p);
                setEpoch((e) => e + 1);
              }}
            >
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      <ul className="zwhStage">
        {ZOWORK_CLIENTS.map((client, i) => {
          const years = clientYears(client);
          const on = i === index;
          return (
            <li
              key={client.name}
              data-accent={client.accent}
              data-on={on || undefined}
              aria-hidden={on ? undefined : true}
              inert={!on}
            >
              <div className="zwhClientHead">
                <p className="zwhClientName">{client.name}</p>
                <span className="zwhSince">since {client.since}</span>
              </div>
              <div className="zwhFlow" aria-hidden="true">
                <span>Zowork {client.verb}</span>
                <span className="zwhPipe">
                  <i />
                </span>
                <span className="zwhWork">{client.work}</span>
              </div>
              <div className="zwhClientFoot">
                <p className="zwhResult">
                  <strong>{client.result.value}</strong>
                  <span>{client.result.label}</span>
                </p>
                <p
                  className="zwhTenure"
                  style={{ "--zwh-share": years / maxYears } as CSSProperties}
                >
                  <span>{years} yrs</span>
                  <i aria-hidden="true" />
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
