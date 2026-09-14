/**
 * Crisis detection, deterministic and ahead of the model.
 *
 * Three design rules, each of which exists because shipped products have failed
 * at it in ways that made the news.
 *
 * **The classifier runs before the model, not after.** If the model generates
 * an answer and a filter inspects it, the crisis path depends on the model
 * having behaved. It must not.
 *
 * **The answer is replaced, not annotated.** Appending a hotline number to an
 * otherwise helpful answer produces something people scroll past. Evaluations
 * have found safety banners disappearing entirely once unrelated clinical
 * content is added to the same message; the failure mode is dilution, and
 * replacement is the only reliable defence.
 *
 * **The whole thread is evaluated, not the latest message.** Guardrail decay
 * across long conversations is measured and substantial — one longitudinal
 * analysis found medical disclaimers falling from 26% of responses in 2022 to
 * under 1% by 2025. A classifier that only sees the last turn inherits that
 * decay.
 *
 * ---
 *
 * The hard part is not detection. It is **who is speaking about whom.**
 *
 * Copilot is clinician-facing, so the overwhelming majority of text mentioning
 * suicide is clinical documentation, not disclosure: "patient denies suicidal
 * ideation", "history of overdose 2019", "C-SSRS negative". A classifier that
 * fires on keywords turns the product into a machine that refuses to discuss
 * psychiatry, which is both useless and, in a behavioral health deployment,
 * actively harmful — it teaches clinicians to route around it.
 *
 * So the classifier resolves three things separately: whether risk language is
 * present, who it refers to (the user, or a third party they are documenting),
 * and whether it is negated or historical. Only the combination decides.
 */

/* ------------------------------------------------------------------ */
/* Verdict                                                             */
/* ------------------------------------------------------------------ */

export type CrisisSeverity =
  /** No risk language, or risk language that is negated or historical. */
  | "none"
  /** Risk language about a third party, present tense. Blocks; routes to protocol. */
  | "clinical-risk"
  /** First-person ideation without stated means or timing. Blocks. */
  | "ideation"
  /** First-person ideation with means, plan, timing, or a farewell. Blocks. */
  | "imminent";

/** Who the risk language is about. Drives which copy and which escalation shows. */
export type CrisisAudience = "user" | "third-party";

export interface CrisisVerdict {
  readonly severity: CrisisSeverity;
  readonly audience: CrisisAudience;
  /**
   * Which rules fired, by name. Names, never the matched text — an audit log
   * is not a place to duplicate a disclosure, and a rule name is enough to
   * debug a false positive.
   */
  readonly rules: readonly string[];
  /** True for anything that must replace the answer rather than annotate it. */
  readonly blocking: boolean;
}

export const NO_CRISIS: CrisisVerdict = {
  severity: "none",
  audience: "user",
  rules: [],
  blocking: false,
};

/* ------------------------------------------------------------------ */
/* Patterns                                                            */
/* ------------------------------------------------------------------ */

interface Rule {
  readonly name: string;
  readonly pattern: RegExp;
}

/** Present-tense first-person ideation. */
const IDEATION: readonly Rule[] = [
  {
    name: "ideation.kill-self",
    pattern:
      /\bi\s+(?:want|need|am going|plan|intend)\s+to\s+(?:kill|end)\s+(?:myself|my\s+life)\b/i,
  },
  { name: "ideation.kill-self-bare", pattern: /\bkill(?:ing)?\s+myself\b/i },
  { name: "ideation.end-life", pattern: /\bend(?:ing)?\s+(?:my\s+life|it\s+all)\b/i },
  {
    name: "ideation.want-to-die",
    pattern: /\bi\s+(?:want|wish)\s+(?:to\s+die|i\s+(?:was|were)\s+dead)\b/i,
  },
  { name: "ideation.suicidal", pattern: /\bi(?:'m|\s+am)\s+(?:feeling\s+)?suicidal\b/i },
  {
    name: "ideation.no-point-living",
    pattern: /\b(?:no\s+point|no\s+reason)\s+(?:in\s+)?(?:living|going\s+on)\b/i,
  },
  {
    name: "ideation.better-off-dead",
    pattern: /\b(?:i(?:'d|\s+would)\s+be\s+better\s+off\s+dead|better\s+off\s+without\s+me)\b/i,
  },
  {
    name: "ideation.self-harm",
    pattern: /\bi\s+(?:want|need)\s+to\s+(?:hurt|harm|cut)\s+myself\b/i,
  },
  {
    // Passive ideation, spoken by the user.
    name: "ideation.passive",
    pattern:
      /\bi\s+(?:wish|hope)\s+(?:that\s+)?i\s+(?:would\s*n['’]?t|wo\s*n['’]?t|did\s*n['’]?t|would\s+not|will\s+not|would\s+never|never|could\s+(?:just\s+)?(?:go\s+to\s+sleep\s+and\s+)?(?:not|never))\s+wake\s+up\b|\b(?:my\s+life|i\s+(?:feel|think)\s+(?:like\s+|that\s+)?(?:my\s+)?life)\s+(?:is\s+not|isn['’]?t|is\s+no\s+longer)\s+worth\s+living\b|\bi\s+(?:have|get|feel)\s+(?:a\s+)?(?:passive\s+)?death\s+wish\b/i,
  },
];

/** Means, plan, timing or farewell — the escalation from ideation to imminent. */
const IMMINENCE: readonly Rule[] = [
  {
    name: "imminent.means-held",
    pattern:
      /\bi\s+(?:have|got|bought|saved\s+up)\s+(?:the\s+)?(?:pills|tablets|a\s+gun|a\s+rope|a\s+knife|enough\s+\w+)\b/i,
  },
  {
    name: "imminent.tonight",
    pattern: /\b(?:tonight|today|right\s+now|in\s+an?\s+hour|this\s+evening)\b/i,
  },
  { name: "imminent.plan", pattern: /\bi\s+(?:have|made)\s+a\s+plan\b/i },
  {
    name: "imminent.farewell",
    pattern:
      /\b(?:goodbye|this\s+is\s+my\s+last|thank\s+you\s+for\s+everything|won'?t\s+be\s+here\s+tomorrow)\b/i,
  },
  { name: "imminent.in-progress", pattern: /\bi\s+(?:have|just)\s+(?:taken|swallowed)\s+/i },
];

/** "Overdose" as an act, not a care term: "overdose precautions" is not one. */
const OVERDOSE =
  "(?:overdose|od)\\b(?!\\s+(?:history|precautions?|risk|prevention|management|protocol|pathway|advice|education|kit|guidance|nomogram|assessment)\\b)";
const ANY_SELF = "(?:him|her|them)sel(?:f|ves)";
const OWN_LIFE = "(?:his|her|their)\\s+(?:own\\s+)?life";

/* Lethal means and acts, shared by first-person, third-party and history. */
const MEDS =
  "(?:pills|tablets|meds|medications?|medicines?|drugs|paracetamol|acetaminophen|insulin|opioids?|painkillers|antidepressants)";
/** "Stockpiling pills", "saving up her tablets". */
const STOCKPILE = `(?:stockpil(?:e|es|ed|ing)|hoard(?:s|ed|ing)?|sav(?:e|es|ed|ing)\\s+up|stash(?:es|ed|ing)?)\\s+(?:\\w+\\s+){0,3}?${MEDS}\\b|\\bstockpile\\s+of\\s+(?:\\w+\\s+){0,2}?${MEDS}\\b`;
const POISON =
  "(?:bleach|anti-?freeze|ethylene\\s+glycol|methanol|screen\\s*wash|weed\\s*killer|paraquat|pesticides?|insecticides?|rat\\s+poison|poison|drain\\s+cleaner|caustic\\s+soda|cyanide)";
/** A poison taken as an act. "Bleach the bench" has no ingestion; accidents are not self-harm. */
const INGESTED = `(?<!\\baccidentally\\s+)(?:ingest(?:ed|ing)|drank|drunk|drinking|swallow(?:ed|ing)|consum(?:ed|ing)|took|taken|taking)\\s+(?:(?:some|a|an|the|household|neat|undiluted|bottle|cup|glass|mouthful|capful|of|\\d+\\s*ml)\\s+){0,4}${POISON}\\b`;
/** A jump from height or in front of traffic. "Jumped off the bus" is neither. */
const JUMP = `jump(?:s|ed|ing)?\\s+(?:off|from)\\s+(?:(?:a|an|the|his|her|their|my)\\s+)?(?:\\w+\\s+)?(?:bridge|building|roof(?:top)?|cliff|balcony|window|car\\s+park|multi-?storey|tower|overpass|flyover|ledge)\\b|jump(?:s|ed|ing)?\\s+(?:in\\s+front\\s+of|under)\\s+(?:(?:a|an|the)\\s+)?(?:\\w+\\s+)?(?:train|tube|bus|lorry|truck|car|traffic|vehicle)\\b`;
/** A noose held or prepared. "Noose knot" is sailing. */
const NOOSE =
  "(?:has|had|have|got|made|making|tied|tying|bought|keeps?|kept|hid|hidden|prepared)\\s+(?:a\\s+|the\\s+)?noose\\b(?!\\s+knots?\\b)|\\b(?:noose|ligature)\\s+(?:a?round|on)\\s+(?:his|her|their|the|my)\\s+neck\\b";
const HANGING =
  "found\\s+(?:\\w+\\s+)?(?:hanging|hanged)\\b(?!\\s+(?:around|about|out|over|up|baskets?)\\b)";
/** Old scars are history, not an act. */
const SELF_INFLICTED = "self[-\\s]?inflicted\\b(?!\\s+(?:\\w+\\s+)?scars?\\b)";
/** "Wishes she wouldn't wake up", "wishes he could go to sleep and not wake up". */
const WAKE =
  "(?:wish(?:es|ed|ing)?|hop(?:es|ed|ing))\\s+(?:that\\s+)?(?:(?:s?he|they)\\s+(?:would|could|will|wo|did|does)(?:\\s*n['’]?t|\\s+not|\\s+never)|(?:s?he|they)\\s+(?:could|would)\\s+(?:just\\s+)?(?:go\\s+to\\s+sleep|fall\\s+asleep)\\s+and\\s+(?:not|never)|(?:to\\s+)?(?:not|never)(?:\\s+to)?)\\s+wake\\s+up\\b";
/** Passive ideation. "Life insurance not worth it" has no life that is not worth living. */
const PASSIVE = `(?:passive\\s+(?:death\\s+wish(?:es)?|suicidal\\s+(?:ideation|thoughts)|si)\\b|death\\s+wish(?:es)?\\b|life\\s+(?:is\\s+not|isn['’]?t|is\\s+no\\s+longer|was\\s+not|wasn['’]?t)\\s+worth\\s+(?:living|it)\\b|not\\s+worth\\s+living\\b(?!\\s+(?:in|at|near|with|there)\\b)|${WAKE})`;

/** A first-person act already done. Imminent with or without stated ideation. */
const ACT: readonly Rule[] = [
  {
    name: "imminent.overdose-taken",
    pattern: new RegExp(
      `\\bi(?:['’]ve|\\s+have)?\\s+(?:just\\s+)?(?:took|taken|swallowed)\\s+(?:an?\\s+)?(?:\\w+\\s+)?${OVERDOSE}|\\bi(?:['’]ve|\\s+have)?\\s+(?:just\\s+)?overdosed\\b`,
      "i",
    ),
  },
  {
    name: "imminent.attempt",
    pattern:
      /\bi(?:['’]ve|\s+have)?\s+(?:just\s+)?(?:tried|attempted)\s+(?:to\s+(?:kill|end|hang)\s+(?:myself|my\s+life)|suicide)\b/i,
  },
  {
    // "I cut myself" alone stays clear: clinicians cut themselves at work.
    // Intent or repetition makes it self-harm.
    name: "imminent.self-harm",
    pattern:
      /\bi(?:['’]ve|\s+have)\s+been\s+(?:cutting|burning|harming)\s+myself\b(?!\s+(?:off|out|some|slack|short|free|loose)\b)|\bi(?:['’]ve|\s+have)?\s+(?:just\s+)?(?:cut|burn(?:ed|t)|hurt|harmed)\s+myself\s+(?:on\s+purpose|deliberately|intentionally)\b|\bi(?:['’]ve|\s+have)?\s+(?:deliberately|intentionally|purposely)\s+(?:cut|burn(?:ed|t)|hurt|harmed)\s+myself\b|\bi(?:['’]ve|\s+have)?\s+(?:been\s+)?self[-\s]?harm(?:ed|ing)\b/i,
  },
  {
    // Lethal means held or used: "I drank bleach", "I have a noose".
    name: "imminent.lethal-means",
    pattern: new RegExp(
      `\\bi(?:['’]ve|\\s+have|['’]m|\\s+am)?\\s+(?:just\\s+|been\\s+|going\\s+to\\s+|about\\s+to\\s+|gonna\\s+)?(?:${JUMP}|${INGESTED}|${STOCKPILE}|${NOOSE})`,
      "i",
    ),
  },
];

/**
 * Third-party references. Clinical documentation, or a clinician asking about a
 * patient who is at risk right now.
 */
const THIRD_PARTY: readonly Rule[] = [
  {
    name: "third.patient",
    pattern:
      /\b(?:the\s+)?(?:patient|client|pt|service\s+user|he|she|they)\s+(?:is|are|was|were|has|have|had|reports?|endorses?|expresses?|disclosed?|admits?|says?|said)\b/i,
  },
  {
    // Anyone else at risk: "the patient's mother is suicidal".
    name: "third.other",
    pattern:
      /\b(?:mother|father|mum|mom|dad|parent|son|daughter|child|brother|sister|partner|husband|wife|spouse|boyfriend|girlfriend|friend|carer|caregiver|relative|colleague|resident|someone|somebody|person|man|woman)\s+(?:is|are|was|were|has|have|had|reports?|says?|said)\b/i,
  },
  { name: "third.possessive", pattern: /\bmy\s+(?:patient|client|service\s+user)\b/i },
  {
    // Note shorthand drops the verb: "pt suicidal", "patient currently SI".
    name: "third.terse",
    pattern:
      /\b(?:patient|client|pt|service\s+user)\s+(?:(?:currently|now|still|actively|remains|appears|seems|feels|feeling)\s+)?(?:suicidal|si\b|self[-\s]?harming)/i,
  },
];

/** Risk language attached to a third party rather than the speaker. */
const THIRD_PARTY_RISK: readonly Rule[] = [
  {
    name: "third.risk-si",
    // Bare "od" is once-daily prescribing shorthand ("ramipril 5 mg od"), so it
    // counts only in an overdose context: "took an OD", "OD'd", "suspected od".
    pattern:
      /\b(?:suicidal|si\b|self[-\s]?harm|overdose|took\s+an?\s+overdose|(?:an?|suspected|intentional|deliberate|possible|recent|post)\s+od\b|od['’]d\b)/i,
  },
  {
    name: "third.risk-plan",
    pattern:
      /\b(?:has\s+a\s+plan|means\s+and\s+intent|actively\s+suicidal|at\s+imminent\s+risk)\b/i,
  },
];

/** Targets a risk level can attach to: "risk of suicide", "danger to others". */
const RISK_OF =
  "(?:suicide|suicidal\\s+\\w+|self[-\\s]?harm\\w*|overdose|homicide|violence|harm(?:ing)?\\s+(?:to\\s+)?(?:self|others|him\\w*|her\\w*|them\\w*))";
/** Recent past: hours, days, weeks or months. Years and life stages are history. */
const RECENTLY =
  "(?:yesterday|overnight|recently|earlier\\s+today|last\\s+(?:night|week|weekend|month)|(?:this|last)\\s+(?:morning|afternoon|evening)|(?:\\d+|an?|one|two|three|four|five|six|few|couple\\s+of|several)\\s+(?:hours?|days?|nights?|weeks?|months?)\\s+ago|(?:in|over|during)\\s+the\\s+(?:past|last)\\s+(?:\\d+\\s+|few\\s+|couple\\s+of\\s+)?(?:hours?|days?|weeks?|months?))";

/**
 * Risk that needs no subject. Notes drop it ("hx of SI, now actively
 * suicidal", "took an overdose 2 hours ago"), and these phrases are events or
 * assessments, never lookups.
 */
const UNSUBJECTED_RISK: readonly Rule[] = [
  {
    name: "third.current-state",
    pattern:
      /\b(?:actively|currently|now|still|acutely)\s+(?:suicidal|homicidal|self[-\s]?harming)\b/i,
  },
  {
    name: "third.overdose-taken",
    pattern: new RegExp(
      `\\b(?:took|taken|taking|ingested|swallowed|attempted)\\s+(?:an?\\s+)?(?:\\w+\\s+)?${OVERDOSE}|\\boverdosed\\b`,
      "i",
    ),
  },
  {
    name: "third.attempt",
    pattern: new RegExp(
      `\\b(?:attempted\\s+suicide|suicid(?:e|al)\\s+attempt|(?:tried|trying|attempted|attempting)\\s+to\\s+(?:(?:kill|hang|harm|hurt|cut|strangle|drown)\\s+${ANY_SELF}|end\\s+${OWN_LIFE}))`,
      "i",
    ),
  },
  {
    name: "third.ideation",
    pattern: new RegExp(
      `\\b(?:wants?|wanted|wanting|wish(?:es|ed|ing)?|needs?|plans?|planned|planning|intends?|intending|going|threaten(?:s|ed|ing)?|thinking\\s+(?:about|of)|thoughts?\\s+(?:of|about)|talk(?:s|ed|ing)?\\s+about|urges?)\\s+(?:to\\s+)?(?:(?:kill(?:ing)?|harm(?:ing)?|hurt(?:ing)?|cut(?:ting)?|hang(?:ing)?)\\s+${ANY_SELF}|end(?:ing)?\\s+${OWN_LIFE})` +
        // "Going to die" is prognosis, so dying takes a wish, not a future.
        `|\\b(?:wants?|wanted|wanting|wish(?:es|ed|ing)?|thinking\\s+(?:about|of)|thoughts?\\s+(?:of|about)|talk(?:s|ed|ing)?\\s+about|urges?)\\s+(?:to\\s+)?(?:die|be\\s+dead|dying|death|suicide|self[-\\s]?harm(?:ing)?)\\b(?!\\s+(?:prevention|risk|assessment|awareness|screening|rates?|statistics|policy|protocol|training)\\b)`,
      "i",
    ),
  },
  {
    name: "third.self-harm-act",
    pattern: new RegExp(
      `\\b(?:cutting|burning|harming|hurting|scratching|hitting|strangling|hanging|cut|burned|burnt|harmed|hanged)\\s+${ANY_SELF}|\\bself[-\\s]?harmed\\b`,
      "i",
    ),
  },
  {
    // "Cannot rule out" leaves the risk open.
    name: "third.not-excluded",
    pattern:
      /\b(?:cannot|can['’]?t|can\s+not|could\s+not|couldn['’]?t|unable\s+to|not\s+able\s+to|impossible\s+to|difficult\s+to|hard\s+to)\s+(?:be\s+)?(?:fully\s+|completely\s+|confidently\s+|reliably\s+)?(?:rule\s+out|ruled\s+out|exclude|excluded)\s+(?:\w+\s+){0,2}?(?:suicid\w*|self[-\s]?harm\w*|si\b|hi\b|overdose|intent|homicid\w*|risk)|\b(?:suicid\w*|self[-\s]?harm\w*|si|hi|overdose|homicid\w*|intent)\s+(?:\w+\s+){0,2}?(?:cannot|can['’]?t|could\s+not|couldn['’]?t|not|has\s+not|have\s+not|hasn['’]?t)\s+(?:be(?:en)?\s+)?(?:ruled\s+out|excluded)\b/i,
  },
  {
    name: "third.at-risk",
    pattern: new RegExp(
      `\\b(?:at\\s+(?!(?:low|lower|minimal|no|negligible|little)\\b)(?:\\w+\\s+)?|(?:high|very\\s+high|significant|serious|considerable|imminent|immediate|acute|moderate)\\s+)risk\\s+(?:of|for|to)\\s+(?:\\w+\\s+)?${RISK_OF}` +
        `|\\b(?:suicide|suicidal|self[-\\s]?harm|overdose|homicide|violence)\\s+risk\\s+(?:is\\s+|remains\\s+)?(?:high|very\\s+high|significant|serious|imminent|acute|moderate|elevated|raised)\\b` +
        `|\\b(?:high|significant|serious|imminent|acute|moderate|elevated|raised)\\s+(?:suicide|suicidal|self[-\\s]?harm|overdose|homicide|violence)\\s+risk\\b`,
      "i",
    ),
  },
  { name: "third.homicidal", pattern: /\bhomicidal\b/i },
  {
    name: "third.harm-others",
    pattern:
      /\b(?:wants?|wanted|wanting|wish(?:es|ed|ing)?|plans?|planned|planning|intends?|intended|intending|threaten(?:s|ed|ing)?|thoughts?\s+(?:of|about)|thinking\s+(?:about|of)|talk(?:s|ed|ing)?\s+about|urges?|tried|trying|attempted)\s+(?:to\s+)?(?:kill(?:ing)?|harm(?:ing)?|hurt(?:ing)?|murder(?:ing)?|stab(?:bing)?|shoot(?:ing)?|strangl(?:e|ing))\s+(?!(?:him|her|them|my|your|our|it)sel(?:f|ves)\b)\w+|(?<!\b(?:low|no|minimal|nil|not|not\s+an?)\s+)\b(?:danger|threat)\s+to\s+(?:self\s+(?:and|or)\s+)?others\b/i,
  },
  {
    // "Endorses HI toward neighbour" drops the subject too.
    name: "third.endorses",
    pattern:
      /\b(?:endors(?:es?|ed|ing)|report(?:s|ed|ing)?|express(?:es|ed|ing)?|voic(?:es?|ed|ing)|admit(?:s|ted|ting)?|disclos(?:es?|ed|ing)|positive\s+for)\s+(?:(?:active|passive|current|ongoing|new|recent|intermittent|fleeting|some)\s+)?(?:si|hi|suicidal\s+ideation|homicidal\s+ideation)\b|\bhi\s+(?:towards?|against|directed\s+(?:at|towards?))\b/i,
  },
  {
    name: "third.lethal-act",
    pattern: new RegExp(`\\b(?:${JUMP}|${INGESTED}|${HANGING})|\\b${SELF_INFLICTED}`, "i"),
  },
  { name: "third.lethal-means", pattern: new RegExp(`\\b(?:${STOCKPILE}|${NOOSE})`, "i") },
  { name: "third.passive", pattern: new RegExp(`\\b${PASSIVE}`, "i") },
  {
    name: "third.recent",
    pattern: new RegExp(
      `\\b(?:suicidal|self[-\\s]?harm(?:ed|ing)?|overdos(?:e|ed)|od['’]d|suicide\\s+attempt|attempted\\s+suicide|homicidal)\\s+(?:\\w+\\s+){0,3}?${RECENTLY}\\b`,
      "i",
    ),
  },
];

/**
 * Negation and history. Documentation, not disclosure.
 *
 * These are why the classifier is usable in psychiatry at all. "Denies SI",
 * "no current ideation", "C-SSRS negative", "history of" — a tool that treated
 * those as crises would be unusable on a psychiatric ward, which is exactly
 * where it needs to work.
 *
 * A negation cancels the phrase it covers and nothing else. "I want to kill
 * myself, no plan yet" is a disclosure with a negated plan, not documentation.
 */
const NEGATION: readonly Rule[] = [
  {
    name: "negated.first-person",
    pattern:
      /\bi\s+(?:don['’]?t|do\s+not|never)\s+(?:want|need|plan|intend)\s+to\s+(?:kill|end|hurt|harm|cut)\s+(?:myself|my\s+life)\b/i,
  },
  {
    name: "negated.denies",
    // The filler never crosses "and"/"but"/"since", so "not eating and is
    // suicidal" negates nothing. "not" never negates a denial ("not denying
    // SI"), a doubt ("not sure if suicidal") or a persistence ("not stopped").
    // "Rule out" after "cannot" or "unable to" leaves the risk open.
    pattern:
      /\b(?:denies|denied|no\s+current|no\s+longer|nil|negative\s+for|(?<!\b(?:cannot|can['’]?t|can\s+not|could\s+not|couldn['’]?t|unable\s+to|not\s+able\s+to|impossible\s+to|difficult\s+to|hard\s+to|not(?:\s+been)?)\s+(?:be\s+)?(?:fully\s+|completely\s+)?)(?:rules?\s+out|ruled\s+out)|without|not(?!\s+(?:deny|denies|denying|denied|rule|ruled|stop|stopped|stopping|ceased|sure|certain|clear|known|able|safe|excluded|only|just)\b)|isn['’]?t|aren['’]?t)\s+(?:(?!(?:and|but|since|after|because|then|following|before|when|while|until)\b)\w+\s+){0,3}?(?:suicidal|suicide|homicidal|ideation|si\b|hi\b|self[-\s]?harm|overdos\w*|intent|plan|attempts?\b)/i,
  },
  {
    name: "negated.no-si",
    pattern:
      /\bno\s+(?:active\s+|passive\s+)?(?:suicidal\s+ideation|homicidal\s+ideation|suicid(?:e|al)\s+attempts?|attempts?|si|hi|self[-\s]?harm|homicidal|intent|plan)\b/i,
  },
  {
    // "Denies passive death wish", "no evidence of self-inflicted injury",
    // "denies stockpiling medication". The filler is a closed vocabulary.
    name: "negated.means",
    pattern: new RegExp(
      `\\b(?:denies|denied|denying|nil|no|not|never|without|doesn['’]?t|does\\s+not|didn['’]?t|did\\s+not|negative\\s+for|isn['’]?t|wasn['’]?t)\\s+(?:(?:any|current|active|passive|recent|evidence|signs?|suggestion|history|of|for|that|to|a|an|the|having|feel(?:s|ing)?|feelings?|thoughts?|plans?|intent(?:ions?)?|urges?|want(?:s|ing)?|been|be|likely)\\s+){0,4}(?:self[-\\s]?inflicted|noose|ligature|jump(?:s|ed|ing)?|stockpil\\w*|hoard\\w*|sav(?:e|es|ed|ing)\\s+up|stash\\w*|ingest\\w*|drank|drink\\w*|swallow\\w*|${PASSIVE})`,
      "i",
    ),
  },
  {
    // "No thoughts of self-harm", "denies taking an overdose", "does not want
    // to harm others". The filler is a closed vocabulary, so "without warning
    // tried to kill himself" negates nothing.
    name: "negated.intent",
    pattern:
      /\b(?:denies|denied|denying|nil|negative\s+for|without|no|not|never|doesn['’]?t|does\s+not|didn['’]?t|did\s+not|don['’]?t|do\s+not)\s+(?:(?:any|current|active|passive|recent|further|having|want(?:s|ing)?|wish(?:es|ing)?|intend(?:s|ing)?|plan(?:s|ning)?|thoughts?|ideas?|urges?|intent(?:ions?)?|desire|take|taken|took|taking|an?|of|about|to)\s+){1,4}(?:kill(?:ing)?|end(?:ing)?|harm(?:ing)?|hurt(?:ing)?|cut(?:ting)?|murder(?:ing)?|die|dying|death|suicide|self[-\s]?harm(?:ing)?|overdos(?:e|ing)|od)\b/i,
  },
  {
    name: "negated.low-risk",
    pattern:
      /\b(?:not|nil|no|low|lower|minimal|negligible)\s+(?:at\s+)?(?:\w+\s+)?risk\s+(?:of|for|to)\s+(?:\w+\s+)?(?:suicide|self[-\s]?harm\w*|overdose|homicide|violence|harm|others)\b/i,
  },
  {
    name: "negated.contracts",
    pattern: /\b(?:contracts?\s+for\s+safety|safety\s+plan\s+in\s+place|able\s+to\s+contract)\b/i,
  },
  {
    name: "negated.screening",
    pattern:
      /\b(?:c-?ssrs|phq-?9\s+item\s+9|asq|columbia\s+protocol)\s+(?:negative|screen(?:ed)?\s+negative|low\s+risk)\b/i,
  },
];

/**
 * History, masked like negation: it dates the phrase it qualifies and nothing
 * else. "History of SI, now actively suicidal" is current risk.
 */
const PRESENT =
  "(?:now|currently|current|today|tonight|presently|actively|active|ongoing|still|again|this\\s+(?:morning|afternoon|evening|week)|is|are|am|remains?|reports?|endorses?|expresses?|presents?|admits?)";
/** A term history can date. Never followed by a present-state word. */
const HISTORY_TERM =
  `(?:suicid(?:al|e)(?:\\s+(?:ideation|intent|thoughts|attempts?))?|homicid(?:al|e)(?:\\s+ideation)?|si|self[-\\s]?harm(?:ing|ed)?|overdos(?:e|ed|es|ing)|od|ideation|intent|plan|attempts?|attempted\\s+suicide|(?:tried|attempted)\\s+to\\s+(?:kill|end|harm|hurt|hang|cut)\\s+(?:him|her|them)sel(?:f|ves)|cut(?:ting)?\\s+(?:him|her|them)sel(?:f|ves)` +
  // Die and death wording, dated like the rest: "wanted to die as a teenager".
  `|(?:want(?:ed|ing)?|wish(?:ed|ing)?|thoughts?\\s+(?:of|about)|thinking\\s+(?:of|about)|talk(?:ed|ing)?\\s+about)\\s+(?:to\\s+)?(?:die|dying|death|be(?:ing)?\\s+dead|kill(?:ing)?\\s+(?:him|her|them)sel(?:f|ves)|end(?:ing)?\\s+${OWN_LIFE})|(?:passive\\s+)?death\\s+wish(?:es)?` +
  `|self[-\\s]?inflicted(?:\\s+(?:\\w+\\s+)?(?:wounds?|injur(?:y|ies)|lacerations?|cuts?|burns?))?|${JUMP}|${INGESTED}|${STOCKPILE})\\b(?!\\s+${PRESENT}\\b)`;
/**
 * "Past week", "prior to admission" and "previous 3 months" are recent, not
 * history. The line: hours, days, weeks and months are recent and escalate;
 * years, a year number and life stages are history.
 */
const RECENT =
  "(?!\\s+(?:to\\b|(?:\\d+\\s+|few\\s+|couple\\s+of\\s+)?(?:hours?|days?|nights?|weeks?|months?|24\\s*h\\w*|morning|evening)\\b))";
/** A date far enough back to be history. */
const DISTANT = `(?:in\\s+\\d{4}|(?:\\w+\\s+)?(?:years?|decades?)\\s+ago|in\\s+the\\s+(?:remote\\s+|distant\\s+)?past${RECENT}|as\\s+an?\\s+(?:teen(?:ager)?|child|kid|adolescent|student|young\\s+(?:adult|man|woman))|in\\s+(?:(?:his|her|their)\\s+)?(?:teens|twenties|youth|childhood|adolescence))`;

const HISTORICAL: readonly Rule[] = [
  {
    name: "historical.past",
    pattern: new RegExp(
      `\\b(?:history\\s+of|hx\\s+of|formerly|previous(?:ly)?${RECENT}|prior${RECENT}|past${RECENT})\\s+(?:(?!(?:but\\b|${PRESENT}\\b))\\w+\\s+){0,3}?${HISTORY_TERM}`,
      "i",
    ),
  },
  {
    name: "historical.dated",
    pattern: new RegExp(
      `\\b${HISTORY_TERM}(?:\\s+(?!${PRESENT}\\b)\\w+){0,3}?\\s+${DISTANT}\\b`,
      "i",
    ),
  },
  {
    name: "historical.remote",
    pattern: /\b(?:no\s+attempts?\s+since|last\s+attempt\s+(?:was\s+)?(?:in\s+)?\d{4})\b/i,
  },
];

/** Dated terms one history marker distributes over: "hx of SI and overdose". */
const HISTORY_LIST_TAIL = new RegExp(
  `^(?:\\s*(?:,|\\/|\\bor\\b|\\band\\b)\\s*${HISTORY_TERM})*`,
  "i",
);

/**
 * Educational and definitional framing. A clinician looking up guidance is not
 * in crisis, and blocking them is the failure that teaches people to stop
 * asking.
 */
const EDUCATIONAL: readonly Rule[] = [
  {
    name: "educational.what-is",
    pattern:
      /\b(?:what\s+is|define|definition\s+of|how\s+do\s+i\s+(?:score|administer|use)|guidance\s+(?:on|for)|guideline)\b/i,
  },
  {
    name: "educational.instrument",
    pattern:
      /\b(?:c-?ssrs|columbia|phq-?9|gad-?7|sad\s+persons|safety\s+planning\s+intervention)\b.*\b(?:score|scoring|administer|cut[-\s]?off|threshold|training)\b/i,
  },
];

/**
 * Population or epidemiology framing: "high risk of suicide in men over 45".
 * Clears risk only when no individual is named.
 */
const POPULATION: readonly Rule[] = [
  {
    name: "educational.population",
    pattern:
      /\b(?:suicide|self[-\s]?harm|overdose|homicide|mortality)\s+rates?\b|\b(?:rates?|incidence|prevalence)\s+of\b|\bepidemiolog\w*|\b(?:in|among|amongst|across)\s+(?:(?:older|younger|young|elderly|middle[-\s]aged|adult|adolescent|teenage|male|female|rural|all|most|many)\s+)?(?:men|women|males|females|boys|girls|adolescents|teenagers|teens|children|adults|people|veterans|populations?)\b(?!['’])|\b(?:men|women|people|adults|adolescents|those|individuals)\s+(?:who|aged|over|under)\b/i,
  },
];
const INDIVIDUAL =
  /\b(?:patient|pt|client|service\s+user|he|she|him|his|her|hers|they|them|their|this\s+(?:person|individual|man|woman|boy|girl|child)|mother|father|mum|mom|dad|son|daughter|brother|sister|partner|husband|wife|spouse|boyfriend|girlfriend|friend|carer|relative|colleague|resident)\b/i;

/**
 * A management question about an overdose, not a report of one. Masked, so
 * other risk beside it still counts.
 */
const MANAGEMENT: readonly Rule[] = [
  {
    name: "educational.management",
    pattern: new RegExp(
      `\\b(?:treat(?:ment|ing)?|manag(?:e|ement|ing)|antidote|work[-\\s]?up|approach)\\s+(?:(?:for|of|to|in)\\s+)?(?:(?:an?|the|this|my)\\s+)?(?:patient|pt|client|person|someone|adult|child|adolescent|man|woman)\\s+(?:who|that)\\s+(?:has\\s+|had\\s+)?(?:(?:took|taken|ingested|swallowed)\\s+(?:an?\\s+)?(?:\\w+\\s+)?${OVERDOSE}|overdosed\\b)(?:\\s+(?:of|on)\\s+\\w+)?`,
      "i",
    ),
  },
];
const NO_TAIL = /^/;

function matched(rules: readonly Rule[], text: string): string[] {
  return rules.filter((r) => r.pattern.test(text)).map((r) => r.name);
}

/**
 * Risk terms one negation distributes over: "denies SI or self-harm", "no
 * SI/HI". Consumed after a negation so the whole list is masked.
 */
const NEGATED_LIST_TAIL =
  /^(?:\s+(?:ideation|intent|thoughts|attempts?)\b)?(?:\s*(?:,|\/|\bor\b|\bnor\b|\band\b)\s*(?:(?:active|passive|current)\s+)?(?:(?:suicidal|homicidal)\s+(?:ideation|intent|thoughts)|suicidal|homicidal|ideation|intent|plan|si|hi|self[-\s]?harm|overdose)\b)*/i;

/**
 * The text with each negated phrase blanked out, so risk language outside it
 * still counts. Replaced with a separator rather than deleted, so the
 * fragments either side cannot join into a new match.
 */
function maskNegations(text: string): string {
  return mask(text, NEGATION, NEGATED_LIST_TAIL);
}

/** The text with each historical phrase blanked out, the same way. */
function maskHistory(text: string): string {
  return mask(text, HISTORICAL, HISTORY_LIST_TAIL);
}

function mask(text: string, rules: readonly Rule[], listTail: RegExp): string {
  const spans: Array<readonly [number, number]> = [];
  for (const rule of rules) {
    for (const match of text.matchAll(new RegExp(rule.pattern.source, `${rule.pattern.flags}g`))) {
      const end = match.index + match[0].length;
      const tail = listTail.exec(text.slice(end))?.[0].length ?? 0;
      spans.push([match.index, end + tail]);
    }
  }
  spans.sort((a, b) => a[0] - b[0]);

  let out = "";
  let cursor = 0;
  for (const [start, end] of spans) {
    if (end <= cursor) continue;
    out += `${text.slice(cursor, Math.max(cursor, start))} . `;
    cursor = end;
  }
  return out + text.slice(cursor);
}

/* ------------------------------------------------------------------ */
/* Classifier                                                          */
/* ------------------------------------------------------------------ */

export interface CrisisInput {
  /** What the clinician just typed. */
  readonly question: string;
  /**
   * Prior turns, oldest first. Evaluated because guardrails decay and because
   * risk is frequently disclosed across several messages rather than one.
   */
  readonly history?: readonly string[];
}

/**
 * Classify. Pure, synchronous, no model, no network.
 *
 * Negation is resolved by masking: each negated phrase is blanked before
 * ideation and third-party risk are matched, so "denies SI" clears itself
 * without clearing a separate disclosure in the same text. History is masked
 * the same way for third-party risk. Where readings conflict, escalation wins.
 */
export function classifyCrisis(input: CrisisInput): CrisisVerdict {
  const recent = (input.history ?? []).slice(-4);
  const question = input.question;
  const masked = maskNegations(question);
  // Ideation is checked against the current turn plus recent context, because
  // disclosure is often split across messages. Each turn is masked on its own,
  // so an earlier "denies SI" cannot neutralise a later disclosure.
  const windowed = [...recent.map(maskNegations), masked].join("\n");
  // History masks third-party risk only. A first-person disclosure is never
  // cleared by a date.
  const documented = mask(maskHistory(masked), MANAGEMENT, NO_TAIL);

  const educational = matched(EDUCATIONAL, question);
  const negated = matched(NEGATION, question);
  const historical = matched(HISTORICAL, question);
  const managed = matched(MANAGEMENT, question);
  // A population statement names no one at risk.
  const population = INDIVIDUAL.test(question) ? [] : matched(POPULATION, question);

  const ideation = matched(IDEATION, windowed);
  const acts = matched(ACT, windowed);
  // Unmasked: once ideation is present, err toward imminent.
  const imminence = matched(IMMINENCE, [...recent, question].join("\n"));
  const thirdParty = matched(THIRD_PARTY, question);
  const thirdPartyRisk = thirdParty.length > 0 ? matched(THIRD_PARTY_RISK, documented) : [];
  const currentRisk = matched(UNSUBJECTED_RISK, documented);

  // 1. First-person disclosure. Checked before third-party framing, because
  //    "my patient... and honestly I want to die too" must not be read as
  //    documentation. An act already done ("I took an overdose") is imminent.
  if (ideation.length > 0 || acts.length > 0) {
    const imminent = acts.length > 0 || imminence.length > 0;
    return {
      severity: imminent ? "imminent" : "ideation",
      audience: "user",
      rules: [...ideation, ...acts, ...imminence],
      blocking: true,
    };
  }

  // 2. Third-party risk left once negation and history are masked, not a lookup.
  if (thirdPartyRisk.length > 0 || currentRisk.length > 0) {
    if (educational.length > 0 || population.length > 0) {
      return {
        severity: "none",
        audience: "third-party",
        rules: [...historical, ...educational, ...population],
        blocking: false,
      };
    }
    return {
      severity: "clinical-risk",
      audience: "third-party",
      rules: [...thirdParty, ...thirdPartyRisk, ...currentRisk],
      blocking: true,
    };
  }

  // 3. Negation, a screening-negative statement or history, with nothing left
  //    once it is masked. Documentation.
  if (negated.length > 0 || historical.length > 0 || managed.length > 0) {
    return {
      severity: "none",
      audience: "third-party",
      rules: [...negated, ...historical, ...managed],
      blocking: false,
    };
  }

  return NO_CRISIS;
}

/* ------------------------------------------------------------------ */
/* Crisis lines                                                        */
/* ------------------------------------------------------------------ */

export interface CrisisLine {
  readonly label: string;
  /** Tel-dialable. Rendered as a `tel:` link by the skin. */
  readonly number: string;
  readonly note?: string;
}

/**
 * Fallback crisis lines by region.
 *
 * **A host must supply its own for production.** These are a development
 * default and a demonstration that the resolver exists — services change
 * numbers, coverage varies within a country, and an organisation almost always
 * wants its own on-call route listed first.
 *
 * The reason this is a resolver at all rather than a constant: 988 works in the
 * United States and nowhere else. A component that ships 988 as a hardcoded
 * string is shipping a bug to every other market, and it is the kind of bug
 * discovered by the person least able to absorb it. `resolveCrisisLines`
 * returns generic emergency guidance rather than a wrong number when it does
 * not recognise a locale, because no number is safer than a foreign one.
 */
const CRISIS_LINES: Record<string, readonly CrisisLine[]> = {
  US: [{ label: "988 Suicide & Crisis Lifeline", number: "988", note: "Call or text, 24/7" }],
  CA: [{ label: "9-8-8 Suicide Crisis Helpline", number: "988", note: "Call or text, 24/7" }],
  GB: [
    { label: "Samaritans", number: "116123", note: "Free, 24/7" },
    { label: "NHS 111", number: "111", note: "Select the mental health option" },
  ],
  IE: [{ label: "Samaritans Ireland", number: "116123", note: "Free, 24/7" }],
  AU: [{ label: "Lifeline", number: "131114", note: "24/7" }],
  NZ: [{ label: "1737 Need to talk?", number: "1737", note: "Call or text, 24/7" }],
  IN: [{ label: "Tele-MANAS", number: "14416", note: "24/7, multiple languages" }],
};

const GENERIC: readonly CrisisLine[] = [
  { label: "Local emergency services", number: "", note: "Use your local emergency number" },
];

/**
 * Resolve lines for a BCP-47 locale.
 *
 * Region is taken from the locale's region subtag, so "en-GB" and "cy-GB" both
 * resolve to the UK. A bare language tag resolves to generic guidance rather
 * than guessing — "en" does not mean the United States, and treating it as
 * though it does is precisely the bug this function exists to prevent.
 */
export function resolveCrisisLines(
  locale: string,
  overrides?: Readonly<Record<string, readonly CrisisLine[]>>,
): readonly CrisisLine[] {
  const region = regionOf(locale);
  if (!region) return GENERIC;
  return overrides?.[region] ?? CRISIS_LINES[region] ?? GENERIC;
}

export function regionOf(locale: string): string | undefined {
  const parts = locale.split(/[-_]/);
  for (const part of parts.slice(1)) {
    if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
  }
  return undefined;
}
