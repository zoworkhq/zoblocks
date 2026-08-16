/**
 * @oxygenui/eslint-plugin
 *
 * Rules that enforce architectural invariants which were previously kept by
 * comment. Each one corresponds to a decision record, and each one exists
 * because the failure it prevents is silent — the code compiles, the tests
 * pass, and something is wrong in a clinical display.
 */

import noAbsencePlaceholder from "./rules/no-absence-placeholder.js";
import noAmbiguousClinicalCopy from "./rules/no-ambiguous-clinical-copy.js";
import noDynamicClassName from "./rules/no-dynamic-class-name.js";
import noForbiddenCapability from "./rules/no-forbidden-capability.js";
import noPrimitiveToken from "./rules/no-primitive-token.js";
import preferLogicalProperties from "./rules/prefer-logical-properties.js";
import signatureRequiresTypedPath from "./rules/signature-requires-typed-path.js";
import {
  noDisabledWithReason,
  switchAuditNeedsNow,
  switchNeedsCommitStrategy,
  switchNotForQuestions,
} from "./rules/switch-usage.js";

const plugin = {
  meta: { name: "@oxygenui/eslint-plugin", version: "0.1.0" },
  rules: {
    "no-absence-placeholder": noAbsencePlaceholder,
    "no-ambiguous-clinical-copy": noAmbiguousClinicalCopy,
    "no-dynamic-class-name": noDynamicClassName,
    "no-forbidden-capability": noForbiddenCapability,
    "no-primitive-token": noPrimitiveToken,
    "prefer-logical-properties": preferLogicalProperties,
    "signature-requires-typed-path": signatureRequiresTypedPath,
    "switch-not-for-questions": switchNotForQuestions,
    "switch-needs-commit-strategy": switchNeedsCommitStrategy,
    "no-disabled-with-reason": noDisabledWithReason,
    "switch-audit-needs-now": switchAuditNeedsNow,
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
      // An error, not a warning: a draw-only signature control is a WCAG
      // Level A failure that renders perfectly and passes every other test.
      "@oxygenui/signature-requires-typed-path": "error",
      // A switch inside a form that submits promises something it does not do,
      // and `disabled` beside a reason throws the reason away. Both are errors
      // because both render perfectly.
      "@oxygenui/switch-needs-commit-strategy": "error",
      "@oxygenui/no-disabled-with-reason": "error",
      // An audit event stamped with nothing is not an audit trail.
      "@oxygenui/switch-audit-needs-now": "error",
      // Warn rather than error while the existing catalog is converted. Becomes
      // an error in Phase 1; see ADR 0008.
      "@oxygenui/prefer-logical-properties": "warn",
      // Warn by design, not by transition. Every phrase this catches has a
      // legitimate use somewhere — the rule exists to make the author look at
      // it once, not to forbid a word.
      "@oxygenui/no-ambiguous-clinical-copy": "warn",
      // Warn by design: a question-shaped label is sometimes the right words
      // for a control that genuinely holds one answer. The rule exists to make
      // the author reach for `segmented` deliberately rather than by default.
      "@oxygenui/switch-not-for-questions": "warn",
    },
  },
};

export default plugin;
