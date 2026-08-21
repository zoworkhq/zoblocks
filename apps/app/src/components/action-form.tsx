"use client";

/**
 * A form whose action returns a result rather than redirecting.
 *
 * Server actions bound straight to `<form action>` must return void, which
 * leaves nowhere for a validation failure to go. `useActionState` is what turns
 * a refusal into something the page can render — and rendering it is the point:
 * the publish gate refusing a theme is the most important message this app
 * produces, and "something went wrong" would waste it.
 */

import { useActionState, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/lib/actions";
import { Callout, useToast } from "@/components/ui";

export function ActionForm({
  action,
  children,
  className,
  /**
   * The submit row. Rendered inside the `<form>` and outside the disabled
   * fieldset, so a `SubmitButton` in here can read `useFormStatus` and stay
   * focusable while the action runs.
   *
   * A plain node rather than a render callback taking `pending`: a function
   * cannot cross the server/client boundary, so that shape forced every page
   * with a form to become a client component.
   */
  footer,
  /**
   * Report through the toast alone, with no inline callout.
   *
   * For a form living in a table cell. The inline result is the right default
   * — a refusal listing six failing pairs is something to fix while looking at
   * it — but a `16rem` column is not a place to read one: a two-sentence
   * refusal wrapped to eight lines and took the row from 40px to 800px,
   * shoving every other member off the screen. In a cell the toast is the
   * whole report.
   */
  quiet = false,
}: {
  action: (form: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  quiet?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    async (_previous: ActionResult | null, form: FormData) => action(form),
    null,
  );

  /*
   * The result twice: inline, and as a toast.
   *
   * Not redundancy. The inline `Callout` is what a reader works *from* — a
   * validation refusal listing six failing pairs is something to fix while
   * looking at it. The toast is what tells them the action happened at all,
   * because the inline result renders wherever the form is, and on the theme
   * page that is a 22rem column in the header where a publish confirmation was
   * genuinely easy to miss.
   *
   * `toast` is deliberately absent from the dependency list. It is stable, and
   * including it would re-fire the effect on any provider re-render — raising
   * the same toast again for a result the reader has already dismissed. The
   * `announced` ref is what makes that safe rather than merely lucky: the same
   * result object is never announced twice, whatever re-renders around it.
   */
  const toast = useToast();
  const announced = useRef<ActionResult | null>(null);

  /*
   * A counter that ticks once per distinct result, used as the inline
   * callout's `key`.
   *
   * Adjusted during render rather than in an effect. React re-runs the
   * component immediately on a set-during-render and does not paint the
   * discarded pass, so the callout is created with its final key and animates
   * once. Bumping it in an effect instead would paint the new message under
   * the *old* key first and only then remount it — the message would appear,
   * blink, and appear again.
   */
  const [keyedTo, setKeyedTo] = useState<ActionResult | null>(null);
  const [announceKey, setAnnounceKey] = useState(0);
  if (state !== keyedTo) {
    setKeyedTo(state);
    setAnnounceKey((n) => n + 1);
  }

  useEffect(() => {
    if (!state || state === announced.current) return;
    announced.current = state;

    toast.show({
      tone: state.ok ? "pass" : "fail",
      title: state.message ?? (state.ok ? "Done." : "That did not work."),
      ...(state.problems?.length
        ? { detail: `${state.problems.length} problem(s) listed below.` }
        : {}),
    });
    // `toast` is intentionally not a dependency; see the note above.
  }, [state]);

  return (
    <form action={formAction} className={className}>
      {/*
        `contents` rather than a wrapping box: a fieldset is a block element
        with its own box model, and letting it participate in layout would put
        an invisible container between this form and whatever grid or stack the
        caller built around `children`.
      */}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>

      {footer}

      {/*
        Not a live region any more — the toast is.

        Both announcing meant a screen reader read every result twice: once as
        the toast and once as this. The toast is the announcement; this is the
        detail a reader navigates *to* and works from, so it stays as ordinary
        content.

        `rise-in` lives here rather than on `Callout`, because it belongs to the
        *result* and not to the component. Most callouts on this app are
        page content — the standing warning that an organisation has one
        administrator, the note that a theme has never been published — and
        content that slides in every time you open a screen is a tic. What
        needs the movement is the answer to something the reader just did.

        Keyed on the result, so a second submission replays it. Without the
        key React reuses the node, a CSS animation does not restart on a node
        that was never re-created, and submitting the same failing form twice
        would look like nothing happened at all.
      */}
      <div className="empty:hidden">
        {!quiet && state && !state.ok && (
          <Callout
            key={announceKey}
            className="rise-in"
            tone="fail"
            title={state.message ?? "That did not work."}
            items={state.problems?.slice(0, 6)}
          >
            {state.problems && state.problems.length > 6
              ? `Showing the first 6 of ${state.problems.length}.`
              : undefined}
          </Callout>
        )}
        {!quiet && state?.ok && state.message && (
          <Callout key={announceKey} className="rise-in" tone="pass" title={state.message} />
        )}
      </div>
    </form>
  );
}
