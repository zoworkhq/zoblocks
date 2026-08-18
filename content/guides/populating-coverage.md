# Populating `coverage`, and the one way to defeat it

For implementers wiring `CareTimeline` — or anything else that follows
[ADR 0011](../decisions/0011-summaries-declare-their-boundaries.md) — to a real
multi-source query.

The component's whole claim is a sentence at the foot of the list saying what
the list is a view of. That sentence is only as honest as the object you hand
it, and there is one mistake that quietly makes it a lie.

## The mistake

```ts
// Every source that fails is swallowed here, and the component never learns.
const results = await Promise.allSettled([queryEhr(), queryExchange()]);
const events = results
  .filter((r) => r.status === "fulfilled")
  .flatMap((r) => r.value);

<CareTimeline
  events={events}
  coverage={{ order: "newest-first", sources: [{ id: "ehr", label: "Our EHR", status: "ok" }] }}
/>;
```

This compiles, satisfies the type, renders beautifully, and is exactly the
failure the component exists to prevent. The exchange timed out; the timeline
says one source was searched and it was fine.

**The rule: a source that failed has to reach the component.** Catching the
error at the data layer and returning a shorter array is the single most common
way to defeat a coverage claim, and nothing downstream can detect it.

## The shape that works

```ts
const [ehr, exchange] = await Promise.allSettled([queryEhr(), queryExchange()]);

const sources: TimelineSource[] = [
  ehr.status === "fulfilled"
    ? { id: "ehr", label: "Northside EHR", status: "ok" }
    : { id: "ehr", label: "Northside EHR", status: "unavailable", detail: reasonOf(ehr) },
  exchange.status === "fulfilled"
    ? { id: "hie", label: "Northside Regional Exchange", status: "ok" }
    : {
        id: "hie",
        label: "Northside Regional Exchange",
        status: "unavailable",
        // Required by validateCoverage. A failure with no reason tells the
        // reader only that something failed, which is where they stop reading.
        detail: "Timed out after 8s.",
      },
];
```

`validateCoverage()` returns a list of problems rather than throwing — a
component that throws on a malformed payload takes the chart down with it, and
this repository forbids both throwing and logging in component source. The
component renders the problems it was given instead of rendering around them.

## Four fields, and what each is actually promising

| Field     | Promises                                          | Does **not** promise                                                  |
| --------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| `sources` | Every system that was asked, and how it answered. | That those systems hold a complete record.                            |
| `window`  | The period the query covered.                     | That the period is the patient's whole history.                       |
| `total`   | How many events match, when the server said so.   | Anything, if the server did not say. Omit it rather than guess.       |
| `hidden`  | Why events are not on the page, with counts.      | That the counts sum to `total` — the component derives the remainder. |

`coverage` reports **what this query reached**, never what exists. A source that
answers with an incomplete record is reported as reached, and that limit is
stated in the component's own `limitations` because a safety control trusted
beyond its guarantee is worse than none.

## Paging

Pass `total` from the server and let the component work out the remainder. If
you also apply a local `limit`, both are counted and the larger is reported —
events kept off the page by `limit` and events the server holds but you never
fetched are the same fact to a reader.

```ts
coverage={{
  order: "newest-first",
  total: page.total,              // 43
  sources,
}}
limit={5}                          // "Showing 5 of 43 · 38 beyond this page"
```

## Gaps

A gap is **declared, never inferred**. Turning eleven quiet weeks into "records
may be missing" would be the component inventing a claim; your data layer is the
thing that knows a source was unreachable for a period.

```ts
gaps: exchange.status === "rejected"
  ? [{ from: lastSuccessfulSync, to: nowIso, reason: "the exchange was not reachable" }]
  : undefined,
```

The engine places each gap between the two rendered events it falls between —
across a group boundary if that is where it lands, because the interesting gaps
are exactly the ones that span a month.

## Adapters have the same obligation

`toTimelineEvents()` returns `{ events, unmapped }`. Fold `unmapped` in:

```ts
const { events, unmapped } = toTimelineEvents(bundle, { now, source: "ehr" });

hidden: unmapped.map(({ type, count }) => ({ reason: "unmapped" as const, count, label: type })),
```

A silent drop in a data adapter is the same lie one layer further down, where
nobody will look for it.

## The honest minimum

If you have one source and no paging, this is four lines and it is **true**:

```tsx
<CareTimeline
  events={events}
  now={serverTime}
  coverage={{
    sources: [{ id: "app", label: "This application", status: "ok" }],
    order: "newest-first",
  }}
  aria-label="Care timeline"
/>
```

That is the point of the required prop. It is not asking for work you have not
done; it is asking you to write down what you did.
