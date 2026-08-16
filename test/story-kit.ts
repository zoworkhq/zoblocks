/**
 * The small surface a play function is allowed to use.
 *
 * Re-exported from one place so a story never imports a test runner directly.
 * That keeps stories portable: the same file runs under our harness today and
 * under Storybook's test runner later, because both supply the same three
 * things — `expect`, a queryable canvas, and a way to act as the user.
 *
 * `userEvent` is here rather than left to each story for two reasons, and the
 * second is the one that bites. It is what Storybook's own test package
 * exposes, so a play function written against it ports unchanged. And it
 * dispatches through Testing Library's act environment, whereas a bare
 * `element.click()` updates React state outside `act` — which prints a warning
 * today and becomes real flakiness the moment the suite runs in parallel, on
 * the stories that exercise a state change rather than a static render.
 */

export { expect } from "vitest";
export { within, waitFor, screen } from "@testing-library/dom";
export { default as userEvent } from "@testing-library/user-event";
