"use client";

/**
 * Messages — the secure inbox.
 *
 * Threads live in this screen; only "which have been opened" is shared, because
 * the rail counts the unread three. A thread keeps its related patient beside
 * it, so a message about a patient is never read without that patient's
 * numbers and open risk in view.
 */

import * as React from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarClock,
  FileCheck2,
  FilePlus2,
  Flag,
  FlagOff,
  Mail,
  Paperclip,
  Send,
  ShieldAlert,
  SquarePen,
} from "lucide-react";
import {
  CLINICIANS,
  RISKS,
  TRACK,
  band,
  faceOf,
  latest,
  patient,
  reading,
  type ClinicianId,
} from "../data";
import { Face, Pill, Status } from "../../kit";
import { UNREAD_THREADS, stamp, useNav } from "../shell";
import {
  Chips,
  ClinicianAvatar,
  EmptyState,
  PatientLink,
  ScreenBody,
  ScreenHead,
  SearchField,
  Segmented,
  Select,
  Sheet,
} from "../ui";
import {
  KIND_LABEL,
  PHARMACY,
  PORTAL,
  THREADS,
  type Message,
  type Party,
  type Thread,
  type ThreadKind,
} from "./messages-data";

type Folder = "inbox" | "flagged" | "sent" | "archived";
type KindFilter = "all" | ThreadKind;

const INITIAL_UNREAD: readonly string[] = UNREAD_THREADS;
const OFFER_LINE = "Offered 10:30 today";

function folderOf(t: Thread): Exclude<Folder, "flagged"> {
  return t.archived ? "archived" : t.home;
}

function inFolder(t: Thread, f: Folder): boolean {
  if (f === "flagged") return t.flagged && !t.archived;
  return folderOf(t) === f;
}

function partyName(p: Party): string {
  if (p.type === "patient") return patient(p.id).name;
  if (p.type === "clinician") return CLINICIANS[p.id].short;
  return p.name;
}

function firstName(id: string): string {
  const full = patient(id).full;
  return full.split(", ")[1] ?? full;
}

/** "08:52" stays; "12 Aug 16:40" becomes "12 Aug" in a list. */
function shortAt(at: string): string {
  const parts = at.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[1]}` : at;
}

function lastReal(t: Thread): Message {
  const real = t.messages.filter((m) => m.side !== "system");
  return real[real.length - 1] ?? t.messages[t.messages.length - 1]!;
}

function PartyAvatar({ party, size = 32 }: { party: Party; size?: number }) {
  if (party.type === "patient") {
    const p = patient(party.id);
    return <Face name={p.name} src={faceOf(p.name)} size={size} />;
  }
  if (party.type === "clinician") return <ClinicianAvatar id={party.id} size={size} />;
  return (
    <span className="tAv ms-org" aria-hidden="true" style={{ width: size, height: size }}>
      {party.initial}
    </span>
  );
}

/* --------------------------------------------------------------- compose */

type Recipient = "" | `pt:${string}` | `cl:${ClinicianId}` | "org:pharmacy";

function recipientOptions(extra?: string) {
  const ids: string[] = [...PORTAL];
  if (extra && !ids.includes(extra)) ids.push(extra);
  const patients = ids
    .map((id) => patient(id))
    .sort((a, b) => a.full.localeCompare(b.full))
    .map((p) => ({ value: `pt:${p.id}` as Recipient, label: `${p.name} · patient` }));
  const clinicians = (Object.keys(CLINICIANS) as ClinicianId[])
    .filter((id) => id !== "lake")
    .map((id) => ({ value: `cl:${id}` as Recipient, label: `${CLINICIANS[id].name} · care team` }));
  return [
    { value: "" as Recipient, label: "Choose a recipient" },
    ...patients,
    ...clinicians,
    { value: "org:pharmacy" as Recipient, label: `${PHARMACY} · pharmacy` },
  ];
}

function ComposeSheet({
  open,
  onClose,
  initialTo,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  initialTo: Recipient;
  onSend: (draft: { to: Recipient; subject: string; body: string; file: boolean }) => void;
}) {
  const [to, setTo] = React.useState<Recipient>(initialTo);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [file, setFile] = React.useState(initialTo.startsWith("pt:"));
  const subjectId = React.useId();
  const bodyId = React.useId();
  const options = React.useMemo(
    () => recipientOptions(initialTo.startsWith("pt:") ? initialTo.slice(3) : undefined),
    [initialTo],
  );
  const toPatient = to.startsWith("pt:");
  const ready = to !== "" && body.trim() !== "";

  const changeTo = (next: Recipient) => {
    setTo(next);
    setFile(next.startsWith("pt:"));
  };

  const send = () => {
    if (!ready) return;
    onSend({ to, subject: subject.trim(), body: body.trim(), file: file && toPatient });
    setTo("");
    setSubject("");
    setBody("");
    setFile(false);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New message"
      sub="Secure message · portal, care team or pharmacy"
      footer={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" disabled={!ready} onClick={send}>
            <Send aria-hidden="true" size={14} strokeWidth={1.8} />
            Send
          </button>
        </>
      }
    >
      <div className="field">
        <span aria-hidden="true">To</span>
        <Select options={options} value={to} onChange={changeTo} label="To" />
      </div>
      <div className="field">
        <label htmlFor={subjectId}>Subject</label>
        <input
          id={subjectId}
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={bodyId}>Message</label>
        <textarea
          id={bodyId}
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
        />
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={file && toPatient}
          disabled={!toPatient}
          onChange={(e) => setFile(e.target.checked)}
        />
        <span>
          File to chart
          {!toPatient ? <span className="ms-hint"> · patient recipients only</span> : null}
        </span>
      </label>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ list */

function ThreadRow({
  t,
  unread,
  open,
  onOpen,
}: {
  t: Thread;
  unread: boolean;
  open: boolean;
  onOpen: () => void;
}) {
  const last = lastReal(t);
  const p = t.patient ? patient(t.patient) : null;
  const sent = t.home === "sent";
  return (
    <li className={`ms-rowWrap${unread ? " unread" : ""}`}>
      <button
        type="button"
        className="rowBtn ms-row"
        onClick={onOpen}
        {...(open ? { "aria-current": "true" as const } : {})}
      >
        <span className="ms-dot" aria-hidden="true" />
        <PartyAvatar party={t.party} />
        <span className="ms-rowMain">
          <span className="ms-rowTop">
            <span className="ms-sender">
              {unread ? <span className="sr-only">Unread, </span> : null}
              {sent ? "To " : ""}
              {partyName(t.party)}
            </span>
            <span className="ms-time mono">{shortAt(last.at)}</span>
          </span>
          <span className="ms-subj">{t.subject}</span>
          <span className="ms-prev">{last.body}</span>
          <span className="ms-rowMeta">
            <span className="ms-kind">{KIND_LABEL[t.kind]}</span>
            {p && t.party.type !== "patient" ? <span className="ms-ptChip">{p.name}</span> : null}
            {last.attachment ? (
              <span className="ms-metaIc" title="Has attachment">
                <Paperclip aria-hidden="true" size={12} strokeWidth={1.8} />
                <span className="sr-only">Has attachment</span>
              </span>
            ) : null}
            {t.flagged ? (
              <span className="ms-flag">
                <Flag aria-hidden="true" size={12} strokeWidth={1.9} />
                Flagged
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

/* ---------------------------------------------------------- reading pane */

function ContextCard({ t, onOffer }: { t: Thread; onOffer: () => void }) {
  const { go, store } = useNav();
  if (!t.patient) return null;
  const p = patient(t.patient);
  const v = latest(p);
  const b = v === null ? null : band(p.instrument, v);
  const risk = RISKS.find((r) => r.patient === p.id && !store.resolved[r.id]);
  const offered = t.messages.some((m) => m.side === "system" && m.body === OFFER_LINE);
  const track = TRACK[p.track];

  return (
    <section className="ms-ctx" aria-label={`${p.name} at a glance`}>
      <h4 className="sr-only">{p.name} at a glance</h4>
      <div className="ms-ctxItem">
        <span className="ms-ctxK">Latest</span>
        <span className="ms-ctxV">
          <span className="mono">{reading(p)}</span>
          {b ? <Pill sev={b.sev}>{b.label}</Pill> : null}
        </span>
      </div>
      <div className="ms-ctxItem">
        <span className="ms-ctxK">Track</span>
        <span className="ms-ctxV">
          <Status sev={track.sev}>{track.label}</Status>
        </span>
      </div>
      <div className="ms-ctxItem">
        <span className="ms-ctxK">Next contact</span>
        <span className="ms-ctxV mono">{p.next}</span>
      </div>
      {risk || t.id === "th-almeida" ? (
        <div className="ms-ctxActs">
          {risk ? (
            <button
              type="button"
              className="btn ghost sm ms-risk"
              onClick={() => go({ screen: "safety", view: risk.id })}
            >
              <ShieldAlert aria-hidden="true" size={13} strokeWidth={1.8} />
              {risk.what} · {risk.left}
            </button>
          ) : null}
          {t.id === "th-almeida" ? (
            <button type="button" className="btn primary sm" disabled={offered} onClick={onOffer}>
              <CalendarClock aria-hidden="true" size={13} strokeWidth={1.8} />
              {offered ? "10:30 offered" : "Offer earlier slot"}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function templates(t: Thread): { value: string; label: string; text: string }[] {
  const p = t.patient ? patient(t.patient) : null;
  const toPatient = t.kind === "patient" && p;
  const hi = toPatient ? `Hi ${firstName(p.id)}, ` : "";
  return [
    {
      value: "confirm",
      label: "Confirm appointment",
      text: p
        ? `${hi}${toPatient ? "c" : "C"}onfirming ${toPatient ? "your" : `${p.name}'s`} appointment on ${p.next}. Reply here if it needs to change.`
        : "Confirming the appointment. Reply here if it needs to change.",
    },
    {
      value: "crisis",
      label: "Crisis resources",
      text: `${hi}${toPatient ? "i" : "I"}f you feel unsafe or in crisis, call or text 988 (Suicide & Crisis Lifeline) any time, day or night. If you are in immediate danger, call 911 or go to the nearest emergency department.`,
    },
    {
      value: "callback",
      label: "Request callback",
      text: `${hi}${toPatient ? "c" : "C"}ould you let me know a good time to call today? I'll ring from the clinic line.`,
    },
  ];
}

function Composer({ t, onSend }: { t: Thread; onSend: (body: string, file: boolean) => void }) {
  const [draft, setDraft] = React.useState("");
  const [file, setFile] = React.useState(t.kind === "patient");
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const id = React.useId();
  const name = partyName(t.party);
  const canFile = Boolean(t.patient);

  // Grow with the draft up to about five lines, then scroll.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 122)}px`;
  }, [draft]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    onSend(body, file && canFile);
    setDraft("");
  };

  const insert = (text: string) => {
    setDraft((d) => (d.trim() ? `${d.trimEnd()}\n\n${text}` : text));
    ref.current?.focus();
  };

  return (
    <div className="ms-composer">
      <div className="ms-tpl" role="group" aria-label="Quick replies">
        {templates(t).map((tp) => (
          <button key={tp.value} type="button" className="chip" onClick={() => insert(tp.text)}>
            {tp.label}
          </button>
        ))}
      </div>
      <label htmlFor={id} className="sr-only">
        Reply to {name}
      </label>
      <textarea
        id={id}
        ref={ref}
        className="ms-input"
        rows={2}
        value={draft}
        placeholder={`Reply to ${name}`}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="ms-compFoot">
        <label className="check ms-fileCheck">
          <input
            type="checkbox"
            checked={file && canFile}
            disabled={!canFile}
            onChange={(e) => setFile(e.target.checked)}
          />
          <span>File to chart</span>
        </label>
        <span className="ms-kbd">⌘/Ctrl + Enter</span>
        <button type="button" className="btn primary sm" disabled={!draft.trim()} onClick={send}>
          <Send aria-hidden="true" size={13} strokeWidth={1.8} />
          Send
        </button>
      </div>
    </div>
  );
}

function Reader({
  t,
  onBack,
  onUpdate,
  onMarkUnread,
}: {
  t: Thread;
  onBack: () => void;
  onUpdate: (id: string, update: (t: Thread) => Thread) => void;
  onMarkUnread: () => void;
}) {
  const { toast } = useNav();
  const titleId = React.useId();
  const p = t.patient ? patient(t.patient) : null;
  const threadEnd = React.useRef<HTMLDivElement>(null);
  const count = t.messages.length;
  const lastIndex = t.messages.length - 1;
  const last = t.messages[lastIndex];

  // Keep the newest message in view as the thread grows.
  const seen = React.useRef(count);
  React.useEffect(() => {
    if (count > seen.current) threadEnd.current?.scrollIntoView({ block: "nearest" });
    seen.current = count;
  }, [count]);

  const toggleFlag = () => {
    onUpdate(t.id, (x) => ({ ...x, flagged: !x.flagged }));
    toast(t.flagged ? "Flag removed" : "Flagged for follow-up");
  };
  const toggleArchive = () => {
    onUpdate(t.id, (x) => ({ ...x, archived: !x.archived }));
    toast(
      t.archived
        ? `Moved to ${t.home === "sent" ? "Sent" : "Inbox"}`
        : "Archived · moved out of Inbox",
    );
  };
  const toggleFiled = () => {
    if (!p) return;
    onUpdate(t.id, (x) => ({ ...x, filed: x.filed ? null : `Filed to chart · ${stamp()}` }));
    toast(t.filed ? `Removed from ${p.name}'s chart` : `Filed to ${p.name}'s chart`);
  };
  const offer = () => {
    onUpdate(t.id, (x) => ({
      ...x,
      messages: [...x.messages, { from: "System", side: "system", at: stamp(), body: OFFER_LINE }],
    }));
    toast("Offered 10:30 today to T. Almeida");
  };
  const send = (body: string, file: boolean) => {
    onUpdate(t.id, (x) => ({
      ...x,
      ord: Math.max(x.ord, 1000) + x.messages.length + 1,
      filed: file && !x.filed ? `Filed to chart · ${stamp()}` : x.filed,
      messages: [...x.messages, { from: "E. Lake", side: "us", at: stamp(), body }],
    }));
    toast(`Sent to ${partyName(t.party)}${file ? " · filed to chart" : ""}`);
  };

  return (
    <section className="ms-read" aria-labelledby={titleId}>
      <div className="ms-readHead">
        <button type="button" className="btn ghost sm ms-back" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={13} strokeWidth={1.8} />
          Inbox
        </button>
        <div className="ms-titleRow">
          <div className="ms-titleText">
            <h3 id={titleId}>{t.subject}</h3>
            <p className="ms-parts">
              {KIND_LABEL[t.kind]} · {t.participants.join(", ")}
            </p>
          </div>
          <div className="ms-tools" role="toolbar" aria-label="Conversation actions">
            <button
              type="button"
              className="iconBtn"
              aria-pressed={t.flagged}
              aria-label={t.flagged ? "Unflag" : "Flag"}
              title={t.flagged ? "Unflag" : "Flag"}
              onClick={toggleFlag}
            >
              {t.flagged ? (
                <FlagOff aria-hidden="true" size={15} strokeWidth={1.7} />
              ) : (
                <Flag aria-hidden="true" size={15} strokeWidth={1.7} />
              )}
            </button>
            <button
              type="button"
              className="iconBtn"
              aria-label="Mark unread"
              title="Mark unread"
              onClick={onMarkUnread}
            >
              <Mail aria-hidden="true" size={15} strokeWidth={1.7} />
            </button>
            <button
              type="button"
              className="iconBtn"
              aria-label={t.archived ? "Unarchive" : "Archive"}
              title={t.archived ? "Unarchive" : "Archive"}
              onClick={toggleArchive}
            >
              {t.archived ? (
                <ArchiveRestore aria-hidden="true" size={15} strokeWidth={1.7} />
              ) : (
                <Archive aria-hidden="true" size={15} strokeWidth={1.7} />
              )}
            </button>
            <button
              type="button"
              className="iconBtn"
              aria-pressed={Boolean(t.filed)}
              aria-label={t.filed ? "Remove from chart" : "File to chart"}
              title={p ? (t.filed ? "Remove from chart" : "File to chart") : "No related patient"}
              disabled={!p}
              onClick={toggleFiled}
            >
              {t.filed ? (
                <FileCheck2 aria-hidden="true" size={15} strokeWidth={1.7} />
              ) : (
                <FilePlus2 aria-hidden="true" size={15} strokeWidth={1.7} />
              )}
            </button>
          </div>
        </div>
        {p || t.filed ? (
          <div className="ms-relRow">
            {p ? (
              <span className="ms-rel">
                <span className="ms-relK">Patient</span>
                <PatientLink p={p} size={18} />
              </span>
            ) : null}
            {t.filed ? (
              <span className="ms-prov">
                <FileCheck2 aria-hidden="true" size={12} strokeWidth={1.8} />
                {t.filed}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <ContextCard t={t} onOffer={offer} />

      <div className="ms-scroll">
        <ol className="ms-thread" aria-label="Messages">
          {t.messages.map((m, i) =>
            m.side === "system" ? (
              <li key={i} className="ms-sys">
                <span>
                  {m.body} · <span className="mono">{m.at}</span>
                </span>
              </li>
            ) : (
              <li key={i} className={`ms-msg ${m.side}`}>
                <span className="ms-meta">
                  {m.from} · <span className="mono">{m.at}</span>
                </span>
                <div className="ms-bub">{m.body}</div>
                {m.attachment ? (
                  <button
                    type="button"
                    className="ms-att"
                    onClick={() => toast(`Opened ${m.attachment}`)}
                  >
                    <Paperclip aria-hidden="true" size={12} strokeWidth={1.8} />
                    {m.attachment}
                  </button>
                ) : null}
                {i === lastIndex && last?.side === "us" ? (
                  <span className="ms-delivered">Delivered</span>
                ) : null}
              </li>
            ),
          )}
        </ol>
        <div ref={threadEnd} />
      </div>

      <Composer key={t.id} t={t} onSend={send} />
    </section>
  );
}

/* ---------------------------------------------------------------- screen */

function latestFor(threads: readonly Thread[], patientId: string): Thread | undefined {
  return threads.filter((t) => t.patient === patientId).sort((a, b) => b.ord - a.ord)[0];
}

export function MessagesScreen() {
  const { route, store, patch, toast } = useNav();
  const [threads, setThreads] = React.useState<Thread[]>(() => [...THREADS]);
  // Threads outside the starting three that were marked unread here.
  const [markedUnread, setMarkedUnread] = React.useState<Record<string, true>>({});
  const [initial] = React.useState(() => {
    const viewed = route.view ? THREADS.find((t) => t.id === route.view) : undefined;
    if (viewed) return { open: viewed.id, compose: false };
    if (route.patient) {
      const found = latestFor(THREADS, route.patient);
      if (found) return { open: found.id, compose: false };
      return { open: null, compose: true };
    }
    return { open: null, compose: false };
  });
  const [openId, setOpenId] = React.useState<string | null>(initial.open);
  const [composing, setComposing] = React.useState(initial.compose);
  const [composeTo, setComposeTo] = React.useState<Recipient>(
    initial.compose && route.patient ? `pt:${route.patient}` : "",
  );
  const [folder, setFolder] = React.useState<Folder>(() => {
    const t = initial.open ? THREADS.find((x) => x.id === initial.open) : undefined;
    return t ? folderOf(t) : "inbox";
  });
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [query, setQuery] = React.useState("");
  const seq = React.useRef(0);

  const isUnread = React.useCallback(
    (id: string) => (INITIAL_UNREAD.includes(id) ? !store.read[id] : Boolean(markedUnread[id])),
    [store.read, markedUnread],
  );

  // A thread opened by route counts as read, as if it had been clicked.
  React.useEffect(() => {
    if (initial.open) {
      const id = initial.open;
      patch((s) => (s.read[id] ? s : { ...s, read: { ...s.read, [id]: true } }));
    }
  }, [initial.open, patch]);

  const open = (id: string) => {
    setOpenId(id);
    patch((s) => (s.read[id] ? s : { ...s, read: { ...s.read, [id]: true } }));
    setMarkedUnread((m) => {
      if (!m[id]) return m;
      const next = { ...m };
      delete next[id];
      return next;
    });
  };

  const markUnread = (id: string) => {
    if (INITIAL_UNREAD.includes(id)) {
      patch((s) => {
        const read = { ...s.read };
        delete read[id];
        return { ...s, read };
      });
    } else {
      setMarkedUnread((m) => ({ ...m, [id]: true }));
    }
    setOpenId(null);
    toast("Marked unread");
  };

  const update = (id: string, fn: (t: Thread) => Thread) =>
    setThreads((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));

  const unreadCount = threads.filter((t) => isUnread(t.id)).length;

  const needle = query.trim().toLowerCase();
  const matches = (t: Thread) => {
    if (!needle) return true;
    const hay = [
      t.subject,
      partyName(t.party),
      ...t.participants,
      t.patient ? patient(t.patient).name : "",
      ...t.messages.map((m) => m.body),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  };

  const sorted = [...threads].sort((a, b) => b.ord - a.ord);
  const inCurrent = sorted.filter((t) => inFolder(t, folder));
  const searched = inCurrent.filter(matches);
  const visible = kind === "all" ? searched : searched.filter((t) => t.kind === kind);

  const folderCount = (f: Folder) => threads.filter((t) => inFolder(t, f)).length;
  const folders: { value: Folder; label: string; count: number }[] = [
    { value: "inbox", label: "Inbox", count: folderCount("inbox") },
    { value: "flagged", label: "Flagged", count: folderCount("flagged") },
    { value: "sent", label: "Sent", count: folderCount("sent") },
    { value: "archived", label: "Archived", count: folderCount("archived") },
  ];
  const kindCount = (k: ThreadKind) => searched.filter((t) => t.kind === k).length;
  const kinds: { value: KindFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: searched.length },
    { value: "patient", label: "Patients", count: kindCount("patient") },
    { value: "team", label: "Care team", count: kindCount("team") },
    { value: "pharmacy", label: "Pharmacy", count: kindCount("pharmacy") },
    { value: "admin", label: "Admin", count: kindCount("admin") },
  ];

  const current = openId ? threads.find((t) => t.id === openId) : undefined;

  const startCompose = (to: Recipient = "") => {
    setComposeTo(to);
    setComposing(true);
  };

  const sendNew = ({
    to,
    subject,
    body,
    file,
  }: {
    to: Recipient;
    subject: string;
    body: string;
    file: boolean;
  }) => {
    seq.current += 1;
    const id = `th-new-${seq.current}`;
    let party: Party;
    let kindOf: ThreadKind;
    let pid: string | undefined;
    if (to.startsWith("pt:")) {
      pid = to.slice(3);
      party = { type: "patient", id: pid };
      kindOf = "patient";
    } else if (to.startsWith("cl:")) {
      party = { type: "clinician", id: to.slice(3) as ClinicianId };
      kindOf = "team";
    } else {
      party = { type: "org", name: PHARMACY, initial: "R" };
      kindOf = "pharmacy";
    }
    const who = party.type === "clinician" ? CLINICIANS[party.id].name : partyName(party);
    const thread: Thread = {
      id,
      kind: kindOf,
      subject: subject || `Message from E. Lake`,
      participants: ["E. Lake, LCSW", who],
      party,
      ...(pid ? { patient: pid } : {}),
      home: "sent",
      archived: false,
      flagged: false,
      filed: file ? `Filed to chart · ${stamp()}` : null,
      ord: 2000 + seq.current,
      messages: [{ from: "E. Lake", side: "us", at: stamp(), body }],
    };
    setThreads((ts) => [thread, ...ts]);
    setComposing(false);
    setFolder("sent");
    setKind("all");
    setQuery("");
    setOpenId(id);
    toast(`Sent to ${partyName(party)}${file ? " · filed to chart" : ""}`);
  };

  let listBody: React.ReactNode;
  if (visible.length > 0) {
    listBody = (
      <ul className="ms-rows">
        {visible.map((t) => (
          <ThreadRow
            key={t.id}
            t={t}
            unread={isUnread(t.id)}
            open={t.id === openId}
            onOpen={() => open(t.id)}
          />
        ))}
      </ul>
    );
  } else if (needle) {
    listBody = (
      <EmptyState
        title="No matching messages"
        action={
          <button type="button" className="btn ghost sm" onClick={() => setQuery("")}>
            Clear search
          </button>
        }
      >
        Nothing in {folders.find((f) => f.value === folder)?.label} matches “{query.trim()}”.
      </EmptyState>
    );
  } else if (inCurrent.length > 0) {
    listBody = (
      <EmptyState
        title={`No ${kinds.find((k) => k.value === kind)?.label.toLowerCase()} messages here`}
        action={
          <button type="button" className="btn ghost sm" onClick={() => setKind("all")}>
            Show all
          </button>
        }
      />
    );
  } else {
    listBody = (
      <EmptyState title={`${folders.find((f) => f.value === folder)?.label} is empty`}>
        {folder === "flagged" ? "Flag a conversation to keep it here." : "Nothing to show."}
      </EmptyState>
    );
  }

  return (
    <>
      <ScreenHead
        title="Messages"
        sub={`${unreadCount} unread`}
        actions={
          <button type="button" className="btn primary" onClick={() => startCompose()}>
            <SquarePen aria-hidden="true" size={14} strokeWidth={1.8} />
            New message
          </button>
        }
      />
      <ScreenBody className="ms-body">
        <div className="ms-split" data-open={current ? "true" : "false"}>
          <div className="ms-list">
            <h3 className="sr-only">Conversations</h3>
            <div className="ms-filters">
              <SearchField
                value={query}
                onChange={setQuery}
                label="Search messages"
                placeholder="Search subject, name, text"
              />
              <Segmented
                options={folders}
                value={folder}
                onChange={(f) => {
                  setFolder(f);
                  setKind("all");
                }}
                label="Folder"
              />
              <Chips options={kinds} value={kind} onChange={setKind} label="Sender type" />
            </div>
            <div className="ms-listScroll">{listBody}</div>
          </div>
          <div className="ms-pane">
            {current ? (
              <Reader
                key={current.id}
                t={current}
                onBack={() => setOpenId(null)}
                onUpdate={update}
                onMarkUnread={() => markUnread(current.id)}
              />
            ) : (
              <div className="ms-none">
                <EmptyState
                  title="Select a conversation"
                  action={
                    <button type="button" className="btn ghost sm" onClick={() => startCompose()}>
                      New message
                    </button>
                  }
                >
                  {unreadCount ? `${unreadCount} unread in your inbox.` : "You're all caught up."}
                </EmptyState>
              </div>
            )}
          </div>
        </div>
      </ScreenBody>
      <ComposeSheet
        key={composeTo}
        open={composing}
        onClose={() => setComposing(false)}
        initialTo={composeTo}
        onSend={sendNew}
      />
    </>
  );
}
