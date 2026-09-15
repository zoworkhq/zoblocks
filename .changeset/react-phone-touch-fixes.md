---
"@zoblocks/react": patch
---

Touch and phone fixes.

- **DataGrid** pins the identity column by default (`pinnedColumns` now defaults to 1; pass 0 for none), so the client name stays in view when a phone scrolls the grid sideways. The pin seam shows only once content has scrolled under it. Row checkboxes have a 24px tap target around the same 15px box, and hover styles no longer stick after a tap.
- **Switch** abandons a press-and-hold when the browser cancels the pointer, and suppresses text selection and the iOS callout during the hold.
- **ChartContextMenu** rows no longer select text or raise the iOS callout on long-press. The bottom sheet clears the home indicator.
- **ChartCommandPalette**, **Switch** attestation and **Copilot** inputs use at least 16px text on touch screens, so iOS no longer zooms on focus. Viewport-relative heights use `dvh`.
