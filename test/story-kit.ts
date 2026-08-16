/**
 * The small surface a play function is allowed to use.
 *
 * Re-exported from one place so a story never imports a test runner directly.
 * That keeps stories portable: the same file runs under our harness today and
 * under Storybook's test runner later, because both supply the same things —
 * `expect`, a queryable canvas, and a way to drive an interaction.
 *
 * Two ways to drive one, because they answer different needs.
 *
 * `userEvent` is the one to reach for. It is what Storybook's own test package
 * exposes, so a play function written against it ports unchanged, and it
 * dispatches a real sequence — pointer down, focus, up, click — rather than a
 * synthetic event. It also runs inside Testing Library's act environment.
 *
 * `act` is the escape hatch for the cases where a story drives something that
 * is not a user gesture at all: a timer, an imperative handle, a resolved
 * promise. Rendering happens inside `act` in the harness, but a play function
 * runs after it, so a state update it triggers lands outside that boundary.
 * React warns about it today and it is a real source of flakiness once the
 * suite runs in parallel.
 *
 * A bare `element.click()` is the thing neither of these is: it updates React
 * state outside `act` and reports nothing until the suite goes parallel.
 */

export { expect } from "vitest";
export { within, waitFor, screen } from "@testing-library/dom";
export { default as userEvent } from "@testing-library/user-event";
export { act } from "@testing-library/react";
