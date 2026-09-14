---
"@zoblocks/tabs": patch
"@zoblocks/tabs-testing": patch
---

`onBeforeChange` is now read when a change is requested, not on first render. A guard like `() => !isDirty` now blocks once the note is dirty, and a guard added after mount now counts. Before, both were ignored and a tab switch could drop an unsigned note. `useTabs` gets the same fix.

Arrow keys now follow the on-screen order after keyed triggers move. After Ctrl+Shift+Arrow, focus stays on the tab that moved, so pressing it again moves the same tab.

`overflow="collapse"` now hides the strip when it shows the select. Before, the stylesheet kept both on screen and in the accessibility tree.

`overflow="menu"` now removes a tab from the strip when it moves to More, so no tab shows twice. Arrow keys skip those tabs. The More menu now takes ArrowUp, ArrowDown, Home and End, and Tab closes it.

`keepScroll` now restores the scroll position. It saved 0 every time. It is on by default, and the docs now say so.

A value that matches no tab no longer leaves the strip unreachable. The first enabled tab takes the tab stop. An unknown `?tab=` value is not selected; it applies if that tab appears later.

`@zoblocks/tabs-testing`: `aria-labelledby` and `aria-describedby` with several ids, such as `"title count"`, no longer fail.
