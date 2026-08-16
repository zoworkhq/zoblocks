---
"@oxygenui-design/loaders": minor
---

Fix two defects that made the elements unusable in React 19, Vue, and Angular,
and add the smoke applications that found them.

**Every attribute is now a writable property.** React 19 and Vue both decide per
binding whether to write a DOM property or an attribute, and both decide with
`if (key in element)`. Every attribute-backed value was a getter with no setter,
which passes that test and then throws:

```
TypeError: Cannot set property label of #<OxLoaderElement> which has only a getter
```

The elements did not render at all in React 19 or Vue. Setters now reflect to
the attribute, so a property write and an attribute write are indistinguishable
afterwards and attributes remain the source of truth. `delay`, `minDuration`,
`slowAfter`, `hint`, `slowHint`, `motion`, `scrim`, `announce`, and `size` are
newly readable as properties too.

**Events are hyphenated: `ox-loader-show`, `ox-loader-slow`, `ox-loader-hide`**
(previously `ox-loader:show` and friends). Angular's `(event)` binding reserves
the colon for its global-target syntax — `(window:resize)` — so `(ox-loader:show)`
does not compile, with no escape syntax available. Angular consumers would have
had to drop to `addEventListener` for every subscription. The names are exported
as `LOADER_EVENTS`. Breaking for anyone already subscribing, which is nobody:
the package has not been published.

`open` also gained a property, alongside the now-deprecated `isOpen` getter.

Both defects were found by `apps/smoke` — six applications, one per supported
framework, each built by that framework's real compiler and driven through the
same script in Chromium, Firefox, and WebKit on every CI run. The unit suite
could not have found either: it drives elements through `setAttribute`, which is
the one path that always worked.
