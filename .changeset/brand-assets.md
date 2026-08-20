---
"@oxygenui-design/theme": minor
---

Brand artwork: seven roles, one table, and a manifest to deliver them

A customer theme can now carry the artwork that goes with its palette, not just
the palette. Seven roles — the wordmark on light, dark and single colour; a
favicon; a home-screen icon; a link-preview card; a raster mark for email —
held in one `BRAND_ASSETS` registry rather than seven fields, so what differs
between them (accepted formats, required shape, where it is delivered) is data.

Three things this changes that are worth knowing about:

- **Uploads are checked, not sanitised.** An SVG is a document, not a picture:
  served from the console's origin it runs with the console's privileges. Any
  script, event handler, embedded document, remote `<use>` or entity
  declaration is refused, and the refusal names what was found — "invalid file"
  sends a designer back to the export settings that produced it. Raster formats
  are never parsed. Serving adds `nosniff` and a `default-src 'none'; sandbox`
  policy over the top.
- **Shape problems warn rather than refuse.** A square link-preview card is a
  fine file in the wrong shape; a 192×192 home-screen icon is a size the
  platform genuinely fixes. The first is stored with a note about cropping, the
  second is refused. Dimensions are read from the file's own header.
- **A manifest sits beside the stylesheet.** `…@7.json` alongside `…@7.css`,
  at the same pinned version, carrying what CSS cannot: alternative text,
  assets CSS never draws, absolute URLs, and the measured size so a host can
  reserve the space.

The three marks also reach CSS as `--ox-logo-light`, `--ox-logo-dark`,
`--ox-logo-mono`, plus `--ox-logo`, which switches with the theme so a host
writes `background-image: var(--ox-logo)` and nothing else.

`themeAssetsSchema.logos` is now `.brand`, and entries carry `role` instead of
`variant`. `emptyAssets()` is exported, because the empty literal it replaces
was written out in six places.

In the console, the Brand screen now manages all seven, grouped by what renders
them. Two bugs surfaced while wiring it: `/f/{org}/{file}` only ever served
fonts, so uploaded artwork 404ed behind a broken image, and the previews
followed the console's own theme — meaning "Mark, on light" previewed on black
for anybody working in dark mode, which is precisely the failure a per-ground
preview exists to catch.
