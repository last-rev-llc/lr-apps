/**
 * ESLint rule: no-hardcoded-colors
 *
 * Warns when hardcoded hex color values appear in JSX className or style attributes.
 * Encourages use of CSS custom property tokens from @repo/theme instead.
 */

// Matches hex colors: #rgb, #rgba, #rrggbb, #rrggbbaa
const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

const MESSAGE =
  "Avoid hardcoded hex colors. Use a CSS custom property token from @repo/theme (e.g. var(--color-*)) or a Tailwind theme class instead.";

/**
 * Extract hex color matches from a string, returning their positions.
 */
function findHexColors(value) {
  const matches = [];
  HEX_COLOR_RE.lastIndex = 0;
  let m;
  while ((m = HEX_COLOR_RE.exec(value)) !== null) {
    matches.push({ match: m[0], index: m.index });
  }
  return matches;
}

/**
 * Check whether a JSX attribute name is one we care about.
 */
function isTargetAttribute(name) {
  return name === "className" || name === "style";
}

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded hex color values in JSX; prefer theme tokens.",
    },
    messages: {
      noHardcodedColor: MESSAGE,
    },
    schema: [],
  },
  create(context) {
    /**
     * Report any hex colors found in the given string literal or template element node.
     */
    function checkStringNode(node, value) {
      const colors = findHexColors(value);
      for (const { match } of colors) {
        context.report({
          node,
          messageId: "noHardcodedColor",
          data: { color: match },
        });
      }
    }

    return {
      // className="bg-[#ff0000]" or style="color: #abc"
      JSXAttribute(node) {
        const attrName =
          node.name && node.name.type === "JSXIdentifier"
            ? node.name.name
            : null;
        if (!attrName || !isTargetAttribute(attrName)) return;

        const value = node.value;
        if (!value) return;

        // className="literal string"
        if (value.type === "Literal" && typeof value.value === "string") {
          checkStringNode(value, value.value);
        }

        // className={expression} or className={`template`}
        if (value.type === "JSXExpressionContainer") {
          visitExpression(value.expression);
        }
      },

      // Also catch style={{ color: "#abc" }} — the object property values
      Property(node) {
        // Only inside JSX style attributes — we check ancestors
        if (
          node.value &&
          node.value.type === "Literal" &&
          typeof node.value.value === "string"
        ) {
          const colors = findHexColors(node.value.value);
          if (colors.length === 0) return;

          // Walk up to see if this is inside a JSXAttribute named "style"
          const ancestors = context.getAncestors
            ? context.getAncestors()
            : context.sourceCode.getAncestors(node);
          const inStyleAttr = ancestors.some(
            (a) =>
              a.type === "JSXAttribute" &&
              a.name &&
              a.name.name === "style",
          );
          if (inStyleAttr) {
            for (const { match } of colors) {
              context.report({
                node: node.value,
                messageId: "noHardcodedColor",
                data: { color: match },
              });
            }
          }
        }
      },
    };

    function visitExpression(expr) {
      if (!expr) return;
      // "string"
      if (expr.type === "Literal" && typeof expr.value === "string") {
        checkStringNode(expr, expr.value);
      }
      // `template ${expr} literal`
      if (expr.type === "TemplateLiteral") {
        for (const quasi of expr.quasis) {
          checkStringNode(quasi, quasi.value.raw);
        }
      }
    }
  },
};

export default rule;
