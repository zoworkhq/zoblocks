import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * Testing Library only registers its own auto-cleanup when Vitest runs with
 * `globals: true`. This project does not, so unmounting between tests is done
 * here explicitly — without it, every `getByRole` after the first render in a
 * file matches leftovers from the previous one and the failures look like
 * component bugs rather than harness bugs.
 */
afterEach(() => {
  cleanup();
});
