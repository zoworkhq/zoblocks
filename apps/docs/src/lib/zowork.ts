/**
 * Zowork, as facts.
 *
 * Zowork is a services company that works only in healthcare, and ZoBlocks is
 * something it makes. The home page and `/pro` both state what follows, and
 * the moment a figure is typed twice it starts drifting on one of them.
 *
 * Every value is from zowork.com, read on 15 September 2026. If one stops
 * matching their site this file is wrong, and the fix is to correct it rather
 * than to soften it into a claim nobody can check.
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

/*
 * `/pro` only.
 *
 * The home page dropped "Built it. Netsmart bought it." on 15 September 2026:
 * Bells.ai is work Zowork did for a client, and the line framed it as a product
 * Zowork owned and sold. The `/pro` desk still carries it. Whether it follows
 * is Rahul's call, and has not been made.
 */
const EXIT: ZoworkProof = { value: "Bells.ai", label: "Built it. Netsmart bought it." };
const DOC_TIME: ZoworkProof = { value: "~50%", label: "Documentation time returned" };
const CHURN: ZoworkProof = { value: "Zero", label: "Clients lost to churn" };

function tenure(now?: Date): ZoworkProof {
  return { value: `${zoworkYears(now)} yrs`, label: "In behavioral health" };
}

/** `/pro`. Tenure leads: a reader who got that far is asking how long Zowork has lasted. */
export function zoworkDeskProof(now?: Date): readonly ZoworkProof[] {
  return [tenure(now), EXIT, DOC_TIME, CHURN];
}

/* -------------------------------------------------------------------------- */

export type ZoworkAccent = "cyan" | "violet" | "mint" | "coral";

export interface ZoworkClient {
  name: string;
  /** The year the engagement began, so tenure is derived rather than typed. */
  since: number;
  /** "built" for delivered work, "builds" for work still running. */
  verb: "builds" | "built";
  /** What Zowork does for them, in zowork.com's words. */
  work: string;
  /** The one published result the tile leads with. */
  result: ZoworkProof;
  accent: ZoworkAccent;
}

/**
 * Zowork's four longest clients.
 *
 * Clients, not partners: Zowork is hired by each of them. zowork.com lists all
 * four as still in production, which is what "zero churn" means here. The
 * order is the home page bento's reading order, and a tuple so the bento can
 * name each position without an undefined check.
 */
export const ZOWORK_CLIENTS = [
  {
    name: "eVisit",
    since: 2019,
    verb: "builds",
    work: "Telehealth platform",
    result: { value: "12M+", label: "encounters nationwide" },
    accent: "violet",
  },
  {
    name: "RemarkableHealth",
    since: 2020,
    verb: "built",
    work: "Bells.ai ambient scribe",
    result: { value: "~50%", label: "documentation time back" },
    accent: "mint",
  },
  {
    name: "Netsmart",
    since: 2017,
    verb: "builds",
    work: "Admin & EHR platform",
    result: { value: "0", label: "incidents, 14-week cutover" },
    accent: "cyan",
  },
  {
    name: "The Change Companies",
    since: 2020,
    verb: "builds",
    work: "Curriculum platform",
    result: { value: "26M+", label: "people reached" },
    accent: "coral",
  },
] as const satisfies readonly ZoworkClient[];

/** How long a client has stayed, derived from the year the work began. */
export function clientYears(client: ZoworkClient, now: Date = new Date()): number {
  return now.getFullYear() - client.since;
}

/** The shortest and longest client tenure, for "6 to 9 years". */
export function zoworkClientTenure(now: Date = new Date()): { min: number; max: number } {
  const years = ZOWORK_CLIENTS.map((client) => clientYears(client, now));
  return { min: Math.min(...years), max: Math.max(...years) };
}

export const ZOWORK_INTEGRATIONS = "50+";

export interface ZoworkService {
  name: string;
  /** Two of the lines zowork.com lists under it. */
  lines: readonly string[];
}

/** What a reader can hire Zowork for — the four services zowork.com sells, in their order. */
export const ZOWORK_SERVICES: readonly ZoworkService[] = [
  {
    name: "AI-native product engineering",
    lines: ["End-to-end product development", "Web · mobile · backend · cloud"],
  },
  {
    name: "Enterprise integration",
    lines: ["FHIR · HL7 · Epic · Cerner", "Legacy modernization, incrementally"],
  },
  {
    name: "Embedded engineering pods",
    lines: ["Senior talent, not benched juniors", "Flexible scale up / scale down"],
  },
  {
    name: "AI governance & adoption",
    lines: ["Compliance-aware AI (HIPAA · SOC 2)", "Eval pipelines for production AI"],
  },
];

export interface ZoworkCaseStudy {
  title: string;
  tags: string;
}

/** zowork.com's healthcare case studies, titled as they publish them. */
export const ZOWORK_CASE_STUDIES: readonly ZoworkCaseStudy[] = [
  {
    title: "Integrated Clinical Intelligence Suite",
    tags: "Virtual scribe · patient monitoring · risk stratification",
  },
  {
    title: "Transforming Clinical Documentation",
    tags: "Clinical AI · medical transcription · HIPAA & audit",
  },
  {
    title: "Standardizing Clinical AI Infrastructure",
    tags: "One generative layer in front of many EHRs",
  },
  { title: "A Conversational Clinical Copilot", tags: "Evidence-grounded clinical documentation" },
  {
    title: "AI-Powered QA in Healthcare",
    tags: "100% requirements traceability · 70% faster reviews",
  },
];

export const ZOWORK_HREF = "https://www.zowork.com/";
export const ZOWORK_CASE_STUDIES_HREF = "https://www.zowork.com/case-studies/";
