/**
 * @oxygenui-design/elements — Oxygen controls as custom elements.
 *
 * Dependency-free, framework-agnostic, and side-effectful by design: importing
 * an entry point DEFINES the element. Marking this package side-effect-free
 * would let a bundler drop the import and leave the page full of undefined
 * elements.
 *
 *     import "@oxygenui-design/elements/switch";
 *
 *     <ox-switch label="Contact precautions" value="on"
 *                tone="caution" state-labels="in-effect"></ox-switch>
 *
 * The React channel is `@oxygenui-design/react`, which owns the commit machine
 * itself. Here the host drives `phase` and the element renders and announces —
 * see the note in `switch.ts` for why the division falls there.
 */

export { OxSwitchElement, SWITCH_EVENTS, type SwitchEvent } from "./switch.js";
export {
  ABSENT_REASON_LABEL,
  COMMIT_PHASES,
  STATE_LABEL_PRESETS,
  SWITCH_SIZE,
  nextValueFor,
  resolveStateLabels,
  wordFor,
  type AbsentReason,
  type CommitPhase,
  type StateLabelPreset,
  type StateLabels,
  type SwitchSize,
  type SwitchTone,
  type SwitchValue,
} from "./vocabulary.js";
