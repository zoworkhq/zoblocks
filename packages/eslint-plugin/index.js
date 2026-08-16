/**
 * @oxygenui/eslint-plugin
 *
 * Rules that enforce architectural invariants which were previously kept by
 * comment. Each one corresponds to a decision record, and each one exists
 * because the failure it prevents is silent — the code compiles, the tests
 * pass, and something is wrong in a clinical display.
 */

import identityRequiresStableKey from "./rules/identity-requires-stable-key.js";
import noAbsencePlaceholder from "./rules/no-absence-placeholder.js";
import noAmbiguousClinicalCopy from "./rules/no-ambiguous-clinical-copy.js";
import noDynamicClassName from "./rules/no-dynamic-class-name.js";
import noForbiddenCapability from "./rules/no-forbidden-capability.js";
import noHeadingLevelDrift from "./rules/no-heading-level-drift.js";
import noPrimitiveToken from "./rules/no-primitive-token.js";
import noRoomNumberIdentifier from "./rules/no-room-number-identifier.js";
import noTruncatedIdentity from "./rules/no-truncated-identity.js";
import preferLogicalProperties from "./rules/prefer-logical-properties.js";
import requireAccordionSummary from "./rules/require-accordion-summary.js";
import signatureRequiresTypedPath from "./rules/signature-requires-typed-path.js";
import tabsSemanticMode from "./rules/tabs-semantic-mode.js";

const plugin = {
  meta: { name: "@oxygenui/eslint-plugin", version: "0.1.0" },
  rules: {
    "identity-requires-stable-key": identityRequiresStableKey,
    "no-absence-placeholder": noAbsencePlaceholder,
    "no-ambiguous-clinical-copy": noAmbiguousClinicalCopy,
    "no-dynamic-class-name": noDynamicClassName,
    "no-forbidden-capability": noForbiddenCapability,
    "no-heading-level-drift": noHeadingLevelDrift,
    "no-primitive-token": noPrimitiveToken,
    "no-room-number-identifier": noRoomNumberIdentifier,
    "no-truncated-identity": noTruncatedIdentity,
    "prefer-logical-properties": preferLogicalProperties,
    "require-accordion-summary": requireAccordionSummary,
    "signature-requires-typed-path": signatureRequiresTypedPath,
    "tabs-semantic-mode": tabsSemanticMode,
  },
};

/**
 * The component preset. Applies to anything shipped to a customer — registry
 * source today, the component packages after Phase 1.
 */
plugin.configs = {
  components: {
    plugins: { "@oxygenui": plugin },
    rules: {
      "@oxygenui/no-absence-placeholder": "error",
      "@oxygenui/no-dynamic-class-name": "error",
      "@oxygenui/no-forbidden-capability": "error",
      "@oxygenui/no-primitive-token": "error",
      // Three identity rules, all errors. Each one prevents a defect that
      // renders perfectly, passes every other check, and is wrong at exactly
      // the moment somebody uses it to confirm who they are treating.
      "@oxygenui/identity-requires-stable-key": "error",
      "@oxygenui/no-room-number-identifier": "error",
      "@oxygenui/no-truncated-identity": "error",
      // An error, not a warning: a draw-only signature control is a WCAG
      // Level A failure that renders perfectly and passes every other test.
      "@oxygenui/signature-requires-typed-path": "error",
      // Same profile: a severity rail with no words beside it renders
      // perfectly and silently deletes the signal for anyone in forced-colors
      // mode, reading a print, or unable to separate red from green.
      "@oxygenui/require-accordion-summary": "error",
      // An error for the same reason: a tablist of links renders perfectly,
      // passes every automated checker, and destroys a keyboard user's focus
      // the first time they press an arrow key.
      "@oxygenui/tabs-semantic-mode": "error",
      // Warn: the rule can only see lexical nesting, so a nested accordion
      // composed through a variable or a wrapper component is invisible to it.
      // It catches the common inline shape, which is where the mistake is made.
      "@oxygenui/no-heading-level-drift": "warn",
      // Warn rather than error while the existing catalog is converted. Becomes
      // an error in Phase 1; see ADR 0008.
      "@oxygenui/prefer-logical-properties": "warn",
      // Warn by design, not by transition. Every phrase this catches has a
      // legitimate use somewhere — the rule exists to make the author look at
      // it once, not to forbid a word.
      "@oxygenui/no-ambiguous-clinical-copy": "warn",
    },
  },
};

export default plugin;
