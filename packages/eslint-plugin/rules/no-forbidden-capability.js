/**
 * Constrains what a component is capable of doing.
 *
 * These are the checks that make a customer's vendor security review short. A
 * component library that structurally cannot reach the network, the
 * environment, or the console is an easy thing for a hospital security team to
 * approve — and each of these is a review-passes-until-it-doesn't failure, which
 * is exactly the kind lint is for rather than review.
 *
 * `console.*` is included for a specific reason: a component that logs its props
 * writes a Patient resource to the browser console, and from there to whatever
 * error-reporting service the customer has installed. That is a PHI
 * exfiltration path created by a debugging statement someone forgot to remove.
 *
 * See content/decisions/0009-supply-chain-and-component-constraints.md.
 */

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow environment access, network calls, dynamic evaluation, raw HTML injection, and console output in component source.",
    },
    schema: [],
    messages: {
      env: "Components must not read process.env. A registry component is copied into the customer's project, where that variable does not exist; the failure surfaces in their build, not ours.",
      network:
        "Components must not make network calls. Data fetching belongs to the application — see ARCHITECTURE.md §14.",
      evaluate: "Components must not use eval or the Function constructor.",
      html: "Components must not use dangerouslySetInnerHTML. Clinical text arrives from a FHIR payload and is not trusted markup.",
      console:
        "Components must not write to the console. A component that logs its props writes PHI to the browser console and onward to any error-reporting service the customer has installed.",
    },
  },

  create(context) {
    const NETWORK_CALLS = new Set([
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "sendBeacon",
    ]);

    return {
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          node.object.name === "process" &&
          node.property.type === "Identifier" &&
          node.property.name === "env"
        ) {
          context.report({ node, messageId: "env" });
          return;
        }

        if (node.object.type === "Identifier" && node.object.name === "console") {
          context.report({ node, messageId: "console" });
        }
      },

      CallExpression(node) {
        const { callee } = node;

        if (callee.type === "Identifier") {
          if (callee.name === "fetch") context.report({ node, messageId: "network" });
          if (callee.name === "eval") context.report({ node, messageId: "evaluate" });
          return;
        }

        // navigator.sendBeacon(...) and similar
        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          NETWORK_CALLS.has(callee.property.name)
        ) {
          context.report({ node, messageId: "network" });
        }
      },

      NewExpression(node) {
        if (node.callee.type !== "Identifier") return;
        if (NETWORK_CALLS.has(node.callee.name)) context.report({ node, messageId: "network" });
        if (node.callee.name === "Function") context.report({ node, messageId: "evaluate" });
      },

      JSXAttribute(node) {
        if (node.name.type === "JSXIdentifier" && node.name.name === "dangerouslySetInnerHTML") {
          context.report({ node, messageId: "html" });
        }
      },
    };
  },
};
