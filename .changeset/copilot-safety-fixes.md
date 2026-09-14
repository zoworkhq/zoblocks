---
"@zoblocks/copilot-core": patch
"@zoblocks/copilot-react": patch
"@zoblocks/copilot": patch
"@zoblocks/react": patch
---

Copilot safety fixes.

- **Crisis detection no longer lets a negation cancel a disclosure.** "I want
  to kill myself, no plan yet" now escalates. A negation cancels only the phrase
  it covers ("denies SI or self-harm", "I don't want to hurt myself"), so notes
  that record present risk next to a denial now block where they did not.
- **"od" after a dose is no longer read as overdose.** "ramipril 5 mg od" used
  to lock the thread in crisis. Overdose wording ("took an OD", "OD'd") still
  escalates.
- **"Show sources" shows that answer's sources.** New `openSourcesFor(messageId)`
  opens one message's sources; `openSources()` still opens the latest. The new
  `citations` field pairs each source with its marker, and the drawer numbers
  sources by marker.
- **Proposals are cleared on stop, error, crisis and mode change.** Confirming a
  prohibited proposal now shows a `contract-violation` error rather than
  throwing.
- **History dates only the phrase it qualifies.** "History of SI, now actively
  suicidal" now escalates; "history of SI, no current ideation" stays clear.
  History is masked like negation, and "past week" or "prior to admission" are
  not history.
- **Bare "suicidal" about a patient escalates.** "Patient is suicidal without a
  plan" and "pt suicidal" block. "Not suicidal" and "denies being suicidal" stay
  clear.
- **A prohibited proposal renders no Confirm.** New `proposalRisk` on the hook;
  the card shows Discard and a notice.
- **A proposal shows only once the answer is checked.** `proposal` is null
  mid-stream (new `pendingProposal` selector), and dropped when checks refuse
  the answer. Dwell time starts when the card can render.
- **The registry skin shows each answer's own sources**, numbered by marker.
- **Dictation cannot start mid-answer.** The mic is disabled while streaming, so
  Stop is never lost.
- **Late actions from a stopped or replaced exchange are ignored.** Pipeline
  actions carry their exchange id, and the provider is not called once stopped.
- **A provider error event is recorded as a failure**, in the audit and in new
  `failed` telemetry, not as an answer.
- **Answers with a proposal are announced**, and start the verification clock.
- **Feedback targets the answer it was given on.** New `sendFeedbackFor`; the
  reason picker shows under that answer only. Messages carry `exchangeId`.
- **"Daily" and "weekly" count as dosing only beside a medication.** "Attends
  weekly sessions" is no longer refused.
- **Apostrophes are not quotation marks.** Text after "patient's" is checked for
  stigmatising language again.
- **Crisis detection catches acts, reported ideation and risk to others.** An
  overdose or attempt that has happened, "wants to kill himself", "cutting
  herself", "at risk of suicide", "homicidal", "wants to kill his wife", and
  risk about someone other than the patient now block as clinical risk. "I took
  an overdose" is imminent. "Cannot rule out" no longer negates.
- **Recent past escalates; distant past is history.** Hours, days, weeks and
  months ("suicidal last week") block. Years, a year, and life stages ("as a
  teenager") stay clear, as does "family history of suicide".
- **A drug name with a bare frequency is dosing.** "Bisoprolol daily" and "PO
  daily" are caught again; "daily walks" is not.
- **Crisis detection catches lethal means and passive ideation.** "Jumped off a
  bridge", "found hanging", "has a noose", "stockpiling pills", "ingested
  bleach", "self-inflicted laceration", "passive death wish", "life is not worth
  living", "wishes she wouldn't wake up" and "endorses HI" block as clinical
  risk. "I drank bleach", "I have a noose", "I cut myself on purpose" and "I've
  been cutting myself" are imminent; "I cut myself" stays clear. Denials,
  accidental poisoning and old scars stay clear.
- **Population statements and overdose management questions stay clear.** "High
  risk of suicide in men over 45" names no one, so it no longer blocks; naming a
  patient still does. "Treatment for patient who took an overdose" is a
  management question and clears, but "the patient took an overdose 2 hours ago"
  and any other risk in the same message still block. "Wanted to die as a
  teenager" is history.
- **The registry skin records a thumbs-down.** It has no reason picker, so it
  records at once. New `{ askReason: false }` option on `sendFeedbackFor`.
