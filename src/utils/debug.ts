import chalk from "chalk";
import type { ASTNode, CalculatedValue, Token } from "../types";

// Global debug state
let debugMode = false;

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

export function debugKeypress(key: {
  name?: string;
  sequence?: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
  code?: string;
  raw?: string;
}) {
  if (!debugMode) {
    return;
  }

  const keyInfo = {
    name: key.name,
    sequence: key.sequence,
    ctrl: key.ctrl,
    meta: key.meta,
    alt: key.alt,
    shift: key.shift,
    code: key.code,
    raw: key.raw,
  };

  debugLog("KEYPRESS", `Key pressed: ${key.name || key.sequence}`, keyInfo);
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
