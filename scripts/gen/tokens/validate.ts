/**
 * The token gate — now owned by `@oxygenui-design/tokens/validate`.
 *
 * This file used to hold 604 lines of contrast, parity and tier checking. It
 * was reachable only by running the generator, which meant the theme console
 * would have had to reimplement it — and two definitions of "accessible
 * clinical palette" is two answers to the same question.
 *
 * The rules moved to the package so the build, the console's live preview, and
 * the server-side publish gate all run identical code. This re-export exists so
 * the generator's own modules keep importing `./validate`.
 *
 * See content/decisions/0012-token-surface-is-a-contract.md.
 */

export {
  validateTokens,
  checkStatusContrast,
  checkTextContrast,
  contrastRatio,
  measureContrast,
  resolveFlat,
  resolveTheme,
  type ContrastReading,
  type TokenProblem,
} from "@oxygenui-design/tokens/validate";
