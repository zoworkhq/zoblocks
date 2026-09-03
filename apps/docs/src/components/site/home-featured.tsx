"use client";

/**
 * The six components the home page argues from.
 *
 * This replaces a twenty-seven cell grid. That grid had a fair claim to being
 * complete and no claim at all to being persuasive: each cell gave a component
 * about 150px of art, which is not enough for a date picker, a copilot or a
 * signature to be anything but a thumbnail — and several were rendering
 * clipped, which is worse than rendering small. A reader who has never met
 * this library needs to believe one component before being offered
 * twenty-seven.
 *
 * So: six, each at a size where the component is legible and operable, with
 * one sentence of claim rather than a paragraph of rationale. The full
 * catalogue is one link away and still lists everything.
 *
 * The six are not arbitrary. They are the components that already carry a
 * full gallery in this repo — the ones with enough states, variants and
 * clinical argument to survive being looked at closely.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CATALOG } from "@/lib/catalog";
import { LoaderShowcase } from "@/components/site/loader-showcase";
import { SignatureDrawing } from "@/components/site/signature-showcase";
import { LiveSwitch } from "@/components/site/switch-gallery";
import { Tabs } from "@oxygenui-design/tabs";
import { Calendar } from "@/registry/oxygen/date-picker/date-picker";
import { plainDate } from "@/lib/oxygen-datetime";
import { cn } from "@/lib/utils";
import { PatientPortrait } from "@/components/site/patient-portrait";
import { facesFor } from "@/lib/faces";
import {
  ChartContextMenu,
  type ChartMenuAction,
  type MenuSubject,
} from "@/registry/oxygen/chart-context-menu/chart-context-menu";

/** Frozen so the demo says the same thing tomorrow. */
const TODAY = plainDate(2026, 8, 26);

interface Featured {
  /** Catalog slug — the href and the install argument both derive from it. */
  slug: string;
  /** Display name. */
  name: string;
  /** The FHIR resource it is typed to, where there is one. */
  resource?: string;
  /**
   * The claim, in one sentence.
   *
   * Deliberately short. The old cards ran to three lines of body copy each and
   * twenty-seven of them read as a wall; the component itself is the argument,
   * and this is the caption under it.
   */
  claim: string;
  /** Three facts, shown as a measured row. Numbers where possible. */
  facts: readonly string[];
  /** The demo. Authored to fill its stage rather than sit in the middle of it. */
  demo: () => React.ReactNode;
  /**
   * Render without the stage frame.
   *
   * Some demos arrive already framed — `LoaderShowcase` ships its own bezel
   * and inner panel — and putting that inside the stage produced three
   * nested borders with the innermost one almost touching the outermost.
   * A frame around a frame is not emphasis, it is noise.
   */
  bare?: boolean;
}

/* ------------------------------------------------------------------ */

/** Synthetic. No real person, no real MRN. */
const WORKLIST: readonly (MenuSubject & { at: string })[] = [
  {
    resource: "Patient",
    id: "pt-3319",
    label: "Aluel Okonkwo",
    detail: "MRN 44-2871 · 34y",
    plural: "patients",
    at: "10:30",
  },
  {
    resource: "Patient",
    id: "pt-3320",
    label: "Chidi Nwosu",
    detail: "MRN 44-9013 · 41y",
    plural: "patients",
    at: "11:00",
  },
  {
    resource: "Patient",
    id: "pt-3321",
    label: "Ama Boateng",
    detail: "MRN 44-7755 · 29y",
    plural: "patients",
    at: "11:30",
  },
];

/*
 * One face each, from the cohort the worklist grid further up this page draws
 * from. A right-click menu whose header claims to be about *this patient* is
 * a weaker claim above three rows that are only text, and the grid two
 * sections above already establishes what a patient row looks like here.
 */
const WORKLIST_FACE = facesFor(WORKLIST.map((person) => person.label));

const WORKLIST_ACTIONS: readonly ChartMenuAction[] = [
  { id: "open", label: "Open chart", tier: "routine", shortcut: "↵" },
  { id: "mrn", label: "Copy MRN", tier: "routine" },
  {
    id: "mine",
    label: "Add to my patients",
    tier: "documented",
    applies: ["Patient"],
    records: "Creates a treatment relationship. It is what scopes your searches.",
  },
  {
    id: "noshow",
    label: "Document a no-show",
    tier: "clinical",
    applies: ["Patient"],
    confirm: "Records a missed appointment on today's encounter.",
    confirmVerb: "Document no-show",
  },
  {
    id: "glass",
    label: "Break-glass open",
    tier: "disclosive",
    applies: ["Patient"],
    reasons: ["Medical emergency", "Covering clinician"],
    availability: { status: "withheld" },
  },
];

const NURSE = { role: "a registered nurse", breakGlass: true } as const;

/**
 * The context menu, opening where a reader can see what it lands on.
 *
 * A pointer crosses the worklist, right-clicks, and the menu blooms with the
 * subject header under the cursor — then does it again on a different patient,
 * so the header visibly changes. That is the whole claim, and it is the one
 * thing a static image cannot make.
 *
 * Three things keep an auto-playing demo from being a nuisance:
 *
 *   `autoFocus={false}`, so the menu renders without taking focus. A reader
 *   mid-page keeps their caret, and a screen reader is not handed a menu
 *   nobody asked for.
 *
 *   It runs only while on screen. An `IntersectionObserver` stops the loop
 *   when the section is scrolled past, so the page is not animating three
 *   viewports away.
 *
 *   `prefers-reduced-motion` gets one menu, open, still. Not a paused
 *   animation — a designed rest state, which is what the loaders in this same
 *   section already promise.
 *
 * The rows are real triggers. Right-click one yourself and you get the real
 * thing, focus and keyboard included.
 */
function ContextMenuDemo() {
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const rowRefs = React.useRef(new Map<string, HTMLDivElement | null>());
  const [stage, setStage] = React.useState<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(0);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);
  const [still, setStill] = React.useState(false);

  React.useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStill(true);
      return undefined;
    }

    const host = stageRef.current;
    if (!host) return undefined;

    let timers: number[] = [];
    let index = 0;
    let running = false;

    const clear = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };

    const beat = () => {
      const row = rowRefs.current.get(WORKLIST[index]!.id);
      const box = host.getBoundingClientRect();
      const rb = row?.getBoundingClientRect();
      if (!row || !rb) return;

      setActive(index);
      setCursor({ x: rb.left - box.left + 132, y: rb.top - box.top + 18 });

      timers.push(
        window.setTimeout(() => {
          /*
           * A real event on a real trigger — the component's own path rather
           * than a back door, so what a reader watches is what a right-click
           * does.
           */
          row.dispatchEvent(
            new MouseEvent("contextmenu", {
              bubbles: true,
              clientX: rb.left + 132,
              clientY: rb.top + 18,
            }),
          );
        }, 700),
      );

      timers.push(
        window.setTimeout(() => {
          // Dismissal listens on the down-event, which is also how a reader closes it.
          document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
          index = (index + 1) % WORKLIST.length;
          timers.push(window.setTimeout(beat, 500));
        }, 3600),
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!running) {
            running = true;
            timers.push(window.setTimeout(beat, 400));
          }
        } else if (running) {
          running = false;
          clear();
          document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(host);

    return () => {
      observer.disconnect();
      clear();
    };
  }, []);

  return (
    /*
     * The portal target is this wrapper, not the rows box.
     *
     * The rows box clips — it has to, or the first and last rows lose their
     * rounded corners — so a menu portalled into it lost everything below the
     * second item, including the withheld count. The wrapper does not clip and
     * carries the room the menu opens into.
     */
    <div
      ref={(node) => {
        stageRef.current = node;
        setStage(node);
      }}
      className="relative w-full pb-64"
      data-ox-menu-stage=""
    >
      <p className="numeric mb-3 text-xs text-graphite-soft">
        {still
          ? "Right-click a row — the menu names it before it offers to change it."
          : "Right-click a row yourself. The header is what the pointer lands on."}
      </p>

      <div className="overflow-hidden rounded-xl border border-rule bg-paper">
        {WORKLIST.map((person, index) => (
          <ChartContextMenu
            key={person.id}
            subject={person}
            actions={WORKLIST_ACTIONS as ChartMenuAction[]}
            policy={NURSE}
            presentation="popup"
            container={stage}
            autoFocus={false}
            now="2026-08-26T10:12:00-04:00"
            onRun={() => {}}
          >
            {(trigger) => (
              <div
                {...trigger}
                ref={(node) => {
                  if (node) rowRefs.current.set(person.id, node);
                  else rowRefs.current.delete(person.id);
                }}
                className={`flex select-none items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  index > 0 ? "border-t border-rule" : ""
                } ${active === index ? "bg-paper-sunk" : ""}`}
              >
                <PatientPortrait src={WORKLIST_FACE(person.label)} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {person.label}
                  </span>
                  <span className="numeric block truncate text-xs text-graphite-soft">
                    {person.detail}
                  </span>
                </span>
                <span className="numeric shrink-0 text-xs text-graphite-soft">{person.at}</span>
              </div>
            )}
          </ChartContextMenu>
        ))}
      </div>

      {cursor && !still ? (
        <span
          aria-hidden="true"
          data-ox-demo-cursor=""
          /* Above `.ox-menu`, which sits at z-index 60. A pointer drawn under
             the thing it just opened is a pointer nobody can see. */
          /* `left-0 top-0` is not decoration: an absolutely positioned element with
             neither offset keeps its *static* position as the origin, so the
             translate started from wherever the span would have flowed — 215px
             below the row it was meant to point at. */
          className="pointer-events-none absolute left-0 top-0 z-[70] transition-transform duration-700 ease-[cubic-bezier(0.5,0,0.2,1)]"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" className="drop-shadow">
            <path
              d="M2 1.5 12.5 8.6 8 9.4l2.3 4.6-1.9.9L6.1 10 3 12.6Z"
              fill="var(--color-paper)"
              stroke="var(--color-ink)"
              strokeWidth="1.2"
            />
          </svg>
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The demos                                                           */
/* ------------------------------------------------------------------ */

/**
 * Tabs, as the thing tabs are actually for.
 *
 * `as="tabs"` rather than a radiogroup: this one has panels, so it is a
 * tablist and announces itself as one.
 */
function TabsDemo() {
  return (
    <Tabs
      as="tabs"
      aria-label="Encounter"
      variant="underline"
      defaultValue="summary"
      items={[
        {
          value: "summary",
          label: "Summary",
          children: (
            <div className="space-y-1.5 text-sm leading-relaxed text-graphite">
              <p>Follow-up, 12 Aug 2026. Reviewed by A. Vance, MD.</p>
              <p>Chief complaint: six weeks of progressive fatigue and dyspnea.</p>
              <p className="text-graphite-soft">Signed 12 Aug, 16:20 +05:30.</p>
            </div>
          ),
        },
        {
          value: "results",
          label: "Results",
          count: 24,
          children: (
            <div className="space-y-1.5 text-sm leading-relaxed text-graphite">
              <p>24 observations. 3 outside the reference range.</p>
              <p>Hgb 7.1 g/dL — low. Potassium 6.8 mmol/L — critical high.</p>
              <p className="text-graphite-soft">Northside Pathology, reporting laboratory.</p>
            </div>
          ),
        },
        {
          value: "meds",
          label: "Medications",
          count: 3,
          children: (
            <div className="space-y-1.5 text-sm leading-relaxed text-graphite">
              <p>Clozapine 300 mg nightly. ANC due 18 Aug.</p>
              <p>Sertraline 100 mg daily. Started 4 Jun.</p>
              <p className="text-graphite-soft">Two entries reconciled at intake.</p>
            </div>
          ),
        },
        {
          value: "audit",
          label: "Audit log",
          children: (
            <div className="space-y-1.5 text-sm leading-relaxed text-graphite">
              <p>41 events. Every read of this record is one of them.</p>
              <p>Last: A. Vance, MD — viewed results, 12 Aug 16:22.</p>
              <p className="text-graphite-soft">Retained for the statutory period.</p>
            </div>
          ),
        },
      ]}
    />
  );
}

/**
/**
 * The reader's motion preference, watched rather than sampled once.
 *
 * Read in an effect so the server and the first client pass agree: starting
 * from `true` flashes the still state on every visit, and reading `matchMedia`
 * during render is a hydration mismatch.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* The date card's demo                                                */
/* ------------------------------------------------------------------ */

/** One beat of the script: find a target, do something to it, then rest. */
interface Beat {
  /** What to aim at. Null when the DOM has moved on, and the beat is skipped. */
  find: (root: HTMLElement) => HTMLElement | null;
  act: "hover" | "press";
  /** Milliseconds to rest after acting. */
  hold: number;
}

const dayNamed = (prefix: string) => (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('[role="gridcell"]')].find((cell) =>
    (cell.getAttribute("aria-label") ?? "").startsWith(prefix),
  ) ?? null;

const actionNamed = (label: string) => (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(".ox-dt-cal__action")].find(
    (button) => button.textContent?.trim() === label,
  ) ?? null;

/**
 * The sequence a person would actually perform.
 *
 * It never presses Done, and that is deliberate rather than an omission: with
 * nothing ever committed, Cancel always returns the panel to empty and the
 * loop closes cleanly. Committing once would leave Cancel restoring the
 * committed range instead of clearing, and the second pass would start from a
 * selection the first one made.
 */
const SCRIPT: Beat[] = [
  { find: actionNamed("Cancel"), act: "press", hold: 520 },
  { find: dayNamed("Monday, August 17"), act: "hover", hold: 340 },
  { find: dayNamed("Monday, August 17"), act: "press", hold: 460 },
  { find: dayNamed("Friday, August 21"), act: "hover", hold: 230 },
  { find: dayNamed("Wednesday, August 26"), act: "hover", hold: 230 },
  { find: dayNamed("Monday, August 31"), act: "hover", hold: 230 },
  { find: dayNamed("Saturday, September 5"), act: "hover", hold: 260 },
  { find: dayNamed("Friday, September 11"), act: "press", hold: 1500 },
];

/**
 * The card's live demo: a range being chosen, by a pointer that is drawn.
 *
 * It drives the shipped component with the events a real pointer produces —
 * `mouseover` for the preview, `click` for the two ends — rather than replaying
 * a recording of it, so if the behaviour it shows ever broke, the demo would
 * break with it. React maps `onMouseEnter` from a bubbling `mouseover`, which
 * is why the hover preview follows.
 *
 * Three rules, in the order they matter. It **stops the moment anybody touches
 * it** — an animation that fights a reader for the control they are trying to
 * try is worse than no animation. It **never starts under
 * `prefers-reduced-motion`**; not slowed, not started. And Pause is a real
 * button, because WCAG 2.2.2 asks that of anything moving for more than five
 * seconds, and a loop is more than five seconds.
 *
 * No rail here: two months with one is 757px against the 638px this card
 * gives, and of the two the cross-boundary preview is the part worth the
 * space — it is the thing a single-month picker cannot do at all.
 */
function DateDemo() {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const cursorRef = React.useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [beat, setBeat] = React.useState(0);
  const [pressed, setPressed] = React.useState(false);
  const reduced = usePrefersReducedMotion();

  // Only once it is actually on screen. A card animating above the fold that
  // nobody has scrolled to is spending attention where there is none.
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setSeen(true)),
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (seen && !reduced) setPlaying(true);
  }, [seen, reduced]);

  React.useEffect(() => {
    if (!playing) return undefined;
    const root = stageRef.current;
    if (!root) return undefined;

    const step = SCRIPT[beat % SCRIPT.length];
    const target = step?.find(root) ?? null;

    // The cursor travels first and the event fires where it landed, so what a
    // reader sees and what the component receives are the same place.
    if (target && cursorRef.current) {
      const base = root.getBoundingClientRect();
      const spot = target.getBoundingClientRect();
      cursorRef.current.style.translate = `${spot.left - base.left + spot.width / 2}px ${
        spot.top - base.top + spot.height / 2
      }px`;
    }

    const travel = 340;
    const fire = setTimeout(() => {
      if (!target) return;
      if (step?.act === "press") {
        setPressed(true);
        setTimeout(() => setPressed(false), 200);
        target.click();
      } else {
        target.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      }
    }, travel);

    const advance = setTimeout(() => setBeat((n) => n + 1), travel + (step?.hold ?? 400));
    return () => {
      clearTimeout(fire);
      clearTimeout(advance);
    };
  }, [playing, beat]);

  return (
    <div className="ox-dt-card">
      <div className="ox-dt-card__bar">
        <button
          type="button"
          className="ox-dt-card__toggle"
          aria-pressed={playing}
          onClick={() => setPlaying((was) => !was)}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <p className="ox-dt-card__say" aria-live="polite">
          {playing ? "Choosing a range — two clicks, with a preview between them." : "Paused."}
        </p>
      </div>

      {/* `pointerdown` rather than `click`, so the handover happens before the
          component sees the press rather than after it. */}
      <div
        ref={stageRef}
        className="ox-dt-card__stage"
        onPointerDown={() => setPlaying(false)}
        onKeyDownCapture={() => setPlaying(false)}
      >
        <Calendar
          mode="range"
          months={2}
          weekStart={1}
          commit="explicit"
          hints
          now={TODAY}
          defaultMonth={{ y: 2026, m: 8 }}
        />
        <span
          ref={cursorRef}
          aria-hidden="true"
          className={cn("ox-dt-card__cursor", pressed && "ox-dt-card__cursor--press")}
          data-ox-hidden={playing ? undefined : "true"}
        />
      </div>
    </div>
  );
}

/**
 * A switch with a third value.
 *
 * `stateLabels="in-effect"` because "on" is not what a precaution is. The
 * commit is asynchronous and can be watched — that is the whole component.
 */
function SwitchDemo() {
  return (
    <div className="grid w-full max-w-md gap-5">
      <LiveSwitch
        label="Contact precautions"
        description="Gown and gloves on entry."
        stateLabels="in-effect"
        size="large"
        checked={true}
      />
      <LiveSwitch
        label="Falls risk"
        description="Adds the bed sensor to the round list."
        stateLabels="in-effect"
        size="large"
        checked={"unknown"}
      />
    </div>
  );
}

/**
 * The signature, drawing itself.
 *
 * `SignatureDrawing` strokes with `currentColor` and sizes to `w-full`, so it
 * needs both a colour and a width from whatever holds it — the signature page
 * gives it `text-panel-fg sm:w-52`. This gave it neither: it inherited a
 * colour that matched the ground and stretched across the full stage, which
 * rendered as an empty box with a single green nib travelling through it.
 *
 * The caption is here because a signature with no context is a squiggle. What
 * makes this component worth anything is the line underneath it.
 */
function SignatureHomeDemo() {
  return (
    <div className="flex flex-col gap-5 text-panel-fg sm:flex-row sm:items-center sm:gap-8">
      <div className="w-56 shrink-0">
        <SignatureDrawing />
      </div>
      <div className="min-w-0 space-y-1.5 text-sm leading-relaxed">
        <p className="text-panel-fg">A. Vance, MD — attending</p>
        <p className="text-panel-muted">
          Signed 12 Aug 2026, 16:20 +05:30, on a note whose text hash is stored beside it.
        </p>
        <p className="numeric text-xs text-panel-muted">Provenance/9f2c · agent · Practitioner/7</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The prop counts, from the catalogue rather than from memory.
 *
 * All four of the ones typed here were wrong: Signature claimed 19 against 22,
 * Context menu 15 against 16, Tabs 22 against 30, Switch 25 against 44. Nobody
 * mistyped them — each was right when the card was written and drifted the
 * next time the component gained a prop, which is the failure the lint rule
 * beside this now catches.
 *
 * `?? 0` rather than a throw: a home page that 500s because a component was
 * renamed is a worse outcome than one fact reading zero, and the catalogue
 * check in CI catches the rename first anyway.
 */
const propCount = (name: string) => CATALOG.find((c) => c.name === name)?.props.length ?? 0;
const variantCount = (name: string) => CATALOG.find((c) => c.name === name)?.variants?.length ?? 0;

/** The loader family, counted rather than remembered. */
const LOADER_COUNT = CATALOG.filter((c) => c.name.endsWith("-loader")).length;

const FEATURED: readonly Featured[] = [
  {
    slug: "signature",
    name: "Signature",
    resource: "Provenance",
    claim:
      "It records what was on screen at the moment of signing, so a countersignature can be defended a year later.",
    facts: [`${propCount("signature")} props`, "Draw, type or certify", "Bound to what was shown"],
    demo: () => <SignatureHomeDemo />,
  },
  {
    slug: "pulse-loader",
    name: "Loaders",
    resource: "—",
    claim:
      "Five waits with different meanings, each with a designed reduced-motion state rather than a spinner that simply stops.",
    facts: [`${LOADER_COUNT} loaders`, "Reduced motion designed", "Announced, not silent"],
    // No caption here. The card's own `claim` above says the same thing in
    // fewer words, and the hero renders this component with its note already —
    // the two together put one 44-word paragraph on the page twice.
    demo: () => <LoaderShowcase caption={false} />,
    bare: true,
  },
  {
    slug: "chart-context-menu",
    name: "Context menu",
    resource: "Patient",
    claim:
      "It names the record before it offers to change it, so the first thing under the pointer is never a verb.",
    facts: [
      `${propCount("chart-context-menu")} props`,
      "4 consequence tiers",
      "Withheld is counted, not hidden",
    ],
    demo: () => <ContextMenuDemo />,
  },
  {
    slug: "tabs",
    name: "Tabs",
    resource: "—",
    claim:
      "Eleven skins over one accessibility tree, so choosing a look is never a choice about whether a keyboard works.",
    // "11 variants" contradicted the catalogue, which records five. The
    // eleven are skins — a CSS choice — and the claim above already says so,
    // so the fact says the thing the catalogue can actually vouch for.
    facts: [`${propCount("tabs")} props`, "Four semantic modes", "APG roving tabindex"],
    demo: () => <TabsDemo />,
  },
  {
    slug: "switch",
    name: "Switch",
    resource: "Flag",
    claim:
      "Three values, not two: on, off, and nobody has said. The commit is visible, reversible, and survives a conflict.",
    facts: [`${propCount("switch")} props`, "Third value: unknown", "Optimistic with rollback"],
    demo: () => <SwitchDemo />,
  },
  {
    slug: "date-picker",
    name: "Date & time",
    resource: "Period",
    claim:
      "One contract behind every temporal control — a range is two clicks with a live preview between them, and nothing reaches your state until Done.",
    facts: [
      `${variantCount("date-picker")} variants`,
      "8 keystrokes, no calendar",
      "Two months, one tab stop",
    ],
    demo: () => <DateDemo />,
  },
];

/* ------------------------------------------------------------------ */

/**
 * One component, given room.
 *
 * The demo leads on every row rather than alternating sides. Alternation
 * reads as a marketing page; a reader comparing six components wants them in
 * the same place each time, which is also why the fact row is in a fixed
 * position rather than flowing under copy of variable length.
 */
function FeaturedRow({ item, index }: { item: Featured; index: number }) {
  return (
    <article
      data-reveal
      data-ox-featured={item.slug}
      className="grid items-center gap-8 border-t border-rule py-12 lg:grid-cols-[1fr_19rem] lg:gap-16 lg:py-20"
    >
      {/*
        The stage.

        `min-h` rather than a fixed height: a loader strip and a copilot are
        genuinely different sizes, and forcing them into one box is how the
        old cards ended up clipping. The floor stops a small component from
        reading as an accident.
      */}
      {/*
        `instrument-demo`, never bare `instrument`.

        Bare `instrument` paints the dark panel ground, and globals.css is
        explicit that it is reserved for deliberate contrast moments — the
        closing CTA is the only other user. A live component inside it renders
        its own light-theme tokens on a near-black field: "Date of service",
        "Start", "End" and "Contact precautions" all came out dark on dark, and
        the signature pad rendered as an empty box. The modifier remaps the
        panel tokens to the page theme, which is the whole reason it exists.

        It also carries its own background, border and radius, so the
        `bg-paper border border-rule rounded-2xl` that used to be here was both
        redundant and part of the fight.

        No minimum height.

        It had `min-h-[16rem]`, and measuring the rendered page showed every
        stage carrying between 130 and 175 pixels of nothing: a tabstrip is 83
        pixels tall and was being centred inside 256. That is the same void
        that made the state browser look unfinished, reintroduced one file
        later. A signature pad and a tabstrip are honestly different heights,
        and the stage should say so — the text column beside it is centred, so
        rows of unequal height still read as a set.
      */}
      <div
        className={
          item.bare
            ? "flex flex-col justify-center"
            : "instrument instrument-demo flex flex-col justify-center p-8 sm:p-10"
        }
        data-ox-stage={item.slug}
      >
        {item.demo()}
      </div>

      <div className="flex flex-col">
        <p className="eyebrow text-graphite">
          <span className="numeric text-oxygen-deep">{String(index + 1).padStart(2, "0")}</span>
          <span className="mx-2 text-rule-strong">/</span>
          {item.name}
        </p>

        {item.resource && item.resource !== "—" ? (
          <p className="numeric mt-2 text-xs text-oxygen-deep">{item.resource}</p>
        ) : null}

        <p className="mt-4 text-pretty text-base leading-relaxed text-ink">{item.claim}</p>

        <ul className="mt-6 space-y-1.5">
          {item.facts.map((fact) => (
            <li key={fact} className="numeric text-xs text-graphite-soft">
              {fact}
            </li>
          ))}
        </ul>

        <Link
          href={`/components/${item.slug}`}
          className="group mt-7 inline-flex items-center gap-2 self-start text-sm font-medium text-ink transition-colors duration-200 hover:text-oxygen-deep"
        >
          View {item.name}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  );
}

export function HomeFeatured({ total }: { total: number }) {
  const rest = Math.max(0, total - FEATURED.length);

  return (
    <section id="components" className="scroll-mt-16 border-t border-rule bg-paper-sunk/50">
      <div className="section-major mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
            The library
          </p>
          {/*
            Derived. It was "Six components", which is a count of the array
            directly below it — the shortest possible distance between a claim
            and the thing that would falsify it.
          */}
          <h2 className="display-lg mt-4 text-balance" data-reveal>
            {FEATURED.length} components, at the size you would actually use them.
          </h2>
          <p className="lede mt-5 max-w-2xl text-pretty" data-reveal>
            Every one below is the real component, running. Operate it — right-click a patient, type
            into the date field, throw the switch. Nothing here is a screenshot.
          </p>
        </div>

        <div className="mt-10">
          {FEATURED.map((item, index) => (
            <FeaturedRow key={item.slug} item={item} index={index} />
          ))}
        </div>

        <div className="border-t border-rule pt-10" data-reveal>
          <Link
            href="/components"
            className="group inline-flex items-center gap-2 rounded-xl border border-rule bg-paper px-5 py-3 text-sm font-medium text-ink transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-oxygen/40"
          >
            {rest > 0 ? `${rest} more components in the catalogue` : "Browse the full catalogue"}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
