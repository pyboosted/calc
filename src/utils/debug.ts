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
    raw?: string;
    name?: string;
    code?: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    option?: boolean;
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

  // Helper to convert string to hex representation
  const toHex = (str: string) => {
    return str
      .split("")
      .map((c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("");
  };

  const keyInfo = {
    input: input || "(empty)",
    inputHex: input ? toHex(input) : undefined,
    inputLength: input ? input.length : 0,
    sequence: key.sequence,
    // Add hex representation for sequences
    sequenceHex: key.sequence ? toHex(key.sequence) : undefined,
    sequenceLength: key.sequence ? key.sequence.length : 0,
    raw: key.raw,
    rawHex: key.raw ? toHex(key.raw) : undefined,
    name: key.name,
    code: key.code,
    // Modifiers
    ctrl: key.ctrl,
    meta: key.meta,
    shift: key.shift,
    option: key.option,
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
            "raw",
            "name",
            "code",
            "ctrl",
            "meta",
            "shift",
            "option",
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
      if (v !== undefined && v !== false && v !== null && v !== "" && v !== 0) {
        acc[k] = v;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );

  // Create a more informative key display
  let keyDisplay = "(unknown)";
  if (input) {
    keyDisplay = input;
    if (input.length > 1 || !input.match(PRINTABLE_CHARS_REGEX)) {
      keyDisplay += ` (${toHex(input)})`;
    }
  } else if (key.sequence) {
    keyDisplay = key.sequence;
    if (key.sequence.length > 1 || !key.sequence.match(PRINTABLE_CHARS_REGEX)) {
      keyDisplay += ` (${toHex(key.sequence)})`;
    }
  }

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
  } else if (result) {
    const details: Record<string, unknown> = {
      type: result.type,
      value: result.value,
    };

    if (result.type === "date" && result.timezone) {
      details.timezone = result.timezone;
    }

    debugLog("EVAL", `Success: ${expression} = ${result.value}`, details);
  }
}

export function debugState(stateName: string, value: unknown) {
  if (!debugMode) {
    return;
  }
  debugLog("STATE", `${stateName} updated`, value);
}
