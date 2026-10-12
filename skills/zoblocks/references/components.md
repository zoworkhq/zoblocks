<!--
  GENERATED FILE — DO NOT EDIT.
  Produced by `pnpm gen` from the component catalog and
  packages/component-meta/src/integration.ts. CI fails if it is stale.
-->

# ZoBlocks components

Every component in the public catalog. **Use the MCP server when it is connected**
— `get_component` has the props, `get_component_examples` the code. This list
is the fallback, and it is enough to know what exists.

ZoBlocks ships clinical components, loaders and a few controls — not a general UI kit. There is no ZoBlocks Button, Input, Select or Modal: use the app's own UI library for those (Ant Design, Material UI, or plain elements), and never invent a ZoBlocks import that is not in the catalog.

| Component | Import from | What it is | Install |
| --- | --- | --- | --- |
| Accordion (`accordion`) | `@/components/zoblocks/accordion` | A disclosure widget whose headers can be read while closed, with a per-section access model for content a reader may not simply be shown. | `npx @zoblocks/cli add accordion` |
| Allergy Chip (`allergy-chip`) | `@/components/zoblocks/allergy-chip` | The chip that refuses to conflate how bad the last reaction was with how bad the next one could be. | `npx @zoblocks/cli add allergy-chip` |
| Breath Loader (`breath-loader`) | `@/components/zoblocks/breath-loader` | Three rings expanding and fading from a soft core, paced at a resting breath rather than a spinner's tempo. | `npx @zoblocks/cli add breath-loader` |
| Care Team Presence (`care-team-presence`) | `@/components/zoblocks/care-team-presence` | Presence with clinical semantics: in session, on call, signed out to whom — and who else is in this chart right now. | `npx @zoblocks/cli add care-team-presence` |
| Care Timeline (`care-timeline`) | `@/components/zoblocks/care-timeline` | A patient's chronology that cannot be rendered without saying what it is a view of — the window, the sources, the filters and the order. | `npx @zoblocks/cli add care-timeline` |
| Chart Accordion (`chart-accordion`) | `@/components/zoblocks/chart-accordion` | A record's sections with their headers composed to the house rules, so a severity can never reach the screen without the words that explain it. | `npx @zoblocks/cli add chart-accordion` |
| Chart Command Palette (`chart-command-palette`) | `@/components/zoblocks/chart-command-palette` | A command palette that understands clinical verbs, scopes every search to a treatment relationship, and audits the searches it refuses. | `npx @zoblocks/cli add chart-command-palette` |
| Chart Context Menu (`chart-context-menu`) | `@/components/zoblocks/chart-context-menu` | A context menu that names what it is about before it offers to change it, ranks verbs by consequence, and counts the actions it withholds. | `npx @zoblocks/cli add chart-context-menu` |
| Chart Header (`chart-header`) | `@/components/zoblocks/chart-header` | Persistent patient context that collapses to a safety bar rather than to a name, and never renders administrative gender beside a dose. | `npx @zoblocks/cli add chart-header` |
| Clinical Note (`clinical-note`) | `@/components/zoblocks/clinical-note` | A clinical note editor that records where every character came from, and refuses to let anyone sign what they have not read. | `npx @zoblocks/cli add clinical-note` |
| Clinical Status (`clinical-status`) | `@/components/zoblocks/clinical-status` | One closed status vocabulary: nine scales whose every step carries a hue, a CSS shape and a word, emitted together or not at all. | `npx @zoblocks/cli add clinical-status` |
| Copilot (`copilot`) | `@/components/zoblocks/copilot` | A floating clinical copilot: a dock above the chart that takes a question and opens into a sourced, auditable thread. | `npx @zoblocks/cli add copilot` |
| Data Grid (`data-grid`) | `@/components/zoblocks/data-grid` | A worklist that states what it is showing out of what, holds arriving results behind a line, and names the model when you sort by one. | `npx @zoblocks/cli add data-grid` |
| Date Picker (`date-picker`) | `@/components/zoblocks/date-picker` | One temporal control with sixteen variants: field, calendar, date and time ranges, birth date, session, slots, recurrence and the read-only record. | `npx @zoblocks/cli add date-picker` |
| Helix Loader (`helix-loader`) | `@/components/zoblocks/helix-loader` | Two strands of dots turning on a slow sine. For the parts of a product that are laboratory rather than bedside. | `npx @zoblocks/cli add helix-loader` |
| Infusion Loader (`infusion-loader`) | `@/components/zoblocks/infusion-loader` | A capsule with a soft slug — the only loader in the set that can tell the truth about how much is left. | `npx @zoblocks/cli add infusion-loader` |
| Provenance Chip (`provenance-chip`) | `@/components/zoblocks/provenance-chip` | Where a value came from, how it got here, and how much of it a human has actually looked at. | `npx @zoblocks/cli add provenance-chip` |
| Pulse Loader (`pulse-loader`) | `@/components/zoblocks/pulse-loader` | An open heart with a rhythm line running through it, beating at a resting sixty. The library's signature wait. | `npx @zoblocks/cli add pulse-loader` |
| Recent Patient Stack (`recent-patient-stack`) | `@/components/zoblocks/recent-patient-stack` | A multi-chart workspace that makes the active patient unmistakable, because the alternative is eleven identical browser tabs. | `npx @zoblocks/cli add recent-patient-stack` |
| Recorder (`recorder`) | `@/components/zoblocks/recorder` | A capture surface that cannot lie about whether it is listening. Five arts over one signal engine, and thirteen failure modes it can tell apart. | `npx @zoblocks/cli add recorder` |
| Result Value (`result-value`) | `@/components/zoblocks/result-value` | A single observation rendered so that the four ways a number can lie to you are all impossible. | `npx @zoblocks/cli add result-value` |
| Rhythm Loader (`rhythm-loader`) | `@/components/zoblocks/rhythm-loader` | One rhythm strip, swept like a monitor. The quietest way for an interface to say it is still there. | `npx @zoblocks/cli add rhythm-loader` |
| Risk Indicator (`risk-indicator`) | `@/components/zoblocks/risk-indicator` | A risk score that cannot be displayed without its date, its drivers, and the fact that it is not a diagnosis. | `npx @zoblocks/cli add risk-indicator` |
| Safety Plan (`safety-plan`) | `@/components/zoblocks/safety-plan` | The six steps of the Stanley-Brown Safety Planning Intervention, in order, with the crisis step rendered open and uncloseable. | `npx @zoblocks/cli add safety-plan` |
| Switch (`switch`) | `@/components/zoblocks/switch` | A binary control for a record that is shared, asynchronous, and often missing the fact you are asking it about. | `npx @zoblocks/cli add switch` |
| Timeline (`timeline`) | `@/components/zoblocks/timeline` | Ant Design v6's Timeline, prop for prop, with the accessible name and the ordered-list semantics it does not ship. | `npx @zoblocks/cli add timeline` |
| Trend Indicator (`trend-indicator`) | `@/components/zoblocks/trend-indicator` | A sparkline that refuses to draw a trend it cannot justify — across an assay change, a unit change, or two points. | `npx @zoblocks/cli add trend-indicator` |
| Patient identity (`identity`) | `@zoblocks/identity` | An avatar, a chip and a patient banner — with the pass that keeps two patients who share a name apart on the same worklist. | not built yet |
| Signature (`signature`) | `@zoblocks/signature` | Signature capture that records the times nobody signed — declined, unable, verbal, on paper — not just the times they did. | `pnpm add @zoblocks/signature` |
| Tabs (`tabs`) | `@zoblocks/tabs` | Tabs that know what they are: a view switch, a link list, a form value or a wizard — four accessibility trees behind one silhouette. | `pnpm add @zoblocks/tabs` |
