/**
 * @zoblocks/eslint-plugin
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
import noHardcodedCount from "./rules/no-hardcoded-count.js";
import noHeadingLevelDrift from "./rules/no-heading-level-drift.js";
import noPrimitiveToken from "./rules/no-primitive-token.js";
import noRoomNumberIdentifier from "./rules/no-room-number-identifier.js";
import noStigmatisingLanguage from "./rules/no-stigmatising-language.js";
import noTruncatedIdentity from "./rules/no-truncated-identity.js";
import noVagueFailure from "./rules/no-vague-failure.js";
import preferLogicalProperties from "./rules/prefer-logical-properties.js";
import requireAccordionSummary from "./rules/require-accordion-summary.js";
import signatureRequiresTypedPath from "./rules/signature-requires-typed-path.js";
import {
  noDisabledWithReason,
  switchAuditNeedsNow,
  switchNeedsCommitStrategy,
  switchNotForQuestions,
} from "./rules/switch-usage.js";
import tabsSemanticMode from "./rules/tabs-semantic-mode.js";

const plugin = {
  meta: { name: "@zoblocks/eslint-plugin", version: "0.1.0" },
  rules: {
    "identity-requires-stable-key": identityRequiresStableKey,
    "no-absence-placeholder": noAbsencePlaceholder,
    "no-ambiguous-clinical-copy": noAmbiguousClinicalCopy,
    "no-dynamic-class-name": noDynamicClassName,
    "no-forbidden-capability": noForbiddenCapability,
    "no-hardcoded-count": noHardcodedCount,
    "no-heading-level-drift": noHeadingLevelDrift,
    "no-primitive-token": noPrimitiveToken,
    "no-room-number-identifier": noRoomNumberIdentifier,
    "no-stigmatising-language": noStigmatisingLanguage,
    "no-truncated-identity": noTruncatedIdentity,
    "no-vague-failure": noVagueFailure,
    "prefer-logical-properties": preferLogicalProperties,
    "require-accordion-summary": requireAccordionSummary,
    "signature-requires-typed-path": signatureRequiresTypedPath,
    "switch-not-for-questions": switchNotForQuestions,
    "switch-needs-commit-strategy": switchNeedsCommitStrategy,
    "no-disabled-with-reason": noDisabledWithReason,
    "switch-audit-needs-now": switchAuditNeedsNow,
    "tabs-semantic-mode": tabsSemanticMode,
  },
};

/**
 * The component preset. Applies to anything shipped to a customer — registry
 * source today, the component packages after Phase 1.
 */
plugin.configs = {
  components: {
    plugins: { "@zoblocks": plugin },
    rules: {
      "@zoblocks/no-absence-placeholder": "error",
      "@zoblocks/no-dynamic-class-name": "error",
      "@zoblocks/no-forbidden-capability": "error",
      "@zoblocks/no-primitive-token": "error",
      // Three identity rules, all errors. Each one prevents a defect that
      // renders perfectly, passes every other check, and is wrong at exactly
      // the moment somebody uses it to confirm who they are treating.
      "@zoblocks/identity-requires-stable-key": "error",
      "@zoblocks/no-room-number-identifier": "error",
      "@zoblocks/no-truncated-identity": "error",
      // An error, not a warning: a draw-only signature control is a WCAG
      // Level A failure that renders perfectly and passes every other test.
      "@zoblocks/signature-requires-typed-path": "error",
      // Same profile: a severity rail with no words beside it renders
      // perfectly and silently deletes the signal for anyone in forced-colors
      // mode, reading a print, or unable to separate red from green.
      "@zoblocks/require-accordion-summary": "error",
      // A switch inside a form that submits promises something it does not do,
      // and `disabled` beside a reason throws the reason away. Both are errors
      // because both render perfectly.
      "@zoblocks/switch-needs-commit-strategy": "error",
      "@zoblocks/no-disabled-with-reason": "error",
      // An audit event stamped with nothing is not an audit trail.
      "@zoblocks/switch-audit-needs-now": "error",
      // An error for the same reason: a tablist of links renders perfectly,
      // passes every automated checker, and destroys a keyboard user's focus
      // the first time they press an arrow key.
      "@zoblocks/tabs-semantic-mode": "error",
      // Warn: the rule can only see lexical nesting, so a nested accordion
      // composed through a variable or a wrapper component is invisible to it.
      // It catches the common inline shape, which is where the mistake is made.
      "@zoblocks/no-heading-level-drift": "warn",
      // Warn rather than error while the existing catalog is converted. Becomes
      // an error in Phase 1; see ADR 0008.
      "@zoblocks/prefer-logical-properties": "warn",
      // Warn by design, not by transition. Every phrase this catches has a
      // legitimate use somewhere — the rule exists to make the author look at
      // it once, not to forbid a word.
      "@zoblocks/no-ambiguous-clinical-copy": "warn",
      // Same reasoning, higher stakes. A patient's own words are exempt, and
      // the alternative is always offered rather than the term merely banned.
      "@zoblocks/no-stigmatising-language": "warn",
      // Warn by design: a question-shaped label is sometimes the right words
      // for a control that genuinely holds one answer. The rule exists to make
      // the author reach for `segmented` deliberately rather than by default.
      "@zoblocks/switch-not-for-questions": "warn",
    },
  },
};

/**
 * Our own surfaces — the marketing site and the console.
 *
 * These had no preset, which is the reason they exist. `components` is scoped
 * to the registry and to each package's `src` tree, so a content audit found
 * the two rules broken most often were broken in `apps/` — the console's root
 * error boundary opening with "Something went wrong", and four stale counts
 * typed into page descriptions nobody re-reads.
 *
 * Deliberately not the whole `components` preset. Most of those rules are
 * about rendering a clinical record and would be noise on a pricing page; a
 * preset that fires on the wrong things is a preset somebody turns off. These
 * two are the ones CONTENT.md §10 says are mechanically checkable without
 * false positives, and nothing else is here until that is true of it too.
 */
plugin.configs.product = {
  plugins: { "@zoblocks": plugin },
  rules: {
    // Errors, both. Neither is a matter of taste, and neither is visible in a
    // diff — a count goes stale while nobody touches the file, and a vague
    // failure reads as finished copy right up until somebody hits it.
    "@zoblocks/no-hardcoded-count": "error",
    "@zoblocks/no-vague-failure": "error",
  },
};

export default plugin;
