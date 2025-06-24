import chalk from "chalk";
import type { ASTNode, CalculatedValue, Token } from "../types";

// Global debug state
let debugMode = false;

// Regex for printable characters
const PRINTABLE_CHARS_REGEX = /^[\x20-\x7E]+$/;

export function setDebugMode(enabled: boolean) {
  debugMode = enabled;
}

export function isDebugMode(): boolean {
  return debugMode;
}

export function debugLog(category: string, message: string, data?: unknown) {
  if (!debugMode) {
    return;
  }

  const timestamp =
    new Date().toISOString().split("T")[1]?.slice(0, -1) ||
    new Date().toISOString();
  const prefix = chalk.gray(`[${timestamp}]`) + chalk.cyan(` [${category}]`);

  console.error(prefix, message);
  if (data !== undefined) {
    console.error(prefix, JSON.stringify(data, null, 2));
  }
}

export function debugKeypress(
  input: string,
  key: {
    sequence?: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    upArrow?: boolean;
    downArrow?: boolean;
    leftArrow?: boolean;
    rightArrow?: boolean;
    pageUp?: boolean;
    pageDown?: boolean;
    return?: boolean;
    escape?: boolean;
    backspace?: boolean;
    delete?: boolean;
    tab?: boolean;
  }
) {
  if (!debugMode) {
    return;
  }

  const keyInfo = {
    input: input || "(empty)",
    sequence: key.sequence,
    // Add hex representation for non-printable sequences
    sequenceHex:
      key.sequence && !key.sequence.match(PRINTABLE_CHARS_REGEX)
        ? key.sequence
            .split("")
            .map((c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
            .join("")
        : undefined,
    // Modifiers
    ctrl: key.ctrl,
    meta: key.meta,
    shift: key.shift,
    // Special keys
    upArrow: key.upArrow,
    downArrow: key.downArrow,
    leftArrow: key.leftArrow,
    rightArrow: key.rightArrow,
    pageUp: key.pageUp,
    pageDown: key.pageDown,
    return: key.return,
    escape: key.escape,
    backspace: key.backspace,
    delete: key.delete,
    tab: key.tab,
    // Add all other properties that might exist
    ...Object.entries(key).reduce(
      (acc, [k, v]) => {
        if (
          ![
            "sequence",
            "ctrl",
            "meta",
            "shift",
            "upArrow",
            "downArrow",
            "leftArrow",
            "rightArrow",
            "pageUp",
            "pageDown",
            "return",
            "escape",
            "backspace",
            "delete",
            "tab",
          ].includes(k)
        ) {
          acc[k] = v;
        }
        return acc;
      },
      {} as Record<string, unknown>
    ),
  };

  // Filter out undefined values for cleaner output
  const cleanKeyInfo = Object.entries(keyInfo).reduce(
    (acc, [k, v]) => {
      if (v !== undefined && v !== false && v !== null && v !== "") {
        acc[k] = v;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );

  const keyDisplay = key.sequence || input || "(unknown)";
  debugLog("KEYPRESS", `Key pressed: ${keyDisplay}`, cleanKeyInfo);
}

export function debugToken(token: Token) {
  if (!debugMode) {
    return;
  }
  debugLog("TOKEN", `${token.type}: ${token.value}`, {
    position: token.position,
  });
}

export function debugAST(node: ASTNode, depth = 0) {
  if (!debugMode) {
    return;
  }
  const indent = "  ".repeat(depth);
  debugLog("AST", `${indent}${node.type}`, node);
}

export function debugEvaluation(
  expression: string,
  result: CalculatedValue | null,
  error?: Error
) {
  if (!debugMode) {
    return;
  }

  if (error) {
    debugLog("EVAL", `Error evaluating: ${expression}`, {
      error: error.message,
      stack: error.stack,
    });
  } else {
    debugLog("EVAL", `Success: ${expression} = ${result?.value}`, {
      value: result?.value,
      unit: result?.unit,
    });
  }
}

export function debugState(stateName: string, value: unknown) {
  if (!debugMode) {
    return;
  }
  debugLog("STATE", `${stateName} updated`, value);
}
