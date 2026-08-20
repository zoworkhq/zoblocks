---
"@oxygenui-design/theme": minor
---

Empty-state illustrations, and cutting a favicon out of the wordmark

Four more asset roles — `illustration-empty`, `illustration-search`,
`illustration-denied`, `illustration-error` — reaching CSS as
`--ox-illustration-*` and the manifest with their alternative text.

They are four and not one because the states are genuinely different messages:
"nothing here yet" and "not yours to see" look nothing alike to a reader and
staff act on the difference. Each is previewed on a light _and_ a dark ground
at the same time, which is the point of the new `ground: "both"` — an
illustration is one file that has to survive both, nobody ships two, and a
drawing with a baked white background looks perfect on the light preview and is
a white rectangle in the dark theme.

The console also now offers to cut a favicon out of the light mark. Nothing
else here derives one asset from another, and the argument against it is weaker
in exactly this one place: the alternative is not "somebody drew it" but "the
tab shows a blank page icon". Three crops, previewed at 16, 32 and 64 pixels on
both grounds, because sixteen is the size that decides and the person choosing
should see that rather than be told. The cutting happens in a canvas in the
browser — a favicon needs a rasteriser and the browser already is one — and the
result is decoded server-side and put through `checkBrandAsset` like any
uploaded file. A picture this console generated is not a picture it trusts.

The role list also stopped being written down twice: `brandAssetSchema` now
takes its enum from `BRAND_ASSET_ROLES` rather than restating it, which it had
already drifted from within an hour of the registry growing.
