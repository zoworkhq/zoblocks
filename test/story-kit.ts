/**
 * The small surface a play function is allowed to use.
 *
 * Re-exported from one place so a story never imports a test runner directly.
 * That keeps stories portable: the same file runs under our harness today and
 * under Storybook's test runner later, because both supply these two things —
 * `expect` and a queryable canvas.
 */

export { expect } from "vitest";
export { within, waitFor, screen } from "@testing-library/dom";
