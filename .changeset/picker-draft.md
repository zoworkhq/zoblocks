---
"@oxygenui-design/theme": patch
---

Cover the asset store, the manifest and the picker, and fix a field that could not be typed into

Writing tests for the pieces added this week found one real defect and closed
several gaps where the only coverage was a browser test.

**The colour picker's hex field could not be typed into.** It was bound straight
to the value prop, and an incomplete hex is correctly not emitted upstream — so
the parent's state never moved and React restored the old text on the very next
render. Every keystroke disappeared as it was made. The field looked right,
opened right, and could only be changed by pasting six characters over a full
selection. `ColorField` had solved this with a local draft and the pattern did
not get carried across.

New coverage for things that previously had none:

- **The asset store.** That a second upload replaces rather than appends, that
  two roles written at the same moment both survive — the reason those writes
  use array operators — that removing one leaves its neighbours, and every
  refusal: unknown role, executable artwork, whitespace-only alt text, a
  home-screen icon that is not the size the platform fixes.
- **Glyph uploads.** A batch containing one bad file still stores the rest, a
  locked mark is refused, a raster glyph is refused because a mask reads its
  alpha, and a slot is replaced rather than accumulated.
- **The manifest.** Absolute URLs, no doubled slash, an already-absolute source
  left alone, alternative text carried including the empty string, and registry
  ordering so two publishes of one theme produce the same file.
- **WebP dimensions in all three container forms.** A design tool emits VP8L for
  lossless and VP8X whenever there is alpha — which a logo always has — so
  reading only the lossy header would have worked on the test file and returned
  nothing for what customers export.
- **The segmented control's keyboard contract.** One tab stop rather than one
  per option, arrows in both directions, wrapping at the ends, and stepping over
  a disabled option.
- **A replaced glyph reaching the emitted stylesheet**, which is the one step
  that can fail while every other part of the feature still appears to work.
