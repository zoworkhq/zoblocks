---
"@zoblocks/bridge-core": minor
"@zoblocks/bridge-antd": minor
"@zoblocks/bridge-mui": minor
---

The inverse bridge: a Zoblocks brand, pushed into the host's own framework.

```diff
  <ZoblocksAntdProvider>
-   <YourAntdApp />   // antd's default blue
+   <YourAntdApp />   // your brand
  </ZoblocksAntdProvider>
```

The forward bridge answers "make Zoblocks's components look like our antd app".
This answers the question customers ask second and care about more: _we
configured our brand in your app — why do our **own** buttons still look
like Ant Design's default blue?_ A customer configures once and their whole
application follows, which is the difference between a component library with
theming and a design system.

It is the same correspondence read backwards, which is what keeps both
directions honest: if `colorPrimary ↔ --zb-accent` is ever wrong, it is wrong
both ways and one round-trip test catches it. `ZoblocksAntdProvider` and
`ZoblocksMuiProvider` take the same props, so switching framework stays one
import.

`useZoblocksTokens()` in `bridge-core` resolves the live `--zb-*` values from
computed style — the browser is the only authority on what a token currently
means, since it depends on which brand loaded and which `data-zb-theme` is set.
It is SSR-safe, scopeable to a subtree so two customers can render on one page,
and it follows a theme change through a `MutationObserver`: without that, a
framework holding the previous values renders half a theme, which looks like a
bug in the customer's code rather than in ours.

**Clinical status is not pushed either way**, and the outbound reason is the
more surprising one. A framework applies `colorError` to a validation message
and a delete button, so a colour meaning _this result is dangerous_ would come
to mean _this field is wrong_. The hex survives; the meaning does not.
