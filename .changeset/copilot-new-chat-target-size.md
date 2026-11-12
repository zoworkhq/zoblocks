---
"@zoblocks/react": patch
---

`Copilot`'s icon-only "New chat" button now keeps a 24×24px minimum target (`min-w-6 shrink-0`, like the collapse button beside it). In a crowded header it could be squeezed to 18px wide, failing WCAG 2.5.8 target size.
