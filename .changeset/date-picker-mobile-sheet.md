---
"@zoblocks/react": patch
---

Date and time pickers now fit on phones. Below 40rem, or on a touch screen held landscape, the calendar opens as a bottom sheet: full width, one month, presets in a scrolling row above the grid that fades at whichever edge still hides a preset, 40px day cells, a Cancel / Done footer that stays in view while the month scrolls, and a scrim that closes it. The page behind stops scrolling while it is open. Escape, focus and the dialog's label work as before.

On wider screens the popover stays anchored to its field but no longer runs off the edge. It keeps 8px from every side, scrolls inside itself when taller than the window, and follows the visual viewport as a phone's keyboard or browser bar moves. Tapping outside now closes it on iOS, where it listened for `mousedown` and a tap on plain content did not always send one.

On screens with no hover, the calendar's arrow-key legend is hidden. A `fluid` calendar placed in a flex container now fills it, so its grid and its Cancel / Done row reach the container's edge.
