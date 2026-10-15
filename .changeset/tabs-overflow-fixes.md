---
"@zoblocks/tabs": patch
---

Two overflow fixes.

`overflow="collapse"` no longer flickers between the strip and its `<select>`. The decision read the tablist's width, and a collapsed tablist is hidden and measures zero, so the strip came back, measured narrow, and collapsed again every other frame. It now reads the bar around the list, which fills the container in both states — so a short strip in a wide container no longer collapses either, and widening the container brings the strip back.

`overflow="menu"` keeps the list full width. The list was sized to its content, so each refit measured a narrower list and parked one more tab, settling on the selected tab alone beside "More 10".
