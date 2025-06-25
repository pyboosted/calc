import { debugLog, isDebugMode } from "./debug";
import type { HotkeyPatterns } from "./hotkey-types";
import { normalizeKey, normalizeModifier } from "./hotkey-types";
import type { KeyEvent } from "./key-event";

interface HotkeyBinding {
  patterns: string[];
  handler: (key: KeyEvent, input: string) => boolean | undefined;
  stopPropagation?: boolean;
  description?: string;
}

export class HotkeyManager {
  private bindings: HotkeyBinding[] = [];

  /**
   * Bind one or more key patterns to a handler
   * @param pattern - Single pattern or comma-separated patterns (e.g., "Ctrl+A", "Alt+Left,Meta+Left")
   * @param handler - Function to call when pattern matches
   * @param options - Additional options like stopPropagation
   */
  bind(
    pattern: HotkeyPatterns,
    handler: (key: KeyEvent, input: string) => boolean | undefined,
    options?: { stopPropagation?: boolean; description?: string }
  ): void {
    const patterns = pattern
      .split(",")
      .map((p: string) => this.normalizePattern(p.trim()));
    this.bindings.push({
      patterns,
      handler,
      stopPropagation: options?.stopPropagation ?? true,
      description: options?.description,
    });
  }

  /**
   * Normalize a pattern to lowercase with normalized modifiers
   */
  private normalizePattern(pattern: string): string {
    // Handle escape sequences - don't normalize these
    if (pattern.startsWith("\\x") || pattern.startsWith("Esc ")) {
      return pattern;
    }

    const parts = pattern.split("+");
    const modifiers: string[] = [];
    let key = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]?.trim();
      if (!part) {
        continue;
      }

      // Last part is the key
      if (i === parts.length - 1) {
        key = normalizeKey(part);
      } else {
        // It's a modifier
        modifiers.push(normalizeModifier(part));
      }
    }

    // Sort modifiers to ensure consistent ordering
    modifiers.sort();

    return [...modifiers, key].join("+");
  }

  /**
   * Process a key event against all bindings
   * @returns true if a handler was called and stopPropagation was true
   */
  handle(key: KeyEvent, input: string): boolean {
    for (const binding of this.bindings) {
      for (const pattern of binding.patterns) {
        if (this.matchesPattern(pattern, key, input)) {
          if (isDebugMode()) {
            debugLog(
              "HOTKEY",
              `Matched pattern: ${pattern}${
                binding.description ? ` (${binding.description})` : ""
              }`
            );
          }

          const result = binding.handler(key, input);

          // If handler returns explicit false, continue to next binding
          if (result === false) {
            continue;
          }

          // If stopPropagation is true (default), stop processing
          if (binding.stopPropagation) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if a key event matches a pattern
   */
  private matchesPattern(
    pattern: string,
    key: KeyEvent,
    input: string
  ): boolean {
    // Handle escape sequences
    if (pattern.startsWith("\\\\x")) {
      // Convert \\x1b to actual escape character
      const actualSequence = pattern.replace(
        /\\\\x([0-9a-fA-F]{2})/g,
        (_, hex) => String.fromCharCode(Number.parseInt(hex, 16))
      );
      return key.sequence === actualSequence;
    }

    // Handle "Esc X" patterns (ESC followed by another key)
    if (pattern.startsWith("Esc ")) {
      const char = pattern.slice(4);
      return key.key === "escape" && input === char;
    }

    // Build the actual pattern from the key event
    const modifiers: string[] = [];
    if (key.ctrl) {
      modifiers.push("ctrl");
    }
    if (key.alt) {
      modifiers.push("alt");
    }
    if (key.shift) {
      modifiers.push("shift");
    }
    if (key.meta && !key.alt) {
      modifiers.push("meta"); // Don't double-count alt/meta
    }

    // Sort modifiers to ensure consistent ordering
    modifiers.sort();

    const keyParts = [...modifiers, normalizeKey(key.key)];
    const actualPattern = keyParts.join("+");

    // Compare normalized patterns
    return pattern === actualPattern;
  }

  /**
   * Get all registered bindings (for debugging)
   */
  getBindings(): readonly HotkeyBinding[] {
    return this.bindings;
  }

  /**
   * Clear all bindings
   */
  clear(): void {
    this.bindings = [];
  }
}

// Singleton instance
let instance: HotkeyManager | null = null;

export function getHotkeyManager(): HotkeyManager {
  if (!instance) {
    instance = new HotkeyManager();
  }
  return instance;
}
