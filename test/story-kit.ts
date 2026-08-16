/**
 * The small surface a play function is allowed to use.
 *
 * Re-exported from one place so a story never imports a test runner directly.
 * That keeps stories portable: the same file runs under our harness today and
 * under Storybook's test runner later, because both supply these things —
 * `expect`, a queryable canvas, and a way to drive an interaction.
 */

export { expect } from "vitest";
export { within, waitFor, screen } from "@testing-library/dom";

/**
 * For stories whose fixture IS an interaction — a confirmation panel that only
 * exists once a control has been activated, say.
 *
 * Rendering happens inside `act` in the harness, but a play function runs
 * after it, so a state update it triggers lands outside that boundary. React
 * warns about it today and it is a real source of flakiness once the suite
 * runs in parallel. Storybook's test runner supplies the same escape hatch.
 */
export { act } from "@testing-library/react";
