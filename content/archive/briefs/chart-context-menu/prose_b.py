# -*- coding: utf-8 -*-
"""Hero and sections 11-21."""
import html as _h
import re

_KW = (r"\b(?:interface|type|export|import|from|readonly|string|number|boolean|null|undefined|"
       r"void|const|let|function|return|if|else|new|extends|Set|Record|Promise|React|true|false|"
       r"as|declare|namespace|describe|it|expect|await|async)\b")
_PAT = re.compile(r"(/\*[\s\S]*?\*/|//[^\n]*|#[^\n]*)|(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|" + _KW)


def code(src):
    """Minimal highlighter — comments, strings, keywords. Same three classes the rest of the series uses."""
    out, pos = [], 0
    for m in _PAT.finditer(src):
        out.append(_h.escape(src[pos:m.start()]))
        cls = "c-c" if m.group(1) else "c-s" if m.group(2) else "c-k"
        out.append('<span class="%s">%s</span>' % (cls, _h.escape(m.group(0))))
        pos = m.end()
    out.append(_h.escape(src[pos:]))
    return "<pre><code>" + "".join(out) + "</code></pre>"


HERO = """    <div class="eyebrow">Oxygen UI · component brief · 31 August 2026</div>
    <h1>Chart Context Menu</h1>
    <p class="lede">The right-click menu is the shortest path in a clinical interface to an
      irreversible act — and it opens on top of the row that said whose act it was. This is a
      proposal for the healthcare version: a menu that names its subject before it offers to change
      it, ranks its verbs by consequence rather than by a <code>destructive</code> boolean, counts
      the actions it is withholding instead of hiding them, and records a disclosure the moment it
      offers one.</p>
    <div class="hero-meta">
      <span class="pill on">ChartContextMenu</span>
      <span class="pill on">menu-core</span>
      <span class="pill">17 live figures</span>
      <span class="pill">21 sections</span>
      <span class="pill">2 in-situ mockups</span>
      <span class="pill">4 consequence tiers</span>
      <span class="pill">14 declared states</span>
      <span class="pill">0 runtime dependencies</span>
      <span class="pill">WCAG 2.2 AA</span>
    </div>"""


SECTIONS_B = [

# ----------------------------------------------------------------- 11
{
"id": "surfaces", "short": "Three surfaces",
"title": "Three ways in, one action list — because a right-click-only feature is one most people never find",
"kicker": """<p>The same resolved menu, rendered three ways. If the three diverge, people learn one
  and lose the other two, which is how a workflow shortcut becomes tribal knowledge.</p>""",
"body": """
        <figure>
          <div class="antd">
            <div data-fig="present"></div>
          </div>
          <figcaption><b>Figure 14 — pointer popup, anchored to the ⋯ button, and the touch
            sheet.</b> One <code>resolveMenu()</code> result behind all three.</figcaption>
        </figure>

        <div class="grid g3">
          <div class="card">
            <span class="k">popup</span>
            <h4>At the cursor</h4>
            <p>Flip and shift against the nearest clipping ancestor, so a menu inside a scrolling
              chart pane stays inside it. <code>transform-origin</code> is set to the quadrant it
              opened into, so the 140ms scale-in reads as coming <em>from</em> the click.</p>
            <p><b>The pointer lands on the subject header</b>, every time — with the popup's
              corner placed three pixels <em>behind</em> the cursor, because with it exactly on the
              cursor an 8px <code>border-radius</code> leaves the pointer outside the menu shape.
              Visually indeterminate; measurably different.</p>
          </div>
          <div class="card">
            <span class="k">anchored</span>
            <h4>From a ⋯ button</h4>
            <p>The discoverable path, and the one a touch device without a long-press habit will
              use. Offset so the menu does not cover the button that opened it — WCAG 2.2
              <b>2.4.11 Focus Not Obscured</b> applies the moment focus returns to it.</p>
            <p>Same menu, same order, same tiers. Nothing is "the desktop version".</p>
          </div>
          <div class="card">
            <span class="k">sheet</span>
            <h4>Long-press, below 40rem</h4>
            <p>Pinned to the bottom edge rather than floating at the finger, because the finger is
              covering wherever it pressed. 44px rows. The subject header stays pinned at the top of
              the sheet while the list scrolls.</p>
            <p><b>Long-press cancels on scroll and on a 10px move</b>, or a nurse carrying a tablet
              opens menus with their palm.</p>
          </div>
        </div>

        <div class="note warn">
          <span class="lbl">One thing I would not ship in v1</span>
          <p>Submenus get an <b>intent delay</b> (100ms open, 0ms close, the Base UI defaults) but
            <b>not a safe triangle</b> in v1. The safe triangle — tracking the pointer's path toward
            the submenu so a diagonal sweep does not close it — is about 80 lines of geometry and
            three of the four bugs I have seen in hand-rolled menus. It is v2, and until then
            submenus are limited to <code>routine</code> actions only, where the cost of an
            accidental close is that you move the mouse again.</p>
        </div>
""",
},

# ----------------------------------------------------------------- 12
{
"id": "a11y", "short": "Accessibility",
"title": "Accessibility architecture, and the one trick that pays for the subject header twice",
"kicker": """<p>A context menu that only opens on right-click fails WCAG 2.1.1 outright. Beyond
  that, the interesting part is that the safety design and the screen-reader design turn out to be
  the same design.</p>""",
"body": """
        <div class="note ok">
          <span class="lbl">The trick</span>
          <p>The subject header is <code>role="presentation"</code> and unreachable — but the menu
            carries <code>aria-labelledby</code> pointing at it. So the popup's <em>accessible
            name</em> is the subject: a screen reader announces <em>"Aluel Okonkwo, MRN 44-2871,
            menu, 8 items"</em> on open. A sighted user gets the wrong-patient check by reading it;
            a screen-reader user gets it in the role announcement, before any item. One element,
            both audiences, no duplicated string.</p>
        </div>

        <div class="tw">
          <table>
            <thead><tr><th>SC</th><th>Name</th><th>How</th></tr></thead>
            <tbody>
              <tr><td><code>2.1.1</code></td><td>Keyboard</td><td><b>Shift+F10 and the Menu key open the menu</b>, handled explicitly rather than relying on the browser's synthesised <code>contextmenu</code> event — Chrome and Firefox fire it, Safari does not. Then ↓ ↑ Home End, Enter/Space, Escape, and typeahead on the first letter.</td></tr>
              <tr><td><code>4.1.2</code></td><td>Name, role, value</td><td><code>role="menu"</code> named by the subject header; <code>menuitem</code> / <code>menuitemcheckbox</code> / <code>menuitemradio</code> with <code>aria-checked</code>; <code>aria-haspopup="menu"</code> on the trigger, with <code>role="button"</code> as an overridable default — and deliberately <b>not</b> <code>aria-expanded</code>, which axe rejects on a generic element and treats as conditional on a table row (see §21); <code>aria-disabled</code> rather than <code>disabled</code>, so the row stays reachable and its reason stays readable.</td></tr>
              <tr><td><code>2.4.3</code></td><td>Focus order</td><td>Focus enters the menu on a keyboard open and <b>returns to the trigger on every close path</b> — Escape, running an item, clicking away, an external close. A test asserts all four, because this is the failure that strands the user the feature was built for.</td></tr>
              <tr><td><code>2.4.11</code></td><td>Focus not obscured (min)</td><td>The <code>anchored</code> presentation offsets so the ⋯ button is not covered when focus returns to it. In a scrolling pane, closing scrolls the trigger back into view if the pane moved under the open menu.</td></tr>
              <tr><td><code>2.5.2</code></td><td>Pointer cancellation</td><td>Opening happens on the <code>contextmenu</code> event; <b>activation happens on the up-event</b>. Pressing down on <code>Discontinue</code> and dragging off it does nothing. On touch, the long-press opens; it never activates.</td></tr>
              <tr><td><code>2.5.8</code></td><td>Target size (min)</td><td>30px rows comfortable, 26px compact, 44px in the touch sheet — all above the 24×24 CSS-pixel floor, measured including the spacing exception.</td></tr>
              <tr><td><code>1.4.1</code></td><td>Use of colour</td><td>Every tier carries <b>a glyph, a position and a word</b> as well as a hue. Unavailable is struck through <em>and</em> states its reason. Withheld carries a lock <em>and</em> a sentence. Nothing in this component is legible only in colour.</td></tr>
              <tr><td><code>1.4.11</code></td><td>Non-text contrast</td><td>Band separators, the subject header's border and the focus ring are all checked pairs. The tier colours reuse the existing <code>--ox-status-*</code> ramp, so the contrast gate already covers them — see §17.</td></tr>
              <tr><td><code>4.1.3</code></td><td>Status messages</td><td>A polite live region on open: <em>"8 actions for Aluel Okonkwo, 1 hidden"</em>. It announces content, never an empty string — so when nothing is withheld the clause is absent rather than read as "0 hidden".</td></tr>
              <tr><td><code>1.4.10</code></td><td>Reflow</td><td>Below 40rem the menu becomes the sheet. At 320px and 200% zoom it is full-width with 44px rows and no keyboard hints, because there is no keyboard to hint at.</td></tr>
              <tr><td><code>3.3.4</code></td><td>Error prevention</td><td>The two-step ladder for <code>clinical</code> and <code>disclosive</code>. The confirmation is reversible, labelled with the verb rather than "OK", and drawn where the pointer already is.</td></tr>
            </tbody>
          </table>
        </div>

        <figure>
          <div class="antd">
            <div data-fig="keyboard"></div>
          </div>
          <figcaption><b>Figure 15 — no pointer required.</b> Tab to the row, then Shift+F10. The
            log shows what each key does. Note that the highlight opens on the <em>first verb</em>,
            not on the subject header — a keyboard user has already read the row they were on, and
            making them arrow past an inert header is a tax the pointer user does not pay.</figcaption>
        </figure>

        <div class="note">
          <span class="lbl">Screen-reader specifics, recorded before <code>stable</code></span>
          <p>NVDA and JAWS both drop out of browse mode into an application-mode menu on
            <code>role="menu"</code>, which is what we want and is why the arrow keys must be
            handled rather than left to the virtual cursor. VoiceOver does not, so the rows must
            also be reachable with VO+arrow — which they are, because they are real elements in DOM
            order rather than a virtualised list. All three are recorded per ENGINEERING.md §6
            before the component leaves <code>beta</code>.</p>
        </div>
""",
},

# ----------------------------------------------------------------- 13
{
"id": "finish", "short": "Theme & motion",
"title": "Light, dark, density, forced colours, RTL — and the one moment the menu is allowed to move",
"kicker": """<p>The theming is the cheap part, because the tier colours are existing semantic
  tokens. The interesting paragraph is the last one.</p>""",
"body": """
        <figure>
          <div class="antd">
            <div data-fig="density"></div>
          </div>
          <figcaption><b>Figure 16 — two densities.</b> Compact is 26px, which is above the WCAG 2.2
            2.5.8 floor of 24. There is no third, denser option, and there will not be: below 24px
            the component would ship a mode that fails a success criterion, and a density token is
            not worth a conformance exception.</figcaption>
        </figure>

        <div class="grid g2">
          <div class="card">
            <span class="k">Forced colours</span>
            <h4>The tiers survive without their hues</h4>
            <p><code>forced-colors: active</code> discards every background. So: the highlighted row
              takes <code>Highlight</code>/<code>HighlightText</code> with
              <code>forced-color-adjust: none</code>; the subject header keeps a
              <code>CanvasText</code> border because its background is what made it read as inert;
              disabled rows use <code>GrayText</code>; and the confirm and reason strips get real
              borders rather than tinted fills.</p>
            <p><b>The tier is still legible</b>, because it was never only a colour — it is a glyph,
              a band position and a sentence.</p>
          </div>
          <div class="card">
            <span class="k">RTL</span>
            <h4>Logical properties only</h4>
            <p>Every offset is <code>inset-inline-*</code> / <code>padding-inline-*</code>. The
              submenu chevron flips, the popup's flip logic works in inline terms, and the
              <code>transform-origin</code> quadrant is computed from the writing mode rather than
              from <code>left</code>.</p>
            <p><b>The trap from the timeline brief still applies:</b> <code>inset-block-*</code>
              resolves against the element's own writing mode, so anything inside a rotated label
              needs physical properties. There is nothing rotated here, which is the reason to keep
              it that way.</p>
          </div>
        </div>

        <h3>Motion</h3>
        <div class="layers">
          <div><div class="l">140ms</div><div class="d">Popup scale-in from the quadrant it opened into — <code>cubic-bezier(.16,1,.3,1)</code>, opacity plus a 0.97 scale. Short enough that a fast user never waits on it.</div></div>
          <div><div class="l">180ms</div><div class="d">The touch sheet rising from the bottom edge. Longer, because the travel is longer and a sheet that snaps looks like a rendering glitch.</div></div>
          <div><div class="l">0ms</div><div class="d"><b>Everything else.</b> No row-hover transition, no height animation on the confirm strip, no crossfade between steps. A menu is a thing you are already pointing at.</div></div>
          <div><div class="l">reduced</div><div class="d"><code>prefers-reduced-motion</code> removes both entrances entirely — not a shortened one. The pending placeholder's shimmer becomes a static dashed rule, which is a <em>designed</em> still state rather than a paused animation frozen mid-sweep (ENGINEERING.md §6).</div></div>
        </div>

        <div class="note warn">
          <span class="lbl">The honest exception to "the menu never moves"</span>
          <p>Choosing a <code>clinical</code> action draws a confirmation strip <em>under</em> that
            row. Rows above it do not move — that is the whole reason the strip is placed there
            rather than replacing the list — but the menu gets taller, and if it was already near
            the bottom of the viewport it shifts up to stay on screen. <strong>That is a real
            movement and I am not going to pretend otherwise.</strong> It is acceptable because it
            happens <em>after</em> the user has committed to a two-step action, at which point the
            pointer is no longer in flight toward something else, and because the alternative —
            reserving space for a confirmation that usually never appears — makes every menu taller
            than it needs to be. If you disagree, the fix is <code>confirmPlacement: "replace"</code>
            and it is one of the open questions in §20.</p>
        </div>
""",
},

# ----------------------------------------------------------------- 14
{
"id": "states", "short": "State matrix",
"title": "Fourteen declared states, all rendered",
"kicker": """<p>ENGINEERING.md §9: every state declared in <code>meta.ts</code> has a story, and
  that is what makes the declared list honest. Here is the whole list, drawn by the prototype rather
  than described.</p>""",
"body": """
        <div class="antd">
          <div data-fig="states"></div>
        </div>

        <figcaption style="margin-top:0.5rem"><b>Figure 17 — the state matrix.</b> Each tile is a
          real <code>resolveMenu()</code> output rendered statically. States 13 and 14 are the two
          that are usually missing from a component library and always present in a hospital: a role
          for which this record supports nothing, and a role for which everything exists and nothing
          is permitted. They read differently on purpose — <em>"This record supports no
          actions"</em> against <em>"No action on this record is available to you"</em>.</figcaption>

        <div class="tw">
          <table>
            <thead><tr><th>#</th><th>State</th><th>What has to be true</th></tr></thead>
            <tbody>
              <tr><td>01</td><td>Routine only</td><td>No separators, no second lines, no confirmation ladder. The common case must stay cheap.</td></tr>
              <tr><td>02</td><td>A recorded action</td><td>The <code>records</code> line is present <em>before</em> the row is chosen.</td></tr>
              <tr><td>03</td><td>Clinical, step 1</td><td>Choosing it does not run it. The row stays highlighted.</td></tr>
              <tr><td>04</td><td>Clinical, step 2</td><td>Strip under the row, verb-labelled button, a reversible "Keep".</td></tr>
              <tr><td>05</td><td>Disclosure, reasons</td><td>Radio list, and the audit record already emitted.</td></tr>
              <tr><td>06</td><td>Unavailable, with reason</td><td>Struck through, in position, reason as text, still keyboard-reachable.</td></tr>
              <tr><td>07</td><td>Withheld, counted</td><td>A lock row with a sentence, inside the menu.</td></tr>
              <tr><td>08</td><td>Pending</td><td>Placeholder at final height, skipped by the arrow keys.</td></tr>
              <tr><td>09</td><td>Masked subject</td><td>Header says <em>Restricted record</em>; nothing resolves the name.</td></tr>
              <tr><td>10</td><td>Bulk selection</td><td>Header counts; non-bulk verbs disabled with a reason.</td></tr>
              <tr><td>11</td><td>Checkbox and radio</td><td>Toggles do not close the menu; capped at <code>routine</code>.</td></tr>
              <tr><td>12</td><td>Submenu</td><td>Chevron, <code>aria-haspopup</code>, routine-only in v1.</td></tr>
              <tr><td>13</td><td>Nothing available</td><td>The record genuinely supports no verbs.</td></tr>
              <tr><td>14</td><td>Everything withheld</td><td>Verbs exist; none are yours. Different sentence, deliberately.</td></tr>
            </tbody>
          </table>
        </div>
""",
},

# ----------------------------------------------------------------- 15
{
"id": "api", "short": "API & props",
"title": "The API, in full",
"kicker": """<p>Two modules. <code>menu-core</code> is L0 — no React, no DOM, no network, runs in
  Node — and is where every decision lives. <code>ChartContextMenu</code> is the binding.</p>""",
"body": """
        <h3>L0 — <code>@/lib/oxygen-menu</code></h3>
""" + code("""export type ActionTier = "routine" | "documented" | "clinical" | "disclosive";

/** What was right-clicked. The menu may never say more about it than the row did. */
export interface MenuSubject {
  /** FHIR resource type where there is one; any string where there is not. */
  resource: string;
  id: string;
  /** Exactly the label the row showed. */
  label: string;
  /** The qualifier that distinguishes two rows that look alike. */
  detail?: string;
  /** True when the trigger row was masked. Forces the header to stay masked. */
  masked?: boolean;
  /** The rest of a multiple selection. Ids only — the menu never names them. */
  also?: readonly { resource: string; id: string }[];
  /** "patients", "results". Used for the bulk header; defaults to "items". */
  plural?: string;
  /**
   * The bulk header's second line. NOT `detail` — see the defect note in
   * §20. About the selection, never about one member of it.
   */
  bulkDetail?: string;
}

export type Availability =
  | { status: "available" }
  | { status: "pending" }
  | { status: "unavailable"; reason: string }
  | { status: "withheld" };

export interface MenuAction {
  id: string;
  label: string;
  tier: ActionTier;
  /** A heading inside the tier band. Bands are never merged across tiers. */
  group?: string;
  icon?: React.ReactNode;
  /** Displayed, never bound. The host owns its own shortcuts. */
  shortcut?: string;
  /** Resource types this verb belongs on. Required above tier="routine". */
  applies?: readonly string[];
  /** Absent means available. */
  availability?: Availability;

  /** REQUIRED for tier="documented" — what it writes and who reads it. */
  records?: string;
  /** REQUIRED for tier="clinical" — the sentence shown before it runs. */
  confirm?: string;
  /** The confirm button's label. Defaults to `label`; never "OK". */
  confirmVerb?: string;
  /** REQUIRED for tier="disclosive" — the reasons a reader may record. */
  reasons?: readonly string[];

  /** Default "single": not offered on a multiple selection. */
  bulk?: "single" | "allowed";
  /** REQUIRED when tier="clinical" meets bulk="allowed". "{n}" interpolates. */
  bulkConfirm?: string;

  /** View state only. The validator refuses these above tier="routine". */
  kind?: "command" | "checkbox" | "radio";
  checked?: boolean;
  radioGroup?: string;

  /** v1: routine actions only, because v1 has no safe triangle. */
  submenu?: readonly MenuAction[];
  /** Matched by the palette adapter; never shown, never ranked here. */
  keywords?: readonly string[];
}

export interface MenuPolicy {
  /** Named in the withheld sentence: "hidden for a registered nurse". */
  role?: string;
  /** Ids this actor may run. Anything absent is withheld and counted. */
  permitted?: readonly string[];
  /** Whether an override path exists at all, for the withheld sentence. */
  breakGlass?: boolean;
}""") + """

        <div class="tw">
          <table>
            <thead><tr><th>Function</th><th>Signature</th><th>What it decides</th></tr></thead>
            <tbody>
              <tr><td><code>resolveMenu</code></td><td><code>(subject, actions, policy?) → ResolvedMenu</code></td><td><b>The component.</b> Drops non-applicable verbs, counts withheld ones, bands by tier, disables non-bulk verbs on a selection. Pure; deterministic; the only thing the tests need.</td></tr>
              <tr><td><code>appliesTo</code></td><td><code>(action, subject) → boolean</code></td><td>Whether a verb belongs on a noun.</td></tr>
              <tr><td><code>describeSubject</code></td><td><code>(subject) → { who, what, masked, bulk }</code></td><td>The header line. <b>Refuses to resolve a masked name.</b></td></tr>
              <tr><td><code>describeHiddenActions</code></td><td><code>(n, policy?) → string | null</code></td><td>The withheld sentence, or <code>null</code> — never an empty row.</td></tr>
              <tr><td><code>actionOutcome</code></td><td><code>(action, state?) → MenuOutcome</code></td><td>The whole ladder: <code>run</code> · <code>confirm</code> · <code>reason</code> · <code>blocked</code>. Testable with no DOM.</td></tr>
              <tr><td><code>disclosureRecord</code></td><td><code>(action, subject, opts) → DisclosureRecord | null</code></td><td>The audit entry, on every path. Never carries the label.</td></tr>
              <tr><td><code>bulkPartition</code></td><td><code>(actions, subject) → { allowed, single }</code></td><td>So a toolbar and a menu cannot disagree about the count.</td></tr>
              <tr><td><code>validateActions</code></td><td><code>(actions) → string[]</code></td><td>The author-side rules, as sentences. Dev-only at runtime; an eslint rule at build.</td></tr>
              <tr><td><code>nextIndex</code> · <code>focusableRows</code></td><td><code>(rows, from, delta, loop) → number</code></td><td>The keyboard model. Skips <code>pending</code>; keeps <code>unavailable</code>.</td></tr>
              <tr><td><code>toPaletteItems</code></td><td><code>(actions, subject) → PaletteItem[]</code></td><td>The adapter that puts the same verbs into ⌘K, scoped to the open chart.</td></tr>
            </tbody>
          </table>
        </div>

        <h3>L2 — <code>&lt;ChartContextMenu&gt;</code></h3>
        <div class="tw">
          <table>
            <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td><code>subject</code></td><td><code>MenuSubject</code></td><td>—</td><td><b>Required.</b> There is no menu without one, and no prop to suppress the header it produces.</td></tr>
              <tr><td><code>actions</code></td><td><code>readonly MenuAction[]</code></td><td>—</td><td>One flat array for the whole surface. <code>applies</code> does the routing.</td></tr>
              <tr><td><code>policy</code></td><td><code>MenuPolicy</code></td><td><code>{}</code></td><td>Without one, nothing is withheld — which is correct for a demo and wrong for a chart.</td></tr>
              <tr><td><code>presentation</code></td><td><code>"auto" | "popup" | "anchored" | "sheet"</code></td><td><code>"auto"</code></td><td><code>auto</code> = sheet below 40rem or on a coarse pointer, popup otherwise.</td></tr>
              <tr><td><code>density</code></td><td><code>"comfortable" | "compact"</code></td><td>inherited</td><td>Follows the density provider unless overridden.</td></tr>
              <tr><td><code>now</code></td><td><code>string</code></td><td>—</td><td>ISO instant, injected. <b>Required when any action is <code>disclosive</code></b>, because the record needs a timestamp and the component may not read the clock (ENGINEERING.md §9).</td></tr>
              <tr><td><code>onRun</code></td><td><code>(action, subject, outcome) =&gt; void</code></td><td>—</td><td>Fires only for an outcome of <code>run</code>. Receives the whole subject, <code>also</code> included, so bulk is written and reported per subject.</td></tr>
              <tr><td><code>onDisclose</code></td><td><code>(record: DisclosureRecord) =&gt; void</code></td><td>—</td><td>Fires on <code>offered</code>, <code>disclosed</code> and <code>abandoned</code>. <b>Required by the type when any action is <code>disclosive</code></b> — a disclosure with nowhere to send the record does not compile.</td></tr>
              <tr><td><code>onBlocked</code></td><td><code>(action, reason) =&gt; void</code></td><td>—</td><td>Optional. Worth wiring: a blocked verb chosen repeatedly is a permissions problem the org does not know it has.</td></tr>
              <tr><td><code>onOpenChange</code></td><td><code>(open, subject) =&gt; void</code></td><td>—</td><td>For hosts that close a hover card or pause a poll while a menu is up.</td></tr>
              <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Suppresses the menu entirely and lets the browser's own context menu through — which is the right behaviour over selected text.</td></tr>
              <tr><td><code>children</code></td><td><code>(triggerProps) =&gt; ReactNode</code></td><td>—</td><td><b>A render function, not an element.</b> In a data grid the trigger is a <code>&lt;tr&gt;</code> you do not own, so the component hands you the props to spread rather than wrapping your markup in a <code>&lt;div&gt;</code> that breaks the table.</td></tr>
              <tr><td><code>className</code></td><td><code>string</code></td><td>—</td><td>Applied to the popup.</td></tr>
            </tbody>
          </table>
        </div>

""" + code("""import { ChartContextMenu } from "@/components/oxygen/chart-context-menu";
import "@/styles/oxygen-menu.css";

<ChartContextMenu
  subject={{
    resource: "MedicationRequest",
    id: order.id,
    label: "Lisinopril 10 mg",
    detail: "Oral · daily · started 4 Mar 2026",
    masked: row.restricted,
  }}
  actions={medicationActions}
  policy={{ role: "a registered nurse", permitted, breakGlass: true }}
  now={serverTime}
  onRun={(action, subject) => dispatch(action.id, subject)}
  onDisclose={(record) => audit.write("disclosure", record)}
>
  {(trigger) => <tr {...trigger}>{cells}</tr>}
</ChartContextMenu>""") + """

        <div class="note">
          <span class="lbl">The escape hatch, and it is a first-class path</span>
          <p>If your app already ships Base UI or Radix, do not install our popup. The hook gives you
            the model and you render their parts:</p>
        </div>
""" + code("""const { resolved, withheld, triggerProps } = useChartContextMenu({ subject, actions, policy });

<ContextMenu.Root>
  <ContextMenu.Trigger render={<tr {...triggerProps} />} />
  <ContextMenu.Portal><ContextMenu.Positioner><ContextMenu.Popup>
    <SubjectHeader {...resolved.subject} />
    {resolved.sections.map((s) => ( /* … their Item / Separator / Group … */ ))}
    {withheld ? <WithheldRow n={withheld} /> : null}
  </ContextMenu.Popup></ContextMenu.Positioner></ContextMenu.Portal>
</ContextMenu.Root>"""),
},

# ----------------------------------------------------------------- 16
{
"id": "arch", "short": "Architecture",
"title": "Where the code goes, and the seven files you cannot forget",
"kicker": """<p>Adding a component to this repo touches one directory and six generated ones, and
  the generator fails the build if you miss any. Here is the full checklist for this component
  specifically, including the two traps that have cost time before.</p>""",
"body": """
        <div class="layers">
          <div><div class="l">L0</div><div class="d"><code>registry/oxygen/lib/menu.ts</code> — the resolver. No React, no DOM, no network. Runs in Node; a Vue binding would import it unchanged.</div></div>
          <div><div class="l">L0</div><div class="d"><code>registry/oxygen/lib/menu.css</code> — the stylesheet. Every colour resolves through a semantic or component token; no literals.</div></div>
          <div><div class="l">L2</div><div class="d"><code>registry/oxygen/chart-context-menu/chart-context-menu.tsx</code> — the binding. Positioning, focus, long-press, the two-step ladders. ~110 lines of it is the positioner.</div></div>
          <div><div class="l">L2</div><div class="d"><code>…/chart-context-menu.meta.ts</code> — the single source of truth for docs, registry, SEO and the props table. Everything on the eventual <code>/components/chart-context-menu</code> page is a projection of this file.</div></div>
          <div><div class="l">L2</div><div class="d"><code>…/chart-context-menu.stories.tsx</code> — docs + VRT + axe + interaction fixture, written once. One story per declared state; that is what makes §15 honest.</div></div>
          <div><div class="l">L2</div><div class="d"><code>…/chart-context-menu.test.tsx</code> — unit and integration.</div></div>
          <div><div class="l">L4</div><div class="d"><code>…/chart-context-menu.api.md</code> — api-extractor report, required at <code>stable</code>.</div></div>
        </div>

        <h3>The generated files that must be touched, in order</h3>
        <div class="feat">
          <div><div class="n">01</div><div><div class="t">A <code>menu-core</code> support item</div><div class="d">In <code>scripts/gen/emit/registry.ts</code> <b>and</b> <code>SUPPORT_ITEM_NAMES</code> in <code>config.ts</code>. It declares <code>palette-core</code> in its own <code>registryDependencies</code>, because <code>toPaletteItems</code> imports from it — a core that imports another core and does not say so fails the registry gate.</div></div></div>
          <div><div class="n">02</div><div><div class="t">Path aliases, in two places</div><div class="d"><code>scripts/gen/emit/tsconfig-paths.ts</code> <b>and</b> <code>apps/docs/tsconfig.json</code>, which is hand-kept and policed by <code>generated-paths.test.ts</code>.</div></div></div>
          <div><div class="n">03</div><div><div class="t">The stylesheet, in three places</div><div class="d"><code>react-package.ts</code> (copy list, import rewriter, styles map), an owner entry in <code>test/css-namespace.test.ts</code>, and an import in <code>apps/docs/src/app/globals.css</code>.</div></div></div>
          <div><div class="n">04</div><div><div class="t">Component tokens</div><div class="d">A <code>menu</code> group in <code>packages/tokens/tokens/component.json</code>, or the dangling-reference gate fails. Row heights go in <code>density.json</code>, not here.</div></div></div>
          <div><div class="n">05</div><div><div class="t">Docs coverage</div><div class="d">Preview scenarios in <code>component-preview.tsx</code> and card art in <code>component-card.tsx</code>. <code>docs-coverage.test.ts</code> requires both.</div></div></div>
          <div><div class="n">06</div><div><div class="t">Reciprocal <code>related</code> edges</div><div class="d">Both ends. <code>chart-context-menu</code> ↔ <code>chart-command-palette</code>, and <code>chart-context-menu</code> ↔ <code>care-timeline</code>.</div></div></div>
          <div><div class="n">07</div><div><div class="t">A changeset</div><div class="d">And the root <code>devDependencies</code> entry if the component reaches for a workspace package — the generator's typecheck cannot resolve one that is only a leaf dependency.</div></div></div>
        </div>

        <h3>Tokens: the tiers cost nothing</h3>
        <p>The four tier colours map onto semantic tokens that already exist and are already in the
          contrast gate. That is not a coincidence — the status ramp was built for exactly this kind
          of ordinal severity, and <code>restricted</code> is already the Part 2 token:</p>
        <div class="tw">
          <table>
            <thead><tr><th>Tier</th><th>Token</th><th>Already gated</th></tr></thead>
            <tbody>
              <tr><td><code>routine</code></td><td><code>--ox-text-muted</code> on <code>--ox-surface-overlay</code></td><td class="yes">yes</td></tr>
              <tr><td><code>documented</code></td><td><code>--ox-accent</code></td><td class="yes">yes</td></tr>
              <tr><td><code>clinical</code></td><td><code>--ox-status-high</code> · <code>-bg</code> · <code>-border</code></td><td class="yes">yes</td></tr>
              <tr><td><code>disclosive</code></td><td><code>--ox-status-restricted</code> · <code>-bg</code> · <code>-border</code></td><td class="yes">yes</td></tr>
            </tbody>
          </table>
        </div>
        <p>So the new <code>menu</code> group is structural only — six entries, all references:
          <code>bg</code> → <code>{surface-overlay}</code>, <code>border</code> →
          <code>{border}</code>, <code>subject-bg</code> → <code>{bg-muted}</code>,
          <code>subject-border</code> → <code>{border}</code>, <code>row-hover-bg</code> →
          <code>{bg-muted}</code>, <code>sep</code> → <code>{border}</code>. No new colour pairs,
          no new gate entries.</p>

        <div class="note bad">
          <span class="lbl">Two traps that have cost this repo time already</span>
          <p><strong>The npm barrel is flat, so every core's helpers collide on the obvious name.</strong>
            <code>palette.ts</code> already exports <code>score</code>, <code>group</code>,
            <code>rank</code>, <code>outcomeFor</code>, <code>describeWithheld</code>,
            <code>describeResults</code>, <code>applyScope</code>, <code>auditFor</code>,
            <code>KIND_ORDER</code>, <code>Unavailable</code> and — the one that bites —
            <code>RunOutcome</code>. I checked all 486 exports across
            <code>registry/oxygen/lib</code>: the names proposed in §16 are clean, and that is
            <em>why</em> they read as <code>actionOutcome</code>, <code>MenuOutcome</code>,
            <code>describeHiddenActions</code> and <code>Availability</code> rather than the obvious
            ones. <code>test/react-barrel.test.ts</code> is the gate.</p>
          <p><strong><code>@/lib/utils</code> resolves to the docs app's own utils inside the docs
            build</strong>, not the registry's. Anything shared between <code>menu.ts</code> and
            <code>palette.ts</code> — and <code>toPaletteItems</code> is exactly that — goes in its
            own <code>@/lib/oxygen-*</code> module, or it builds clean, tests clean, and fails only
            in the browser. <code>test/shared-alias-shadowing.test.ts</code> is the gate.</p>
        </div>
""",
},

# ----------------------------------------------------------------- 17
{
"id": "testing", "short": "Testing",
"title": "Assert the safety claim, not the render",
"kicker": """<p>The component's value is a set of refusals, so the suite is mostly a list of things
  that must not happen. Coverage gates are 90% statements / 85% branches at <code>stable</code>.</p>""",
"body": """
        <div class="tw">
          <table>
            <thead><tr><th>Layer</th><th>What it asserts</th><th>Why the obvious test is not enough</th></tr></thead>
            <tbody>
              <tr><td><b>Core, pure</b></td><td><code>resolveMenu</code> banding, withheld counts, bulk demotion, <code>appliesTo</code>, masked headers, the full <code>actionOutcome</code> ladder, <code>nextIndex</code> skipping pending.</td><td>No DOM, so these run in milliseconds and can be exhaustive rather than representative. Roughly 60% of the suite lives here.</td></tr>
              <tr><td><b>The refusals</b></td><td>A masked subject <b>never</b> yields the label, under any prop combination. A <code>disclosive</code> action <b>never</b> reaches <code>onRun</code> without a reason. A <code>clinical</code> action <b>never</b> runs on the first activation, including a double-click and a held Enter.</td><td>These are the three defects that would render perfectly and say something false. Each gets a property-style test over generated inputs, not one example.</td></tr>
              <tr><td><b>The audit symmetry</b></td><td><code>onDisclose</code> fires exactly once with <code>"offered"</code> when the list is drawn, and exactly once more with <code>"abandoned"</code> on Escape, on click-away, and on an external close.</td><td>Three close paths, and the one everybody forgets is click-away. A missing record here is invisible until a privacy review.</td></tr>
              <tr><td><b>Geometry</b></td><td>The first element under the opening pointer is the subject header — <code>elementFromPoint</code> at the cursor's own coordinates, at four viewport corners, in both writing directions. Thirty-three such probes across eleven figures in this report currently pass.</td><td>This is Rule 1 and it is the only one that can be broken by a CSS change alone. It is the single test I would keep if I could keep one.</td></tr>
              <tr><td><b>Stability</b></td><td>Resolving a <code>pending</code> action does not change the popup's height, and does not change the element at any previously occupied point.</td><td>A snapshot would pass while the rows moved. This asserts the bounding boxes.</td></tr>
              <tr><td><b>Keyboard</b></td><td>Shift+F10 and <code>ContextMenu</code> open it; focus returns to the trigger on all four close paths; disabled rows stay reachable and announce their reason; pending rows are skipped.</td><td>"It has a keyboard handler" is not the claim. "A person with no pointer can do everything" is.</td></tr>
              <tr><td><b>Axe</b></td><td>Zero violations per story, per theme, per density — including the confirm strip open and the reason list open, which are the two states a story usually never reaches.</td><td>Axe on the closed menu tests nothing.</td></tr>
              <tr><td><b>VRT</b></td><td>All 14 states, light and dark, comfortable and compact, plus forced-colors and RTL. Frozen <code>now</code>, paused animations, pinned browser, subset fonts.</td><td>Determinism is the requirement, not the count — a flaky VRT suite is worse than none because the team learns to ignore it.</td></tr>
              <tr><td><b>Lint rule</b></td><td><code>validateActions</code>'s six rules, as an eslint rule with its own fixture file.</td><td>The rule is the delivery mechanism for half the design. If it only warns at runtime in dev, it ships broken to anyone who tests in production mode.</td></tr>
            </tbody>
          </table>
        </div>

""" + code("""it("never yields a masked subject's label", () => {
  const subject = { resource: "DocumentReference", id: "d1",
                    label: "Group therapy note — Nwosu, C.", masked: true };
  const out = JSON.stringify(resolveMenu(subject, docActions, {}));
  expect(out).not.toContain("Nwosu");        // the whole test
});

it("records an abandoned disclosure", async () => {
  render(<ChartContextMenu {...props} onDisclose={spy} />);
  await user.pointer({ keys: "[MouseRight]", target: row });
  await user.click(screen.getByRole("menuitem", { name: /Reveal Part 2/ }));
  await user.keyboard("{Escape}");
  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy.mock.calls[0][0].outcome).toBe("offered");
  expect(spy.mock.calls[1][0].outcome).toBe("abandoned");
});"""),
},

# ----------------------------------------------------------------- 18
{
"id": "plan", "short": "Implementation plan",
"title": "Six phases, about three weeks to <code>stable</code>",
"kicker": """<p>Sized against the last four components in this repo, which is the only estimate I
  trust. The order is chosen so the thing most likely to be wrong — the tier model — is exercised by
  real action lists before any of the popup mechanics are written.</p>""",
"body": """
        <div class="phases">
          <div class="phase">
            <div class="prail"><div class="dot">1</div><div class="pline"></div></div>
            <div class="body">
              <div class="meta">2 days · <code>menu-core</code> · no React</div>
              <h4>The resolver, and its tests, before anything renders</h4>
              <p><code>menu.ts</code> in full: types, <code>resolveMenu</code>, banding,
                <code>appliesTo</code>, <code>describeSubject</code>, the outcome ladder,
                <code>describeHiddenActions</code>, <code>bulkPartition</code>,
                <code>disclosureRecord</code>, <code>nextIndex</code>. Exhaustive unit tests — this
                layer should reach 100%, because it is cheap and it is where the component lives.</p>
              <p><b>Exit:</b> the six real action lists from §8 resolve correctly with no component
                in existence. If the tier model is wrong, it is wrong here, and it costs two days
                rather than two weeks.</p>
            </div>
          </div>
          <div class="phase">
            <div class="prail"><div class="dot">2</div><div class="pline"></div></div>
            <div class="body">
              <div class="meta">3 days · <code>chart-context-menu.tsx</code></div>
              <h4>The popup, the trigger contract, and the keyboard</h4>
              <p>The ~110-line positioner (flip, shift, clipping-ancestor boundary,
                <code>transform-origin</code> quadrant), the render-function trigger, roving
                tabindex, Shift+F10 and <code>ContextMenu</code>, focus return on all four close
                paths, the live region, <code>aria-labelledby</code> to the subject header.</p>
              <p><b>Exit:</b> the geometry test passes at four viewport corners in both writing
                directions.</p>
            </div>
          </div>
          <div class="phase">
            <div class="prail"><div class="dot">3</div><div class="pline"></div></div>
            <div class="body">
              <div class="meta">2 days · the ladders</div>
              <h4>The two-step interactions and the disclosure record</h4>
              <p>Confirm strip, reason list, <code>onDisclose</code> on all three outcomes, the
                three close paths that must each produce <code>abandoned</code>. Bulk demotion and
                <code>bulkConfirm</code>.</p>
              <p><b>Exit:</b> the audit-symmetry tests pass, click-away included.</p>
            </div>
          </div>
          <div class="phase">
            <div class="prail"><div class="dot">4</div><div class="pline"></div></div>
            <div class="body">
              <div class="meta">2 days · <code>menu.css</code> + tokens</div>
              <h4>Theme, density, forced colours, RTL, the sheet</h4>
              <p>The <code>menu</code> token group, density row heights, the touch sheet with
                long-press cancellation on scroll and on a 10px move, the forced-colors block, the
                reduced-motion still states.</p>
              <p><b>Exit:</b> VRT across 14 states × 2 themes × 2 densities, plus forced-colors and
                RTL, all deterministic.</p>
            </div>
          </div>
          <div class="phase">
            <div class="prail"><div class="dot">5</div><div class="pline"></div></div>
            <div class="body">
              <div class="meta">2 days · the enforcement</div>
              <h4>The lint rule, the palette adapter, and the generated files</h4>
              <p><code>validateActions</code> promoted into an
                <code>@oxygenui-design/eslint-plugin</code> rule with its own fixtures;
                <code>toPaletteItems</code> and the reciprocal <code>related</code> edge to
                <code>chart-command-palette</code>; all seven generator touchpoints from §17;
                <code>meta.ts</code> complete, because the docs page is a projection of it.</p>
              <p><b>Exit:</b> <code>pnpm gen --strict</code> and <code>pnpm gen --check</code> both
                clean.</p>
            </div>
          </div>
          <div class="phase">
            <div class="prail"><div class="dot">6</div></div>
            <div class="body">
              <div class="meta">3 days · to <code>stable</code></div>
              <h4>Screen readers, the API report, the docs page</h4>
              <p>NVDA, JAWS and VoiceOver passes recorded per ENGINEERING.md §6; 200% zoom and 320px
                verified; <code>api-extractor</code> report committed; the Base UI escape-hatch
                recipe written and tested as a real example rather than a snippet.</p>
              <p><b>Exit:</b> 26 → 27 components, conformance still 27/27.</p>
            </div>
          </div>
        </div>

        <div class="note">
          <span class="lbl">What is deliberately not in the plan</span>
          <p><b>The safe triangle</b> (v2, and submenus are routine-only until then).
            <b>Typeahead beyond first-letter</b> (v2). <b>A toolbar rendering of the same
            partition</b> — <code>bulkPartition</code> exists so that it can be built, but it is a
            different component and pretending otherwise is how a menu becomes a framework.
            <b>Anything that performs a break-glass</b>, which is a separate surface with its own
            consent and its own record.</p>
        </div>
""",
},

# ----------------------------------------------------------------- 19
{
"id": "decisions", "short": "Decisions & questions",
"title": "What I decided without asking, and the seven things I need you to settle",
"kicker": """<p>Same format as the other briefs. The first list is decisions I made on my own
  judgement and would defend; the second is where a different answer changes the build, and I have
  given my recommendation rather than a menu.</p>""",
"body": """
        <h3>Decided unsupervised</h3>
        <div class="feat">
          <div><div class="n">01</div><div><div class="t">The subject header is not configurable<span class="badge v1">v1</span></div><div class="d">No <code>showSubject</code> prop, no way to render a headerless menu. A configurable safety feature is a safety feature that is off in the codebase that needed it most. If this is wrong it is wrong loudly and early, which is the right kind of wrong.</div></div></div>
          <div><div class="n">02</div><div><div class="t">Four tiers, not three and not five<span class="badge v1">v1</span></div><div class="d">I considered folding <code>documented</code> into <code>routine</code>. I would not: "this writes something other people read" is the single most common surprise in a chart, and it is one line of copy to fix. Five would have split <code>clinical</code> into reversible and not, which the <code>confirm</code> sentence already carries better than a type could.</div></div></div>
          <div><div class="n">03</div><div><div class="t">Zero runtime dependencies; Base UI as a documented alternative<span class="badge v1">v1</span></div><div class="d">ADR 0009 and ENGINEERING.md §2.5 both point this way, and the ~110-line positioner is a known quantity. The unusual half of the decision is telling people <em>not</em> to install ours if they already have Base UI. The value is the model.</div></div></div>
          <div><div class="n">04</div><div><div class="t">The menu never ranks<span class="badge v1">v1</span></div><div class="d">No frequency weighting, no recency, no personalisation. The opposite of the palette, deliberately, for the reason in §4.</div></div></div>
          <div><div class="n">05</div><div><div class="t"><code>children</code> is a render function<span class="badge v1">v1</span></div><div class="d">Because the trigger in a data grid is a <code>&lt;tr&gt;</code>, and a component that wraps it in a <code>&lt;div&gt;</code> has broken the table. Slightly more awkward for the simple case; correct for the case that matters.</div></div></div>
          <div><div class="n">06</div><div><div class="t">Withheld actions are counted, never named<span class="badge v1">v1</span></div><div class="d">Lifted wholesale from the palette's treatment of out-of-scope patients, including the sentence shape. Two components that answer the same question differently is worse than either answer.</div></div></div>
          <div><div class="n">07</div><div><div class="t">Disclosure is never bulk<span class="badge never">never</span></div><div class="d">A lint error, not a default. Twelve records with one justification is not a record any privacy officer accepts, and a prop to allow it would eventually be set.</div></div></div>
          <div><div class="n">08</div><div><div class="t">Submenus are routine-only until there is a safe triangle<span class="badge v2">v2</span></div><div class="d">An accidental submenu close on a routine action costs a mouse movement. On a clinical one it costs a mis-click on whatever the pointer swept over.</div></div></div>
        </div>

        <div class="note bad">
          <span class="lbl">Two things building the prototype changed, which is why it exists</span>
          <p><strong>The bulk header leaked an identifier.</strong> <code>describeSubject()</code>
            fell back to <code>subject.detail</code> for a multiple selection, so the header read
            <em>"12 patients selected · MRN 44-2871 · 34y · Intake 10:30"</em> — one person's
            identifiers printed at the top of a menu whose entire purpose is to count rather than
            name. It looked correct in every mockup, because a mockup does not have twelve of
            anything. The fix is <code>bulkDetail</code>, a separate field that is about the
            selection; the lesson is that Rule&nbsp;3 needs a test at the top level of the
            resolver's output, not only on the masked path.</p>
          <p><strong>"The pointer lands on the subject header" was false at exactly one pixel.</strong>
            With the popup's corner on the cursor, an 8px <code>border-radius</code> leaves the
            pointer outside the menu shape — <code>document.elementFromPoint</code> returns the row
            underneath. My first fix pushed the menu <em>away</em> from the cursor, which made it
            worse and which the assertion caught immediately; the corner belongs three pixels
            <em>behind</em> the cursor. The geometry test in §18 now probes the cursor's own
            coordinates rather than a comfortable point inside the menu, which is the only version
            of that test worth having.</p>
        </div>

        <h3>Seven questions</h3>
        <div class="qa">
          <div>
            <div class="q"><span class="n">Q1</span>Is the component <code>ChartContextMenu</code>, or something less chart-shaped?</div>
            <div class="a">The family reads <code>ChartHeader</code>, <code>ChartAccordion</code>,
              <code>ChartCommandPalette</code> — so <code>ChartContextMenu</code> is consistent and
              wins the SEO phrase. But the component works on worklists, schedules, queues and
              inboxes, none of which are charts. <b>My recommendation: ship it as
              <code>ChartContextMenu</code> anyway</b>, because family consistency is worth more
              than literal accuracy and renaming later is a codemod we already have. Say no now if
              you disagree; after 0.5.0 it is a breaking change.</div>
          </div>
          <div>
            <div class="q"><span class="n">Q2</span>Does the confirmation strip push, or replace?</div>
            <div class="a">§14 admits the one case where the menu moves: a confirmation near the
              bottom of the viewport makes the popup taller and shifts it up. The alternative is
              <code>confirmPlacement: "replace"</code> — the list is replaced by the confirmation, so
              the popup keeps its size but the reader loses the context of the other verbs.
              <b>My recommendation: keep "push", because the movement happens after commitment.</b>
              But this is a judgement about clinician behaviour, not about code, and you have watched
              more of it than I have.</div>
          </div>
          <div>
            <div class="q"><span class="n">Q3</span>Does <code>documented</code> earn its tier, or is a <code>records</code> string on a routine action enough?</div>
            <div class="a">Four tiers means four bands means more separators in a common menu.
              <b>My recommendation: keep it</b> — the band is what stops "add to problem list"
              sitting between "copy" and "print", and it is the tier a clinician is most likely to
              be surprised by. This is the cut I would make first if you want three.</div>
          </div>
          <div>
            <div class="q"><span class="n">Q4</span>Do we ship the six action lists in §8 as content, or only the engine?</div>
            <div class="a">Same question as the assessment instruments in the healthcare-50 brief,
              and it is still open there. The action lists are the part a customer would pay for and
              the part that needs a clinician to sign off. <b>My recommendation: ship them as
              fixtures, clearly labelled as examples, not as a recommended set</b> — until the named
              clinical reviewer exists, which is the question that now blocks in three places.</div>
          </div>
          <div>
            <div class="q"><span class="n">Q5</span>Is the ⋯ button part of this component or part of the row?</div>
            <div class="a">Today it is <code>presentation="anchored"</code> and the host renders its
              own button. The alternative is a <code>&lt;ChartActionButton&gt;</code> that guarantees
              the affordance exists. <b>My recommendation: ship the anchored presentation now and
              watch whether anyone forgets the button.</b> If they do, the affordance is not optional
              and it becomes a required part in v2.</div>
          </div>
          <div>
            <div class="q"><span class="n">Q6</span>Where does the disclosure record actually go?</div>
            <div class="a">The component produces it; the host keeps it. But we have now designed
              three audit-producing components (<code>ChartCommandPalette</code>'s search audit,
              this one's disclosure record, and the signature's attestation) with three different
              shapes. <b>My recommendation: a single <code>AuditEvent</code> type in
              <code>@oxygenui-design/fhir</code> mapped to FHIR <code>AuditEvent</code>, before the
              third one ships rather than after.</b> That is a small ADR and it is worth writing now.</div>
          </div>
          <div>
            <div class="q"><span class="n">Q7</span>Does this brief get committed, and do the sources move into the repo?</div>
            <div class="a">This report and its generator live in an ephemeral session scratchpad,
              exactly like the healthcare-50, datetime and standard briefs before it — and that
              question has been open since 22 August across four documents now. <b>My
              recommendation: <code>content/briefs/&lt;name&gt;/</code> in the repo, generator
              included</b>, so a brief can be rebuilt when the component changes instead of becoming
              a snapshot of what we once believed.</div>
          </div>
        </div>

        <div class="note warn">
          <span class="lbl">The assumption with the largest downstream consequence</span>
          <p><strong>That a context menu is a surface clinicians actually use in an EHR.</strong> I
            could not find a single study measuring it — §3 says so plainly. Every EHR ships one and
            every power user I have read about uses one, but "power users use it" and "it is worth
            building carefully" are different claims, and the second one is the one this brief
            assumes. <b>The cheap test:</b> instrument <code>onOpenChange</code> in one pilot
            deployment for two weeks and count opens per session against ⋯ clicks and palette
            invocations. If the right-click path is under 5% of action invocations, the ⋯ button is
            the product and the right-click is a convenience — which changes the emphasis of this
            build but not, as it happens, any of its code.</p>
        </div>
""",
},

# ----------------------------------------------------------------- 21
{
"id": "shipped", "short": "What shipped differently",
"title": "What the build changed about this document",
"kicker": """<p>The component shipped on 31 August 2026. Everything below is
  different from what this brief proposed, and each was found by running the
  thing rather than by reading it. Recorded here so the brief stays a document
  you can trust rather than a snapshot of what we believed on the Monday.</p>""",
"body": """
        <div class="tw">
          <table>
            <thead><tr><th>§</th><th>The brief said</th><th>What shipped, and why</th></tr></thead>
            <tbody>
              <tr><td>13</td><td><code>aria-expanded</code> on the trigger.</td><td><b>Dropped.</b> Axe rejects it on a generic element and treats it as conditional on a <code>&lt;tr&gt;</code>. Wrong on the merits too: a transient popup is not content belonging to the row. A submenu trigger does carry it, where <code>menuitem</code> supports it and it is true.</td></tr>
              <tr><td>16</td><td><code>toPaletteItems</code> imports <code>PaletteItem</code>, so <code>menu-core</code> depends on <code>palette-core</code>.</td><td><b>Structural typing instead.</b> The import would make every install pull the palette core and its stylesheet for a type that erases at compile time.</td></tr>
              <tr><td>6</td><td>The tier's colour rides on the host's icon.</td><td><b>The component supplies the glyph.</b> A host that passed none got no glyph, and with no glyph nothing for the hue to land on — a discontinue rendered identically to a copy. A host icon overrides it; <code>routine</code> stays unmarked so the mark means something.</td></tr>
              <tr><td>12</td><td>Submenus get an intent delay; the safe triangle is v2.</td><td><b>A rule replaced the geometry.</b> An open child closes when the pointer reaches a <em>different row</em>, not when it leaves the trigger — so crossing the gap between the popups closes nothing, which is what the triangle exists to protect.</td></tr>
              <tr><td>14</td><td>The menu closes on scroll, a moved point being meaningless.</td><td><b>It follows instead.</b> The point is an offset <em>inside the trigger</em>, so the menu tracks its row. Closing also fired whenever a browser scrolled a row into view a frame before the click that opened it.</td></tr>
              <tr><td>11</td><td>A flipped menu is placed by subtracting its height.</td><td><b>Anchored by its bottom edge.</b> Subtracting a height that <code>maxHeight</code> was also capping is a feedback loop; it settled differently each frame and put the cursor over a verb about one time in three.</td></tr>
              <tr><td>10</td><td>The bulk header's second line is the subject's <code>detail</code>.</td><td><b>A separate <code>bulkDetail</code>.</b> The fallback printed one patient's MRN at the top of a menu whose whole job is to count rather than name.</td></tr>
              <tr><td>16</td><td>—</td><td><b>Props the brief did not have:</b> <code>container</code>, so the popup works inside a contained pane; <code>bulkDetail</code>; and <code>data-ox-menu</code> on the trigger.</td></tr>
              <tr><td>18</td><td>Zero axe violations per story.</td><td><b>True, and it caught two claims made here.</b> The geometry claim needs a real browser — jsdom reports every box as zero — so it lives in an <code>@a11y</code> Playwright suite across three engines.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="note bad">
          <span class="lbl">The one that should not have needed a browser</span>
          <p><strong>The submenu was a decoration for three days.</strong> It drew a chevron and
            set <code>aria-haspopup="menu"</code>, then ran the row as a command: choosing "Trend"
            called <code>onRun("trend")</code> and closed the menu. The children were never
            rendered. <code>meta.limitations</code> described an intent delay that did not exist,
            and the story asserted the attribute and passed against the absence.</p>
          <p><b>The lesson outlives this component:</b> conformance checks metadata completeness,
            not behaviour — it read 18/18 throughout. A story that asserts an attribute proves the
            attribute, never the capability. Of every declared state, ask whether its story makes
            the feature <em>do</em> something.</p>
        </div>

        <div class="note">
          <span class="lbl">Rebuilding this document</span>
          <p>The generator is at <code>content/briefs/chart-context-menu/</code>. Edit the prose
            and run <code>python3 build.py</code>; it writes the HTML at the repo root and
            hard-fails on an unsubstituted token. It lived in an ephemeral scratchpad until now,
            which is why this section exists — for three days the only way to correct the document
            was to rewrite it.</p>
        </div>
""",
},

# ----------------------------------------------------------------- 20
{
"id": "sources", "short": "Sources",
"title": "Where the external claims came from",
"kicker": """<p>Checked against a primary or peer-reviewed document in August 2026. Everything in
  this report that is not in this table is argument, and is written as argument.</p>""",
"body": """
        <div class="tw">
          <table>
            <thead><tr><th>Claim</th><th>Used in</th><th>Source</th></tr></thead>
            <tbody>
              <tr><td>Base UI's ContextMenu has 16 parts with the props and defaults tabulated in §2, including <code>closeOnClick: false</code> on checkbox and radio items and <code>collisionBoundary: "clipping-ancestors"</code>.</td><td>§2</td><td><a href="https://base-ui.com/react/components/context-menu">Base UI — ContextMenu</a>, read 31 Aug 2026. shadcn's <code>base</code> variant wraps these; <code>variant="destructive"</code> is shadcn's styling, not Base UI's API.</td></tr>
              <tr><td>The shadcn component installs as <code>pnpm dlx shadcn@latest add context-menu</code> and exports 14 wrappers.</td><td>§1, §2</td><td><a href="https://ui.shadcn.com/docs/components/base/context-menu">shadcn/ui — Context Menu (base)</a>.</td></tr>
              <tr><td>The Wrong-Patient Retract-and-Reorder measure: 76.2% PPV (170 of 223), ~14 events per day at one academic medical centre over &gt;9M orders in a year.</td><td>§3</td><td>Adelman et&nbsp;al., <a href="https://pubmed.ncbi.nlm.nih.gov/22753810/">"Understanding and preventing wrong-patient electronic orders: a randomized controlled trial"</a>, <i>JAMIA</i> 20(2):305, and <a href="https://digital.ahrq.gov/program-overview/research-stories/automated-retract-and-reorder-measures-improve-medication-safety">AHRQ Digital Healthcare Research</a>.</td></tr>
              <tr><td>WP-RAR was the first health IT safety measure endorsed by the National Quality Forum, as NQF #2723.</td><td>§3</td><td><a href="https://www.dbmi.columbia.edu/adelman-study-evaluates-safety-of-restricting-vs-allowing-multiple-records-open-in-an-electronic-health-record/">Columbia DBMI</a>.</td></tr>
              <tr><td>Patient identifiers not visible during a task was named as a wrong-patient-selection risk; clinicians described controls <q>so close together</q> that clicks land wrong.</td><td>§3</td><td>Ratwani et&nbsp;al. / Savoy et&nbsp;al., <a href="https://humanfactors.jmir.org/2018/1/e4">"Reducing Misses and Near Misses Related to Multitasking on the Electronic Health Record"</a>, <i>JMIR Human Factors</i> 5(1):e4.</td></tr>
              <tr><td>346 mouse clicks, 200 of them left clicks, across 43 screens for a single documentation task.</td><td>§3</td><td><a href="https://onlinelibrary.wiley.com/doi/full/10.1111/jep.70189">"Usability Challenges in Electronic Health Records: Impact on Documentation Burden and Clinical Workflow"</a>, <i>J Eval Clin Pract</i>, scoping review.</td></tr>
              <tr><td>Break-glass requires additional authentication and a documented business reason before the chart opens; reason codes are part of the audit trail and are compared against what was clinically happening.</td><td>§10</td><td><a href="https://www.ama-assn.org/health-care-advocacy/administrative-burdens/are-break-glass-functions-required-employee-ehr-access">AMA — "Are break-the-glass functions required for employee EHR access?"</a></td></tr>
              <tr><td>HIPAA does not name break-glass; 45 CFR §164.312(a)(2)(ii) requires an emergency access procedure under the Access Control standard.</td><td>§10</td><td>45 CFR §164.312(a)(2)(ii), HIPAA Security Rule technical safeguards.</td></tr>
              <tr><td>42 CFR Part 2 enforcement began 16 February 2026, which is why the masked-record behaviour is v1 rather than v2.</td><td>§10</td><td>Verified against the primary rule in the healthcare-50 brief, §14, August 2026.</td></tr>
              <tr><td>WCAG 2.2 AA: 2.5.8 Target Size (Minimum) is 24×24 CSS pixels; 2.4.11 Focus Not Obscured (Minimum); 2.5.2 Pointer Cancellation; 4.1.3 Status Messages.</td><td>§13, §14</td><td>W3C, <a href="https://www.w3.org/TR/WCAG22/">Web Content Accessibility Guidelines 2.2</a>.</td></tr>
              <tr><td><b>No peer-reviewed study of context menus in EHRs exists</b> — of error rate, time saving, or discoverability.</td><td>§3, §20</td><td>Searched August 2026; results return general EHR-usability work and vendor documentation only. Stated as an absence rather than a finding.</td></tr>
            </tbody>
          </table>
        </div>
""",
},

]
