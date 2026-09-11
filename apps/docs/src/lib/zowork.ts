/**
 * Zowork, as facts.
 *
 * Two surfaces state them now — the home page and `/pro` — and the moment a
 * figure is typed twice it starts drifting on one of them. Every value below
 * is from zowork.com, read on 11 September 2026. If one stops matching their
 * site this file is wrong, and the fix is to correct it rather than to soften
 * it into a claim nobody can check.
 *
 * Nothing here is positioning. A reader who works in this market can verify
 * every line, which is the only reason to put numbers on a home page at all.
 */

/** The founding year, so "since 2016" and "10 yrs" can never disagree. */
export const ZOWORK_SINCE = 2016;

/** Whole years in the market, derived. Hand-typed, this goes stale in January. */
export function zoworkYears(now: Date = new Date()): number {
  return now.getFullYear() - ZOWORK_SINCE;
}

export interface ZoworkProof {
  value: string;
  label: string;
}

const EXIT: ZoworkProof = { value: "Bells.ai", label: "Built it. Netsmart bought it." };
const DOC_TIME: ZoworkProof = { value: "~50%", label: "Documentation time returned" };
const CHURN: ZoworkProof = { value: "Zero", label: "Clients lost to churn" };
const SCALE: ZoworkProof = { value: "12M+", label: "Telehealth encounters handled" };

/** Derived rather than typed: "10 yrs" is wrong from the next January onwards. */
function tenure(now?: Date): ZoworkProof {
  return { value: `${zoworkYears(now)} yrs`, label: "In behavioral health" };
}

/**
 * Home page. The exit leads, because a reader here has not decided anything
 * yet and an acquisition is the fastest credential to read.
 */
export const ZOWORK_PROOF: readonly ZoworkProof[] = [EXIT, DOC_TIME, CHURN, SCALE];

/**
 * `/pro`. Tenure leads instead: a reader who got that far already knows who
 * wrote the components, and the open question is how long they have lasted.
 */
export function zoworkDeskProof(now?: Date): readonly ZoworkProof[] {
  return [tenure(now), EXIT, DOC_TIME, CHURN];
}

export interface ZoworkTrack {
  /** The track name as Zowork group them. */
  name: string;
  services: readonly string[];
}

/**
 * The service list, as names.
 *
 * It shipped with each line carrying the outcome Zowork publish beside it —
 * "up to 2× ship velocity", "8–12 wks to first user". Rahul cut them: a
 * second line under every name doubled the block's height and turned a list
 * you can take in at a glance into something you have to read.
 *
 * The numbers are not lost, they are in the wrong place. The four that decide
 * anything are already above this, in `ZOWORK_PROOF`, at a size that reads.
 * Per-service figures belong on zowork.com, which is one click away.
 */
export const ZOWORK_TRACKS: readonly ZoworkTrack[] = [
  {
    name: "Engineering",
    services: [
      "Feature development",
      "End-to-end product",
      "AI-assisted migration",
      "Architecture & performance",
    ],
  },
  {
    name: "Infrastructure",
    services: ["AI-driven QA", "Custom agents", "Self-hosted CI/CD"],
  },
  {
    name: "Adoption",
    services: ["Tooling setup", "Adoption measurement", "Team training"],
  },
  {
    name: "Advisory",
    services: [
      "AI strategy & roadmap",
      "Architecture review",
      "Discovery workshop",
      "Compliance mapping",
    ],
  },
];

/**
 * Anchor tenure, as a range rather than as four bars.
 *
 * Zowork publish the count and the span, not which partnership is which
 * length. Drawing four bars would mean inventing three of the four numbers,
 * so the rail draws the band they actually state.
 */
export const ZOWORK_ANCHORS = {
  count: 4,
  minYears: 7,
  maxYears: 9,
  /** Named on zowork.com. Listed, not logo-walled — we are citing, not claiming. */
  names: ["The Change Companies", "eVisit", "Remarkable Health", "Netsmart"],
} as const;

export const ZOWORK_HREF = "https://www.zowork.com/";
export const ZOWORK_CASE_STUDIES_HREF = "https://www.zowork.com/case-studies/";
