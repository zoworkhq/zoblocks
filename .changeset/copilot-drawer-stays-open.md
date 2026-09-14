---
"@zoblocks/copilot-react": patch
---

Sources opened while an answer is finishing now stay open. The drawer used to close as the answer was marked complete, which shut it a moment after a clinician opened it. It now closes when a new question is sent, every time — before, that close could be skipped when updates arrived together.
