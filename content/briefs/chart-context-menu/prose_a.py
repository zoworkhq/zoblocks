# -*- coding: utf-8 -*-
"""Sections 1-10."""

SECTIONS_A = [

# ------------------------------------------------------------------ 1
{
"id": "brief", "short": "The brief",
"title": "A context menu is the shortest path in the interface to an irreversible clinical act",
"kicker": """<p>You sent me <code>ui.shadcn.com/docs/components/base/context-menu</code> and asked
  what the healthcare version of it is. The short answer is that the healthcare version is not a
  themed right-click menu, and the parts worth building are not the parts shadcn ships.</p>""",
"body": """
        <div class="prose">
          <p>Everything hard about the shadcn component is <em>mechanical</em>: portalling, collision
            detection, focus return, roving tabindex, long-press on touch, submenu timing. Base UI
            solves all of it, correctly, and we should not rewrite it — the section below reads
            their API rather than assuming it.</p>
          <p>Nothing hard about the <em>healthcare</em> component is mechanical. In a chart, the
            question a context menu has to answer is not "where do I paint this popup", it is:</p>
          <ul>
            <li><strong>What did you actually right-click?</strong> The menu opens at the pointer,
              detached from the row it came from, frequently on top of it — in a worklist of forty
              patients that is a wrong-patient error with a click of runway left.</li>
            <li><strong>What may this person do to it?</strong> A prescriber, a nurse, a scribe and
              a scheduling clerk right-clicking the same order have four different menus, and the
              differences are not cosmetic.</li>
            <li><strong>What does each verb cost?</strong> <code>Copy</code> and
              <code>Discontinue</code> are one row apart and one click each. One of them stops a
              dose at 14:00.</li>
            <li><strong>What happens to the ones this person may not run?</strong> Silently dropping
              them teaches somebody the feature does not exist. Showing them teaches them what to
              change.</li>
            <li><strong>Is opening the menu itself a disclosure?</strong> On a 42 CFR Part 2 record,
              sometimes yes.</li>
          </ul>
          <p>None of those are rendering problems, which is why the proposal below is an
            <strong>L0 resolver with a thin binding</strong> rather than a styled wrapper. The
            resolver is about three hundred lines, has no React in it, and is the entire component.
            The popup is the cheap half.</p>
        </div>

        <div class="note">
          <span class="lbl">The one-line version</span>
          <p><strong>ChartContextMenu</strong> — a right-click menu that names what it is about
            before it offers to change it, ranks its verbs by consequence rather than by a
            <code>destructive</code> boolean, counts the actions it is withholding instead of
            hiding them, and never resolves a name the row it opened from was masking.</p>
        </div>

        <figure>
          <div class="antd">
            <div data-fig="default"></div>
          </div>
          <figcaption><b>Figure 1 — the component, live.</b> Right-click any row. Or Tab to one and
            press Shift+F10, which is the same menu and the reason this passes WCAG 2.1.1. Everything
            you see is produced by <code>resolveMenu()</code> in the prototype at the bottom of this
            page; there is no hand-drawn markup in any figure in this report.</figcaption>
        </figure>
""",
},

# ------------------------------------------------------------------ 2
{
"id": "baseui", "short": "What Base UI ships",
"title": "Base UI ships a ContextMenu. I read it rather than assuming.",
"kicker": """<p>Sixteen parts, and the split between them is good. Here is the whole surface, and
  then the seven things it does not have — none of which are oversights, because none of them are
  its job.</p>""",
"body": """
        <div class="tw">
          <table>
            <thead><tr><th>Part</th><th>The props that matter</th><th>What it is for</th></tr></thead>
            <tbody>
              <tr><td><code>Root</code></td><td><code>open</code> · <code>onOpenChange</code> · <code>highlightItemOnHover</code> (true) · <code>loopFocus</code> (true) · <code>closeParentOnEsc</code> (false) · <code>actionsRef</code> · <code>orientation</code></td><td>State and keyboard policy.</td></tr>
              <tr><td><code>Trigger</code></td><td><code>render</code> · <code>className</code></td><td>The right-click / long-press region.</td></tr>
              <tr><td><code>Portal</code></td><td><code>container</code> · <code>keepMounted</code> (false)</td><td>Escapes <code>overflow: hidden</code>.</td></tr>
              <tr><td><code>Positioner</code></td><td><code>side</code> · <code>align</code> · <code>sideOffset</code> · <code>alignOffset</code> · <code>anchor</code> · <code>collisionBoundary</code> ("clipping-ancestors") · <code>collisionPadding</code> (5) · <code>collisionAvoidance</code> · <code>sticky</code> · <code>positionMethod</code> · <code>disableAnchorTracking</code></td><td>Flip, shift, virtual anchors. This is the part that is genuinely fiddly.</td></tr>
              <tr><td><code>Popup</code></td><td><code>finalFocus</code></td><td>The surface, and where focus goes on close.</td></tr>
              <tr><td><code>Arrow</code></td><td><code>render</code></td><td>Rarely wanted on a context menu.</td></tr>
              <tr><td><code>Item</code></td><td><code>label</code> · <code>onClick</code> · <code>closeOnClick</code> (true) · <code>disabled</code> · <code>nativeButton</code> (false)</td><td>A row.</td></tr>
              <tr><td><code>LinkItem</code></td><td><code>closeOnClick</code> (<b>false</b>)</td><td>A row that navigates.</td></tr>
              <tr><td><code>SubmenuRoot</code> · <code>SubmenuTrigger</code></td><td><code>openOnHover</code> · <code>delay</code> (100) · <code>closeDelay</code> (0)</td><td>Nesting, with an intent delay.</td></tr>
              <tr><td><code>Group</code> · <code>GroupLabel</code></td><td>—</td><td>A labelled section inside the menu.</td></tr>
              <tr><td><code>CheckboxItem</code> · <code>CheckboxItemIndicator</code></td><td><code>checked</code> · <code>onCheckedChange</code> · <code>closeOnClick</code> (<b>false</b>) · <code>keepMounted</code></td><td>View state.</td></tr>
              <tr><td><code>RadioGroup</code> · <code>RadioItem</code> · <code>RadioItemIndicator</code></td><td><code>value</code> · <code>onValueChange</code> · <code>closeOnClick</code> (<b>false</b>)</td><td>One-of-many view state.</td></tr>
              <tr><td><code>Separator</code></td><td><code>orientation</code></td><td>A rule.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="note ok">
          <span class="lbl">Three defaults they got right, and we inherit</span>
          <p><code>CheckboxItem</code> and <code>RadioItem</code> default to
            <code>closeOnClick: false</code> while <code>Item</code> defaults to <code>true</code> —
            which is the correct reading of what a toggle is for. <code>closeParentOnEsc</code>
            defaults to <code>false</code>, so Escape in a submenu returns you to the parent rather
            than dropping you to the page. And <code>collisionBoundary</code> defaults to
            <code>"clipping-ancestors"</code>, which is what makes a menu inside a scrolling chart
            pane behave.</p>
        </div>

        <h3>The seven things it does not model</h3>
        <p>Every one of these is a healthcare concern rather than a menu concern, which is exactly
          why a general-purpose library should not carry them:</p>

        <div class="feat">
          <div><div class="n">01</div><div><div class="t">A subject</div><div class="d">There is no concept of <em>what the menu is about</em>. The trigger is a region; the menu is a list. Nothing connects them for the reader once the popup has covered the row.</div></div></div>
          <div><div class="n">02</div><div><div class="t">Consequence beyond a boolean</div><div class="d"><code>variant="destructive"</code> is shadcn's styling on top, not Base UI's model, and it is one bit. Healthcare needs at least four values, and each one implies a different <em>interaction</em>, not a different colour.</div></div></div>
          <div><div class="n">03</div><div><div class="t">Availability that is not <code>disabled</code></div><div class="d">A boolean cannot distinguish <em>not yet known</em> from <em>known and refused</em> from <em>withheld by policy</em>. All three render as a greyed row, and they are three different sentences.</div></div></div>
          <div><div class="n">04</div><div><div class="t">A reason</div><div class="d">A disabled <code>Item</code> has nowhere to say why. So teams put it in a <code>title</code> attribute, which is invisible to a keyboard user and to a screen reader in most configurations.</div></div></div>
          <div><div class="n">05</div><div><div class="t">Anything about the actions that are not there</div><div class="d">Actions filtered out server-side leave no trace. The reader concludes the record supports nothing else, which is the one wrong conclusion available.</div></div></div>
          <div><div class="n">06</div><div><div class="t">Auditing</div><div class="d">Correctly — a menu library has no business emitting events. But a break-glass offer <em>is</em> an event, and something must make the record.</div></div></div>
          <div><div class="n">07</div><div><div class="t">Ordering by anything but source order</div><div class="d">Which is right for a file manager and wrong for a chart, where a discontinue should never be adjacent to a copy.</div></div></div>
        </div>

        <div class="note warn">
          <span class="lbl">The position this leads to, and it is not "build our own"</span>
          <p><strong>We take the model, not the machinery.</strong> <code>menu-core</code> is pure
            resolution — subject, tiers, availability, withheld counts, the disclosure record — with
            no React and no DOM, and <code>ChartContextMenu</code> is a ~110-line binding that owns
            positioning so the package keeps its zero-runtime-dependency stance
            (<a href="#arch">ENGINEERING.md §2.5</a>, ADR&nbsp;0009). <strong>If your app already
            has Base UI or Radix, do not install ours.</strong> Import <code>resolveMenu()</code>
            and render their parts from its output — that path is documented, tested, and gives up
            nothing, because the value here was never the popup.</p>
        </div>
""",
},

# ------------------------------------------------------------------ 3
{
"id": "failure", "short": "The failure",
"title": "The failure it exists to prevent, and the honest state of the evidence",
"kicker": """<p>Three findings from the literature, and one absence. The absence matters as much
  as the findings and is stated first.</p>""",
"body": """
        <div class="note bad">
          <span class="lbl">What I could not find</span>
          <p>There is <strong>no peer-reviewed study of context menus in electronic health
            records</strong> — not of their error rate, not of their time saving, not of their
            discoverability. I looked, and the searches return general EHR-usability work and a
            vendor help page. So everything in this section is <em>adjacent</em> evidence about
            selection errors and click burden, and the design below is reasoned from it rather than
            validated by it. Anyone who tells you the numbers exist has not gone looking.</p>
        </div>

        <div class="kpi">
          <div><div class="v">346</div><div class="l">mouse clicks recorded for a single documentation task, 200 of them left clicks, across 43 screens</div></div>
          <div><div class="v">76.2%</div><div class="l">positive predictive value of the Wrong-Patient Retract-and-Reorder measure — 170 of 223 flagged events were real wrong-patient orders</div></div>
          <div><div class="v">~14</div><div class="l">retract-and-reorder events per day at one academic medical centre, against a year of &gt;9 million orders</div></div>
          <div><div class="v">#2723</div><div class="l">NQF measure number — the first health IT safety measure the National Quality Forum endorsed, and it measures picking the wrong patient</div></div>
        </div>

        <h3>Three findings that shaped three rules</h3>

        <div class="grid g3">
          <div class="card">
            <span class="k">Finding 01</span>
            <h4>Identifiers go missing mid-task</h4>
            <p>An observational study of EHR multitasking found that patient identifiers were
              <em>not visible</em> while some tasks were being performed, and named that as a
              wrong-patient-selection risk.</p>
            <p><strong>A context menu is the worst case of this by construction:</strong> it opens
              at the pointer and paints over the row that identified the subject.</p>
            <p class="num"><b>→ Rule 1.</b> The menu carries the subject.</p>
          </div>
          <div class="card">
            <span class="k">Finding 02</span>
            <h4>Adjacency is the mechanism</h4>
            <p>Clinicians in that same study described controls that are <q>so close together</q>
              that a click lands in the wrong place. A menu is a stack of 30-pixel rows: the most
              adjacent control surface in the interface.</p>
            <p><strong>Put <code>Discontinue</code> under <code>Copy</code> and you have built the
              mechanism deliberately.</strong></p>
            <p class="num"><b>→ Rule 2.</b> Consequence bands, separated, always last.</p>
          </div>
          <div class="card">
            <span class="k">Finding 03</span>
            <h4>Near-misses are self-caught, and countable</h4>
            <p>The Wrong-Patient RAR measure works by finding an order retracted within ten minutes
              and re-placed on a different patient within the next ten — a near-miss the clinician
              caught themselves. That it is countable at all is the finding.</p>
            <p><strong>An interface can make the catch earlier or later.</strong> A menu that names
              its subject moves the catch before the click.</p>
            <p class="num"><b>→ Rule 1, again.</b></p>
          </div>
        </div>

        <h3>The two-second version of the argument</h3>
        <figure>
          <div class="antd">
            <div data-fig="versus"></div>
          </div>
          <figcaption><b>Figure 2 — the same three patients, the same five verbs.</b> Right-click a
            row on the left, then on the right. On the left, the popup covers the row you clicked and
            <code>Break-glass open</code> sits one row below <code>Document a no-show</code>, both
            single-click. On the right the first thing under the pointer is a name, and the two
            consequential verbs are in their own bands below a rule. Neither menu is prettier than
            the other. One of them can tell you what you are about to do it to.</figcaption>
        </figure>
""",
},

# ------------------------------------------------------------------ 4
{
"id": "rules", "short": "Three rules",
"title": "Three rules, and they are the component rather than decoration on it",
"kicker": """<p>The command palette we already ship has three rules of its own and they turned out
  to be the whole product. These are this component's, written the same way — each one is a thing
  the code refuses to do, not a thing the docs recommend.</p>""",
"body": """
        <div class="feat">
          <div>
            <div class="n">01</div>
            <div>
              <div class="t">The menu states its subject, and the subject row is the safe landing.</div>
              <div class="d">Every menu opens with a non-interactive header naming what was
                right-clicked — patient, medication, result, note. It is rendered first, so the
                pixel under the pointer at the moment of opening is <strong>never a verb</strong>.
                One decision closing two holes: the wrong-patient check and the accidental
                click-through. It is not optional and there is no prop to remove it, because the
                menus that most need it are the ones a team under deadline would turn it off in.</div>
            </div>
          </div>
          <div>
            <div class="n">02</div>
            <div>
              <div class="t">Consequence is a rank, not a boolean.</div>
              <div class="d">Four tiers — <code>routine</code>, <code>documented</code>,
                <code>clinical</code>, <code>disclosive</code> — and the tier decides the
                <em>interaction</em>, not the colour: run on the click; run and say what was
                written; take a second step inside the menu; take a recorded reason. The bands are
                laid out in that order with a rule between them, so consequence sorts to the bottom
                and the pointer has to travel to reach it.</div>
            </div>
          </div>
          <div>
            <div class="n">03</div>
            <div>
              <div class="t">The menu cannot out-disclose its trigger, and it cannot move under the cursor.</div>
              <div class="d">A row rendered masked produces a masked header — the component may not
                resolve a name the surface was hiding. And an action whose availability is still
                being checked <strong>holds its final position</strong> as a placeholder rather than
                being appended when the answer arrives, because a menu that grows after it opens has
                moved a destructive verb under a pointer that was aiming at something else.</div>
            </div>
          </div>
        </div>

        <div class="note">
          <span class="lbl">The rule I want to state explicitly because it is the opposite of the palette's</span>
          <p><strong>The menu never ranks.</strong> <code>ChartCommandPalette</code> sorts by
            relevance and weights by frequency, and it is right to — there you typed something and
            you are reading the result. Here you have muscle memory and a pointer already in
            flight. Declaration order is preserved <em>exactly</em>; frequency is not consulted; the
            only thing that reorders anything is the consequence band. A menu whose third item
            moves because you used it a lot yesterday has broken the one thing menus are good at.</p>
        </div>
""",
},

# ------------------------------------------------------------------ 5
{
"id": "anatomy", "short": "Anatomy",
"title": "Seven regions, in a fixed order, and the first one is not a verb",
"kicker": """<p>The whole surface, annotated. Nothing below is optional in the sense of being
  configurable away; regions 3 to 6 are absent only when there is nothing to put in them.</p>""",
"body": """
        <figure>
          <div class="antd">
            <div data-fig="anatomy"></div>
          </div>
          <figcaption><b>Figure 3 — the medication menu, as a registered nurse sees it.</b> Static
            here so the pins stay put; it is the same output as Figure 1.</figcaption>
        </figure>

        <ul class="anno-key">
          <li><span class="n">1</span><div><b>Subject header.</b> <code>role="presentation"</code>,
            not focusable, not selectable, no hover state. Initials, the label the row showed, and
            the qualifier that distinguishes two rows that look alike. On a masked row it reads
            <em>Restricted record</em> and nothing more.</div></li>
          <li><span class="n">2</span><div><b>Routine band.</b> Open, copy, print, navigate,
            trend. Runs on the click. No second line, because there is nothing to warn about.</div></li>
          <li><span class="n">3</span><div><b>The <code>records</code> line.</b> A recorded action
            says <em>what it writes and who reads it</em>, on a second line, before it is chosen —
            not in a toast afterwards. Required by the type: a <code>documented</code> action
            without it does not compile past lint.</div></li>
          <li><span class="n">4</span><div><b>Clinical band.</b> Below a rule. Choosing one opens a
            confirmation <em>inside the menu</em>, drawn under the row it belongs to so the pointer
            has not moved and the popup has not jumped.</div></li>
          <li><span class="n">5</span><div><b>Unavailable, in place.</b> Struck through, with the
            reason as text. It keeps its position in its band, which is what makes it teach
            something: <em>prescriber role required</em> tells a nurse what to escalate. A hidden
            row teaches them the feature does not exist.</div></li>
          <li><span class="n">6</span><div><b>The withheld count.</b> A row inside the menu, above
            the bottom edge, with a lock. <em>1 further action on this record, hidden for a
            registered nurse — break-glass required.</em> A reader who does not see this concludes
            the record supports nothing else.</div></li>
          <li><span class="n">7</span><div><b>Band separators.</b> Inserted by the resolver, never
            by the author. You cannot accidentally put a discontinue next to a copy, because
            placement is not yours to get wrong.</div></li>
        </ul>

        <div class="note warn">
          <span class="lbl">Two things deliberately absent</span>
          <p><strong>No icons-only rows and no icon-free rows.</strong> Every row carries a 16px
            glyph in a fixed column, so the label column starts at the same x on every row and the
            eye can run down it. Mixed indentation is how a menu becomes a list of ransom-note
            fragments.</p>
          <p><strong>No previews of the value.</strong> A submenu that shows the result you are
            about to copy has put PHI into a floating layer during a screen-share, over a shoulder,
            in a screenshot, and in the recording. If the value is worth showing, the row already
            shows it.</p>
        </div>
""",
},

# ------------------------------------------------------------------ 6
{
"id": "insitu", "short": "In situ",
"title": "Two mockups, because a menu judged on a white card is the wrong thing judged",
"kicker": """<p>Both screens below are live. The question a context menu has to survive is not
  whether it looks tidy in isolation — it is whether it still tells you what you are about to do
  when there is a patient banner above it, a tab strip, a scrolling pane, and forty rows of somebody
  else&apos;s data around it.</p>""",
"body": """
        <figure>
          <div class="antd">
            <div data-fig="mock-chart"></div>
          </div>
          <figcaption><b>Figure 4 — an inpatient chart.</b> Six resource types in one screen:
            medications, results, an allergy, notes, a restricted note, and two members of the care
            team. Right-click anything. The host passed <em>one</em> flat action array and
            <code>appliesTo()</code> routed it — nothing in this markup knows what a
            <code>MedicationRequest</code> is.
            <br /><br />
            Three things to try. <b>The clozapine row</b> — its menu is the same as lisinopril&apos;s,
            because a component that special-cased clozapine would be a component you cannot ship to
            the next customer. <b>The potassium</b> — <code>Release to patient portal</code> is
            blocked and says why, and <code>Acknowledge critical result</code> names the escalation
            it stops. <b>The second note on the right</b> — it is masked, and its menu says
            <em>Restricted record</em> while the note above it is named in full. Same props shape,
            same component, same action list.</figcaption>
        </figure>

        <figure>
          <div class="antd">
            <div data-fig="mock-worklist"></div>
          </div>
          <figcaption><b>Figure 5 — a behavioral-health day list, with a live selection.</b> The
            three highlighted rows are one selection of three patients. Right-click any of them and
            the header <em>counts</em> rather than listing names, <code>Open chart</code> and
            <code>Log a collateral contact</code> are present-but-disabled with a reason, and
            <code>Document a no-show</code> — which <em>is</em> bulk-safe — carries a confirmation
            written for three rather than for one.
            <br /><br />
            Then right-click the 13:00 row. It is a minor&apos;s confidential encounter, rendered
            masked in the list, and the menu inherits that. This is the screen where Rule 1 earns
            its keep: nine rows, one selection, two restricted records, and a right-click that
            opens over whichever row you were pointing at.</figcaption>
        </figure>

        <div class="note">
          <span class="lbl">What the mockups are drawn in</span>
          <p>Stock <strong>Ant Design v6 token values</strong> — <code>#1677ff</code>,
            <code>rgba(0,0,0,.88)</code>, 6px radii, the real shadow triple — for the same reason the
            other briefs in this series do it: what you are judging should be the proposal in the
            system we actually build on, not a teal impression of it. The Oxygen token layer maps on
            top without a markup change, and §17 lists exactly which semantic tokens each tier
            resolves to.</p>
        </div>
""",
},

# ------------------------------------------------------------------ 7
{
"id": "tiers", "short": "Four tiers",
"title": "Consequence is a rank, not a boolean",
"kicker": """<p><code>variant="destructive"</code> is one bit of information, and a chart has at
  least four states worth distinguishing. Each tier below changes the <em>interaction</em>; the
  colour is the least of it, and in forced-colours mode the colour is gone entirely.</p>""",
"body": """
        <div class="tiers">
          <div>
            <div class="t routine">routine<small>1 step · no record</small></div>
            <div class="d">Changes nothing anyone else will read. Open, copy, print, jump, trend,
              toggle a column. <b>Runs on the click and closes the menu</b> — except toggles, which
              run and stay open. If you find yourself wanting a confirmation on one of these, the
              tier is wrong, not the confirmation.</div>
          </div>
          <div>
            <div class="t documented">documented<small>1 step · <code>records</code> required</small></div>
            <div class="d">Writes something to the chart that another clinician will read. Add a note
              to the MAR, flag for pharmacy, log a collateral contact, add to the problem list.
              <b>Runs on the click, but says what it writes before it is chosen</b> — a second line
              on the row, not a toast after the fact. <b>The <code>records</code> string is required
              by the type.</b> "Creates a Task for pharmacy. It appears in their queue with your
              name on it" is the standard; "Saved" is not.</div>
          </div>
          <div>
            <div class="t clinical">clinical<small>2 steps · <code>confirm</code> required</small></div>
            <div class="d">Changes the patient's care. Discontinue, hold, acknowledge a critical
              result, mark an allergy entered in error, document a no-show. <b>Never runs on the
              first click.</b> The confirmation is a strip drawn <em>under the row inside the
              menu</em>, never a modal — a modal moves focus off the surface, takes the keyboard
              away from the person who was using it, and re-anchors the whole interaction somewhere
              the pointer is not. The sentence must name the consequence with its specifics: <em>the
              next scheduled dose is 14:00 today</em>.</div>
          </div>
          <div>
            <div class="t disclosive">disclosive<small>2 steps · <code>reasons</code> required · always audited</small></div>
            <div class="d">Reveals data the reader was not previously entitled to, or moves it
              outside the organisation. Break-glass, reveal a 42 CFR Part 2 note, send externally.
              <b>Takes a recorded reason from a list, and emits the audit record on every path —
              including the one where the reader read the reasons and backed out.</b> That symmetry
              is the point: in a privacy review the abandoned ones are the interesting ones, exactly
              as the empty searches are for the palette.</div>
          </div>
        </div>

        <figure>
          <div class="antd">
            <div data-fig="tiers"></div>
          </div>
          <figcaption><b>Figure 6 — all four ladders on two real records.</b> On the potassium:
            <code>Release to patient portal</code> is blocked because the result is still
            preliminary — the reason is the row, not a tooltip. <code>Acknowledge critical
            result</code> takes a second step and names the escalation it stops. On the note:
            <code>Reveal Part 2 content</code> takes a reason, and the audit strip below shows you
            the record the host is handed <em>as soon as the reason list is offered</em>. Choose it
            and then press Escape without answering — the record is still there, with
            <code>outcome: "abandoned"</code>.</figcaption>
        </figure>

        <h3>The half of this that is not visual</h3>
        <p>The tier system is only worth anything if an author cannot ship a clinical action with no
          confirmation sentence. So the requirements are enforced, not documented — by
          <code>validateActions()</code> at runtime in development, and by an
          <code>@oxygenui-design/eslint-plugin</code> rule at build:</p>

        <div data-fig="validate"></div>

        <figcaption style="margin-top:-0.6rem"><b>Figure 7 — the linter on a deliberately wrong
          action list.</b> This is real output from <code>validateActions()</code> in the prototype,
          run on the fixture in <code>data.js</code>. Six problems, and every one of them renders
          perfectly and says something false — which is the class of defect this library exists to
          make unwritable.</figcaption>
""",
},

# ------------------------------------------------------------------ 7
{
"id": "nouns", "short": "Six nouns",
"title": "Six nouns, six menus, one component",
"kicker": """<p>A generic context menu has one action list. A chart has one per resource type, per
  role, per state of the record — and the verbs are not interchangeable, because
  <code>applies</code> is on the action, not on the call site.</p>""",
"body": """
        <figure>
          <div class="antd">
            <div data-fig="subjects"></div>
          </div>
          <figcaption><b>Figure 8 — the same component against six FHIR resources.</b> The host
            passes one flat action array for the whole surface; <code>appliesTo()</code> decides
            which verbs belong on the noun that was clicked. Nothing at the call site knows what a
            medication is.</figcaption>
        </figure>

        <div class="tw">
          <table>
            <thead><tr><th>Subject</th><th>FHIR</th><th>The verb that makes it different</th><th>Tier</th></tr></thead>
            <tbody>
              <tr><td>Medication</td><td><code>MedicationRequest</code></td><td><b>Hold until reviewed</b> — the one that is neither "keep" nor "stop", and the one every chart has and no component library models.</td><td class="meh">clinical</td></tr>
              <tr><td>Result</td><td><code>Observation</code></td><td><b>Acknowledge critical result</b> — because acknowledgement stops an escalation page, so the confirmation has to say <em>when</em>.</td><td class="meh">clinical</td></tr>
              <tr><td>Note</td><td><code>DocumentReference</code></td><td><b>Add an addendum</b> vs <b>Amend</b> vs <b>Retract</b> — three different legal acts that most interfaces render as one Edit.</td><td class="meh">documented / clinical</td></tr>
              <tr><td>Patient</td><td><code>Patient</code></td><td><b>Add to my patients</b>, which creates the treatment relationship that scopes every later search — including the command palette's.</td><td class="yes">documented</td></tr>
              <tr><td>Allergy</td><td><code>AllergyIntolerance</code></td><td><b>Downgrade to intolerance</b>, whose confirmation must say the thing nobody says: an intolerance does not block a penicillin order and an anaphylaxis does.</td><td class="meh">clinical</td></tr>
              <tr><td>View state</td><td>—</td><td><b>Pin, filter, density.</b> Checkboxes and radios, capped at <code>routine</code> by the validator. A toggle may not be a clinical act.</td><td class="yes">routine</td></tr>
            </tbody>
          </table>
        </div>

        <figure>
          <div class="antd">
            <div data-fig="viewstate"></div>
          </div>
          <figcaption><b>Figure 9 — the seventh noun, which is not a noun.</b> Pin, filter and
            density are checkboxes and radios: they do not close the menu, and the validator refuses
            to let any of them rise above <code>tier: "routine"</code>. A toggle is view state and
            may not be a clinical act — the day somebody ships a checkbox that discontinues something
            is the day the tier system stopped meaning anything. <code>Export visible range</code>
            sits below the rule and <em>does</em> close, because it writes a record naming you, the
            range and the row count.</figcaption>
        </figure>

        <div class="note">
          <span class="lbl">The reuse that makes this cheap</span>
          <p>The same <code>MenuAction</code> array feeds <code>ChartCommandPalette</code> through
            an adapter — <code>toPaletteItems(actions, subject)</code> — so a verb typed into ⌘K and
            a verb right-clicked on a row are <em>the same object</em>, with the same tier and the
            same confirmation. Three surfaces (right-click, the ⋯ button, the palette) that diverge
            is how users learn one path and lose the other two. This is invariant §2.3: one
            behaviour source.</p>
        </div>
""",
},

# ------------------------------------------------------------------ 8
{
"id": "availability", "short": "Availability",
"title": "Four availabilities, and only one of them is <code>disabled</code>",
"kicker": """<p><code>disabled</code> is a boolean and there are four states here. Collapsing them
  is what produces a greyed row with no explanation, which is the most common defect in every
  context menu I have looked at.</p>""",
"body": """
        <div class="tw">
          <table>
            <thead><tr><th>Status</th><th>Rendered</th><th>Counted</th><th>Keyboard</th><th>Why it is its own state</th></tr></thead>
            <tbody>
              <tr><td><code>available</code></td><td>Normally</td><td>—</td><td>Reachable, activatable</td><td>The default; no <code>availability</code> key at all.</td></tr>
              <tr><td><code>pending</code></td><td>A placeholder <b>in its final position</b></td><td>—</td><td>Reachable, <b>not activatable</b></td><td>An entitlement check, an interaction check, a signing-authority lookup. The answer is not back yet, and the row must not be appended when it arrives.</td></tr>
              <tr><td><code>unavailable</code></td><td>Struck through, with <code>reason</code> as text</td><td>—</td><td><b>Reachable</b>, announces the reason</td><td>Known and refused. The reason is what makes it useful — it tells the reader what to change.</td></tr>
              <tr><td><code>withheld</code></td><td><b>Not rendered</b></td><td><b>Yes</b> — a row with a lock</td><td>—</td><td>Policy says this person may not know the verb exists in detail, but they are entitled to know that something does.</td></tr>
            </tbody>
          </table>
        </div>

        <h3>Why <code>pending</code> is the one that would ship broken</h3>
        <p>Every EHR has async checks behind its menus: does this user hold prescriptive authority
          in this facility, is this order inside an active protocol, does this patient have a portal
          account. The obvious implementation renders what it knows and appends the rest. That
          implementation moves rows under a pointer that is already in flight — which is the exact
          mechanism the near-miss literature describes, produced deliberately by the loading state.</p>

        <figure>
          <div class="antd">
            <div data-fig="pending"></div>
          </div>
          <figcaption><b>Figure 10 — open both menus and wait one second without moving the
            mouse.</b> Left: two rows appear and everything below them shifts down about 30px; if
            your pointer was resting over the fourth row it is now over the sixth. Right: the same
            check, held in place, resolving into a row that was already the right height. The
            keyboard behaviour differs too — <code>nextIndex()</code> skips a pending row, so a fast
            Enter cannot land on an answer that has not arrived.</figcaption>
        </figure>

        <div class="note">
          <span class="lbl">The withheld count, and where it came from</span>
          <p>This is the same rule <code>ChartCommandPalette</code> applies to patients outside your
            treatment relationships: <em>counted, never named</em>. The palette says "3 further
            matches — break-glass required"; the menu says "1 further action on this record, hidden
            for a registered nurse — break-glass required". Same sentence shape, same reason, same
            helper family. It is a row inside the menu rather than a footnote under it, because a
            reader who scrolls past chrome has missed exactly the thing they needed.</p>
        </div>
""",
},

# ------------------------------------------------------------------ 9
{
"id": "disclosure", "short": "Disclosure",
"title": "Masking, break-glass, and the record the menu makes on every path",
"kicker": """<p>Two behaviours here, and both of them are the kind of thing a component either has
  from the first commit or never retrofits: the menu may not out-disclose its trigger, and a
  disclosure that was offered is a disclosure that gets recorded.</p>""",
"body": """
        <h3>The menu cannot out-disclose its trigger</h3>
        <p>A behavioral-health chart renders some rows masked — a Part 2 group note, a minor's
          confidential encounter, a sealed record. The row says <em>Restricted record</em> and shows
          nothing else. Right-click it and the naive implementation, holding the full resource in a
          prop, prints the title in the header. The interface has just leaked the record at the
          exact moment the reader believed it was being protected — and the reader did not ask for
          it, did not record a reason, and left no trace.</p>
        <p><code>describeSubject()</code> refuses. If <code>subject.masked</code> is set, the header
          is the resource word and nothing more, regardless of what else is on the object.</p>

        <figure>
          <div class="antd">
            <div data-fig="masked"></div>
          </div>
          <figcaption><b>Figure 11 — two notes, one masked.</b> Identical props shape, identical
            action list, identical component. The first menu will not say the name and the second
            one will.</figcaption>
        </figure>

        <h3>The record is made when the reasons are offered, not when they are answered</h3>
        <p>Break-glass in a real EHR requires additional authentication and a documented business
          reason before the chart opens; the reason code is part of the audit trail and gets compared
          against what was actually happening clinically. HIPAA does not use the phrase — 45 CFR
          §164.312(a)(2)(ii) requires an emergency access procedure and leaves the mechanism to
          you — but every implementation of it looks like this, and the reason list is the
          mechanism.</p>
        <p>So: <code>disclosureRecord()</code> fires with <code>outcome: "offered"</code> the moment
          the reason list is drawn, again with <code>"disclosed"</code> and the chosen reason if the
          reader continues, and with <code>"abandoned"</code> if they press Escape. The component
          <em>produces</em> the record; the host keeps it, because the host is the only thing that
          knows the actor and the session.</p>

        <figure>
          <div class="antd">
            <div data-fig="disclose"></div>
          </div>
          <figcaption><b>Figure 12 — right-click the note, choose Reveal Part 2 content, then press
            Escape.</b> Watch the audit strip. Note what is <em>not</em> in the record:
            <code>subjectNamed: false</code>. An audit line that carries a patient's name into a log
            with a wider readership than the chart has made the disclosure a second time, to a
            different audience, permanently.</figcaption>
        </figure>

        <div class="note warn">
          <span class="lbl">What this component does not do, and must not</span>
          <p><strong>Break-glass is signalled, never performed.</strong> The menu says an override
            exists, takes the reason, and reports it. The workflow behind it — the step-up
            authentication, the supervisor notification, the 24-to-48-hour incident report — is a
            separate surface with its own consent and its own record. Same boundary the palette
            draws. A component that performed a break-glass would be a component with an opinion
            about your identity provider.</p>
        </div>
""",
},

# ------------------------------------------------------------------ 10
{
"id": "bulk", "short": "Bulk",
"title": "Twelve patients selected, and the verb that must not be offered",
"kicker": """<p>Right-clicking a multiple selection is where context menus quietly do the most
  damage, because the failure mode is partial success and nobody designs the copy for it.</p>""",
"body": """
        <figure>
          <div class="antd">
            <div data-fig="bulk"></div>
          </div>
          <figcaption><b>Figure 13 — a twelve-patient selection.</b> The header counts rather than
            names. <code>Open chart</code> and <code>Log a collateral contact</code> are present but
            disabled with a reason, because they were never declared <code>bulk: "allowed"</code>.
            <code>Document a no-show</code> was, so it is offered — and its confirmation is
            <code>bulkConfirm</code>, written for twelve.</figcaption>
        </figure>

        <div class="feat">
          <div><div class="n">01</div><div><div class="t">Bulk is opt-in per action, and the default is single</div><div class="d">An action that has not said it is bulk-safe becomes <code>unavailable</code> on a multiple selection — <em>shown with the reason</em>, not removed. Hiding it teaches somebody the verb does not exist at all.</div></div></div>
          <div><div class="n">02</div><div><div class="t">A clinical action that is bulk-safe needs a second sentence</div><div class="d"><code>bulkConfirm</code> is required by the validator when <code>tier: "clinical"</code> meets <code>bulk: "allowed"</code>, because confirming twelve no-shows with a sentence written for one is a confirmation nobody read.</div></div></div>
          <div><div class="n">03</div><div><div class="t">The header counts, it does not name</div><div class="d"><em>12 patients selected</em>. Listing twelve names in a floating layer is a disclosure surface nobody asked for, and it makes the menu taller than the viewport.</div></div></div>
          <div><div class="n">04</div><div><div class="t">Partial failure is the host's, and the API says so</div><div class="d"><code>onRun</code> receives the whole subject including <code>also</code>, so the host writes per-subject and reports per-subject. <em>Nine of twelve succeeded</em> is the honest result and the component will not let you pretend otherwise by handing you a single boolean.</div></div></div>
          <div><div class="n">05</div><div><div class="t">Disclosure is never bulk</div><div class="d">Hard rule, not a default: <code>tier: "disclosive"</code> with <code>bulk: "allowed"</code> is a lint error. A break-glass across twelve records with one reason is twelve disclosures with one justification, and no privacy officer will accept that as a record.</div></div></div>
        </div>
""",
},

]
