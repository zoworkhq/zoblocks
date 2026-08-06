/**
 * @oxygenui/eslint-plugin
 *
 * Rules that enforce architectural invariants which were previously kept by
 * comment. Each one corresponds to a decision record, and each one exists
 * because the failure it prevents is silent — the code compiles, the tests
 * pass, and something is wrong in a clinical display.
 */

import noDynamicClassName from "./rules/no-dynamic-class-name.js";
import noForbiddenCapability from "./rules/no-forbidden-capability.js";
import noPrimitiveToken from "./rules/no-primitive-token.js";
import preferLogicalProperties from "./rules/prefer-logical-properties.js";

const plugin = {
  meta: { name: "@oxygenui/eslint-plugin", version: "0.1.0" },
  rules: {
    "no-dynamic-class-name": noDynamicClassName,
    "no-forbidden-capability": noForbiddenCapability,
    "no-primitive-token": noPrimitiveToken,
    "prefer-logical-properties": preferLogicalProperties,
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
      "@oxygenui/no-dynamic-class-name": "error",
      "@oxygenui/no-forbidden-capability": "error",
      "@oxygenui/no-primitive-token": "error",
      // Warn rather than error while the existing catalog is converted. Becomes
      // an error in Phase 1; see ADR 0008.
      "@oxygenui/prefer-logical-properties": "warn",
    },
  },
};

export default plugin;
