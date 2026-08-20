---
"@oxygenui-design/theme": patch
---

The export screen renders the file it is offering

A theme file is a claim that a brand survived translation into somebody else's
vocabulary, and the only thing that settles it is looking at _their_ Button. So
each framework export card now draws Ant Design's or Material UI's own
components under exactly the theme object the download beside it contains.

Deliberately the outbound direction. The inbound bridge maps a host's resolved
theme onto Oxygen's tokens, and the console does not have a customer's
`ConfigProvider` config — an inbound preview here could only show a sample theme
dressed up as theirs, which is worse than showing nothing.

Loaded with `ssr: false`, and that is not an optimisation. `"use client"` marks
where the client bundle begins, not where server rendering stops: Next still
evaluates the module on the server for the first HTML, which pulled antd and MUI
into the request path and took the render stream down with "the destination
stream closed early".

The console now declares antd and MUI, which an architectural test used to
forbid outright. That rule was a proxy for the claim that matters — Oxygen's
components need no UI framework — and it is now asserted directly and more
strictly in two parts: the component packages declare no framework dependency,
and inside the console a framework is reachable from exactly one named file and
never from its own interface.
