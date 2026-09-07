---
"@zoblocks/copilot-core": minor
"@zoblocks/copilot-react": minor
"@zoblocks/copilot": minor
"@zoblocks/copilot-evals": minor
---

First release: Copilot, a floating clinical assistant.

The name is the category term, chosen for discoverability. It carries a tension
worth naming: a copilot has shared control of the aircraft, and this component
proposes while a human commits. Three things carry the weight the name gives up
and none is optional now — the disclosure line is never dismissible, the confirm
step defaults focus to Discard, and the answer register is derived rather than
asserted by a provider.

Not an AI chat component. The chat is the part customers recognise; the
accountability layer around the model is the part they are buying. The floating
dock and the streaming text are two weeks of work and compete with a hundred
free widgets — deciding what the model may see, proving where an answer came
from, keeping chart text from being read as instructions, and knowing whether
the thing makes clinicians better or worse are the parts a digital-health team
cannot build in a sprint.

**Modes are scope contracts, not prompt presets.** A mode declares what it may
read, which tools it may call, what it may output, and what risk it carries.
"Can Look up see the problem list?" has an answer you read off a config object
and hand to a compliance officer, rather than one you infer from English.

**Verification is designed to cost less than acceptance.** Automation bias is an
effort asymmetry, not a character flaw: if accepting costs one click and
checking costs four and a new tab, people accept. Citations resolve _during_
streaming so the sources drawer opens from cache, and it shows the retrieved
passage with the supporting clause highlighted — a link is a citation, a passage
is a verification.

**Crisis is terminal, and deterministic.** A rule-based classifier runs before
the model, evaluates the whole thread, and replaces the answer rather than
annotating it. It is tuned so that clinical documentation — "denies SI",
"C-SSRS negative", "history of overdose in 2019" — does not escalate, which is
what makes it usable in the specialty that needs it most. Crisis lines resolve
by locale, because 988 works in the United States and nowhere else.

**Behavioral health ships clinician-facing only.** Illinois, Nevada and Utah
each regulate AI in mental health differently and Nevada prohibits it outright,
so the patient-facing configuration is not a flag — `assertClinicianFacing`
throws. There is no sentiment or affect analysis anywhere in the package;
Illinois enumerates that specifically.

**The eval harness ships as a package**, with the 70% reliability floor as a
release gate rather than a dashboard metric. Below it, decision support makes
clinicians worse than no decision support, and that belongs in CI as a failing
test.

Four packages: a dependency-free engine, a headless React layer that owns the
streaming-announcement strategy and the combobox keyboard model, an antd skin,
and the eval harness. The registry item is a second skin over the same two
packages — which settles the wrap-versus-registry question Signature left open,
because almost none of Copilot is actually antd.

Also adds `@zoblocks/no-stigmatising-language` to the ESLint plugin, matching
the runtime check on model output.
