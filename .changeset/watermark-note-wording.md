---
"@oxygenui-design/theme": patch
---

Reword the draft-watermark note so it says what it means.

"An unsigned note that prints clean gets filed and read as final" used "clean"
to mean "without the watermark" — and `no-stigmatising-language` flagged it,
correctly in the sense that matters: this library's own argument is that the
word does work and changes how the next clinician reads a patient. A string that
needs the reader to pick the harmless sense is a string worth rewriting, even
when the sense was never in doubt here.

It was also the ninth warning against a `--max-warnings 8` ceiling, so `pnpm
lint` failed on it.
