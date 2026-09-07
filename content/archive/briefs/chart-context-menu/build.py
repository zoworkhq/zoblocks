#!/usr/bin/env python3
"""Assemble oxygen-context-menu-brief.html.

Same discipline as the other briefs in the series: the report is generated,
never hand-edited. Prose lives in prose_a/prose_b, the prototype in
core.js + ui.js + data.js + figs.js, and the chrome in base.css + menu.css.
A build that leaves an unsubstituted @@TOKEN@@ fails rather than shipping.
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).parent
# The repo root, three levels up from content/briefs/chart-context-menu/.
# Was an absolute path into a worktree when this lived in a scratchpad; that is
# exactly why it had to move here to be rebuildable.
REPO = HERE.parents[2]
OUT = REPO / "oxygen-context-menu-brief.html"

sys.path.insert(0, str(HERE))
from prose_a import SECTIONS_A          # noqa: E402
from prose_b import SECTIONS_B, HERO    # noqa: E402

SECTIONS = SECTIONS_A + SECTIONS_B


def read(name):
    return (HERE / name).read_text(encoding="utf-8")


def toc():
    return "\n".join(
        f'        <a href="#{s["id"]}">{s["short"]}</a>' for s in SECTIONS
    )


def body():
    out = []
    for i, s in enumerate(SECTIONS, 1):
        out.append(f"""    <section id="{s['id']}">
      <div class="wrap">
        <div class="sec-head">
          <span class="sec-num">§{i:02d} — {s['short']}</span>
          <h2>{s['title']}</h2>
          {s.get('kicker', '')}
        </div>
{s['body']}
      </div>
    </section>""")
    return "\n".join(out)


HTML = """<meta charset="utf-8" />
<title>Oxygen Chart Context Menu</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="A healthcare-grade context menu for EHR and behavioral-health interfaces: the subject header as a wrong-patient check, consequence as a four-tier rank, disclosure auditing, and fifteen live interactive figures driven by the proposed core." />
<style>
@@BASECSS@@
@@MENUCSS@@
</style>

<header class="hero">
  <div class="wrap">
@@HERO@@
  </div>
</header>

<nav class="toc" aria-label="Sections">
  <div class="wrap">
@@TOC@@
  </div>
</nav>

<main>
@@BODY@@
</main>

<footer>
  <div class="wrap">
    <div><strong>Oxygen UI</strong> — Chart Context Menu brief. Generated 31 August 2026 from
      <code>scratchpad/report/</code>: <code>prose_a.py</code>, <code>prose_b.py</code>,
      <code>build.py</code>, <code>base.css</code>, <code>menu.css</code>,
      <code>core.js</code>, <code>ui.js</code>, <code>data.js</code>, <code>figs.js</code>.</div>
    <div>Every figure runs the prototype core in <code>core.js</code>, which is written to the API
      §16 proposes. Nothing here reads the wall clock, touches the network, or renders a real
      patient. Names, MRNs and values are synthetic.</div>
    <div>Claims marked with a source in §21 were checked against a primary or peer-reviewed
      document in August 2026. Claims without one are argument, and are written as argument.</div>
  </div>
</footer>

<script>
@@CORE@@
</script>
<script>
@@UI@@
</script>
<script>
@@DATA@@
</script>
<script>
@@MOCK@@
</script>
<script>
@@FIGS@@
</script>
"""


def main():
    html = HTML
    subs = {
        "@@BASECSS@@": read("base.css"),
        "@@MENUCSS@@": read("menu.css"),
        "@@HERO@@": HERO,
        "@@TOC@@": toc(),
        "@@BODY@@": body(),
        "@@CORE@@": read("core.js"),
        "@@UI@@": read("ui.js"),
        "@@DATA@@": read("data.js"),
        "@@MOCK@@": read("mock.js"),
        "@@FIGS@@": read("figs.js"),
    }
    for k, v in subs.items():
        html = html.replace(k, v)

    left = re.findall(r"@@[A-Z_]+@@", html)
    if left:
        raise SystemExit(f"unsubstituted tokens: {sorted(set(left))}")

    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT}  {len(html):,} bytes  ·  {len(SECTIONS)} sections")


if __name__ == "__main__":
    main()
