/**
 * The secure inbox's threads.
 *
 * Every patient named here is a cohort patient, and every figure a message
 * quotes (appointment times, doses, missed sessions) agrees with `../data`
 * and the risk queue, so a thread opened from a record reads true.
 */

import type { ClinicianId } from "../data";

export type ThreadKind = "patient" | "team" | "pharmacy" | "admin";
export type Home = "inbox" | "sent";

/** Who the other side of a thread is, for the avatar and the row's name. */
export type Party =
  | { type: "patient"; id: string }
  | { type: "clinician"; id: ClinicianId }
  | { type: "org"; name: string; initial: string };

export interface Message {
  from: string;
  /** `us` is the clinic, drawn on the right; `system` is a centred event line. */
  side: "us" | "them" | "system";
  /** "08:52" today, "12 Aug 16:40" before. */
  at: string;
  body: string;
  attachment?: string;
}

export interface Thread {
  id: string;
  kind: ThreadKind;
  subject: string;
  participants: readonly string[];
  party: Party;
  /** Related patient id. */
  patient?: string;
  messages: readonly Message[];
  home: Home;
  archived: boolean;
  flagged: boolean;
  /** "Filed to chart · 10:08" once filed. */
  filed: string | null;
  /** Recency; higher is newer. Sending bumps it. */
  ord: number;
}

export const KIND_LABEL: Record<ThreadKind, string> = {
  patient: "Patient",
  team: "Care team",
  pharmacy: "Pharmacy",
  admin: "Admin",
};

/**
 * Patients with portal access. The authored cohort, less the one patient
 * with no session yet — an account is issued at the first visit.
 */
export const PORTAL = [
  "okonkwo",
  "almeida",
  "mwangi",
  "whitfield",
  "delacroix",
  "ferreira",
  "nakamura",
  "haddad",
  "kowalski",
  "oyelaran",
  "reyes",
  "lindqvist",
  "chen",
  "ibrahim",
  "santos",
] as const;

export const PHARMACY = "Riverside Pharmacy";

export const THREADS: readonly Thread[] = [
  {
    id: "th-osei",
    kind: "team",
    subject: "Covering outreach call",
    participants: ["P. Osei, PhD", "E. Lake, LCSW"],
    party: { type: "clinician", id: "osei" },
    patient: "haddad",
    home: "inbox",
    archived: false,
    flagged: false,
    filed: null,
    ord: 110,
    messages: [
      {
        from: "P. Osei",
        side: "them",
        at: "09:40",
        body: "Layla Haddad has missed her last two sessions (perinatal program, PHQ-9 17). I'm in assessments until 13:30. Could you make a covering outreach call this morning? Happy to pick it up at supervision at 14:00.",
      },
    ],
  },
  {
    id: "th-ibrahim",
    kind: "patient",
    subject: "Thanks for this morning",
    participants: ["F. Ibrahim", "E. Lake, LCSW"],
    party: { type: "patient", id: "ibrahim" },
    patient: "ibrahim",
    home: "inbox",
    archived: false,
    flagged: false,
    filed: null,
    ord: 105,
    messages: [
      {
        from: "F. Ibrahim",
        side: "them",
        at: "09:32",
        body: "Thank you for today. The breathing exercise helped on the bus already. I'll keep the log going this week.",
      },
    ],
  },
  {
    id: "th-almeida",
    kind: "patient",
    subject: "Can I come in earlier?",
    participants: ["T. Almeida", "E. Lake, LCSW"],
    party: { type: "patient", id: "almeida" },
    patient: "almeida",
    home: "inbox",
    archived: false,
    flagged: false,
    filed: null,
    ord: 100,
    messages: [
      {
        from: "E. Lake",
        side: "us",
        at: "11 Aug 17:05",
        body: "Hi Tomás, a reminder that your next session is Thursday at 11:00. Your GAD-7 link is in the portal.",
      },
      {
        from: "T. Almeida",
        side: "them",
        at: "08:52",
        body: "The panic symptoms have been worse this week, two episodes at work. I'm OK, just finding it hard. Is there any chance of coming in earlier than 11:00 today?",
      },
    ],
  },
  {
    id: "th-pharmacy",
    kind: "pharmacy",
    subject: "Confirm trazodone with sertraline",
    participants: [PHARMACY, "E. Lake, LCSW"],
    party: { type: "org", name: PHARMACY, initial: "R" },
    patient: "okonkwo",
    home: "inbox",
    archived: false,
    flagged: false,
    filed: null,
    ord: 95,
    messages: [
      {
        from: PHARMACY,
        side: "them",
        at: "08:31",
        body: "We filled trazodone 50 mg at night for R. Okonkwo, started 05 Aug. She also takes sertraline 100 mg daily. Please confirm the combination is intended so we can release the next fill.",
        attachment: "Okonkwo-dispensing-history.pdf",
      },
    ],
  },
  {
    id: "th-mwangi",
    kind: "team",
    subject: "Crisis call overnight",
    participants: ["J. Tashpulatov, MD", "E. Lake, LCSW"],
    party: { type: "clinician", id: "tash" },
    patient: "mwangi",
    home: "inbox",
    archived: false,
    flagged: true,
    filed: null,
    ord: 90,
    messages: [
      {
        from: "J. Tashpulatov",
        side: "them",
        at: "06:15",
        body: "Daniel called the crisis line at 05:08. C-SSRS positive, no plan or intent, safe at home with his sister. I've opened a 24h review and will see him at 15:30. Flagging in case he reaches you first.",
      },
      {
        from: "E. Lake",
        side: "us",
        at: "07:48",
        body: "Thanks. I'll keep an eye on the portal and page you if he makes contact.",
      },
    ],
  },
  {
    id: "th-ferreira",
    kind: "patient",
    subject: "Moving to fortnightly",
    participants: ["S. Ferreira", "E. Lake, LCSW"],
    party: { type: "patient", id: "ferreira" },
    patient: "ferreira",
    home: "inbox",
    archived: false,
    flagged: false,
    filed: "Filed to chart · 12 Aug 17:02",
    ord: 80,
    messages: [
      {
        from: "S. Ferreira",
        side: "them",
        at: "12 Aug 16:40",
        body: "Thanks for everything these past months. Fortnightly from the 18th works for me.",
      },
      {
        from: "E. Lake",
        side: "us",
        at: "12 Aug 17:01",
        body: "Great progress, Sofia. You're booked for Tue 18 Aug at 10:00. We'll also update your safety plan then.",
      },
    ],
  },
  {
    id: "th-reyes-auth",
    kind: "admin",
    subject: "Aetna prior authorization",
    participants: ["Billing team", "E. Lake, LCSW"],
    party: { type: "org", name: "Billing team", initial: "B" },
    patient: "reyes",
    home: "inbox",
    archived: false,
    flagged: true,
    filed: null,
    ord: 70,
    messages: [
      {
        from: "Billing team",
        side: "them",
        at: "12 Aug 11:05",
        body: "Aetna needs a prior authorization for C. Reyes beyond session 8. She's at 6. Please complete the clinical section by Fri 14 Aug.",
        attachment: "Aetna-PA-Reyes.pdf",
      },
    ],
  },
  {
    id: "th-delacroix",
    kind: "patient",
    subject: "Change Monday's appointment",
    participants: ["M. Delacroix", "E. Lake, LCSW"],
    party: { type: "patient", id: "delacroix" },
    patient: "delacroix",
    home: "inbox",
    archived: false,
    flagged: false,
    filed: null,
    ord: 60,
    messages: [
      {
        from: "M. Delacroix",
        side: "them",
        at: "12 Aug 09:14",
        body: "I have a work conflict on Mon 17 Aug at 09:00. Is there anything later that day, or on Tuesday?",
      },
    ],
  },
  {
    id: "th-nakamura",
    kind: "admin",
    subject: "Intake paperwork",
    participants: ["Front desk", "E. Lake, LCSW"],
    party: { type: "org", name: "Front desk", initial: "F" },
    patient: "nakamura",
    home: "inbox",
    archived: false,
    flagged: false,
    filed: null,
    ord: 50,
    messages: [
      {
        from: "Front desk",
        side: "them",
        at: "11 Aug 15:22",
        body: "A. Nakamura's intake packet is signed except the release of information. We'll ask her to finish it at check-in before 16:00 on Thursday.",
        attachment: "Nakamura-intake-packet.pdf",
      },
    ],
  },
  {
    id: "th-chen",
    kind: "patient",
    subject: "Worksheet before Friday",
    participants: ["E. Lake, LCSW", "W. Chen"],
    party: { type: "patient", id: "chen" },
    patient: "chen",
    home: "sent",
    archived: false,
    flagged: false,
    filed: "Filed to chart · 11 Aug 13:03",
    ord: 45,
    messages: [
      {
        from: "E. Lake",
        side: "us",
        at: "11 Aug 13:02",
        body: "Hi Wei, covering for Dr. Osei this week. The thought record worksheet is attached. Bring it to Friday's 11:00 session.",
        attachment: "Thought-record.pdf",
      },
    ],
  },
  {
    id: "th-whitfield",
    kind: "patient",
    subject: "Parking at the new entrance",
    participants: ["J. Whitfield", "E. Lake, LCSW"],
    party: { type: "patient", id: "whitfield" },
    patient: "whitfield",
    home: "inbox",
    archived: true,
    flagged: false,
    filed: null,
    ord: 20,
    messages: [
      {
        from: "J. Whitfield",
        side: "them",
        at: "07 Aug 12:10",
        body: "Is the car park still open while the entrance works are on?",
      },
      {
        from: "Front desk",
        side: "us",
        at: "07 Aug 12:40",
        body: "Yes, use the Elm Street side. Validation is at reception.",
      },
    ],
  },
];
