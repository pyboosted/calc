import type { Key } from "ink";
import { debugLog, isDebugMode } from "./debug";

interface HotkeyBinding {
  patterns: string[];
  handler: (key: Key, input: string) => boolean | undefined;
  stopPropagation?: boolean;
  description?: string;
}

interface ParsedPattern {
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    meta?: boolean;
    shift?: boolean;
    option?: boolean;
  };
  key?: string;
  sequence?: string;
  specialKey?: string;
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
    pattern: string,
    handler: (key: Key, input: string) => boolean | undefined,
    options?: { stopPropagation?: boolean; description?: string }
  ): void {
    const patterns = pattern.split(",").map((p) => p.trim());
    this.bindings.push({
      patterns,
      handler,
      stopPropagation: options?.stopPropagation ?? true,
      description: options?.description,
    });
  }

  /**
   * Process a key event against all bindings
   * @returns true if a handler was called and stopPropagation was true
   */
  handle(key: Key, input: string): boolean {
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
  private matchesPattern(pattern: string, key: Key, input: string): boolean {
    // Handle escape sequences
    if (pattern.startsWith("\\x")) {
      // Convert \\x1b to actual escape character
      const actualSequence = pattern.replace(
        /\\\\x([0-9a-fA-F]{2})/g,
        (_, hex) => String.fromCharCode(Number.parseInt(hex, 16))
      );
      return input === actualSequence;
    }

    // Handle "Esc X" patterns (ESC followed by another key)
    if (pattern.startsWith("Esc ")) {
      const char = pattern.slice(4);
      return key.escape && input === char;
    }

    // Parse the pattern
    const parsed = this.parsePattern(pattern);

    // Check modifiers
    if (parsed.modifiers.ctrl && !key.ctrl) {
      return false;
    }
    if ((parsed.modifiers.alt || parsed.modifiers.option) && !key.meta) {
      return false; // Alt/Option maps to meta in terminals
    }
    if (parsed.modifiers.meta && !key.meta) {
      return false;
    }
    if (parsed.modifiers.shift && !key.shift) {
      return false;
    }

    // Check special keys
    if (parsed.specialKey) {
      switch (parsed.specialKey.toLowerCase()) {
        case "enter":
        case "return":
          return key.return === true;
        case "escape":
        case "esc":
          return key.escape === true;
        case "backspace":
          return key.backspace === true;
        case "delete":
        case "del":
          return key.delete === true;
        case "tab":
          return key.tab === true;
        case "up":
        case "uparrow":
          return key.upArrow === true;
        case "down":
        case "downarrow":
          return key.downArrow === true;
        case "left":
        case "leftarrow":
          return key.leftArrow === true;
        case "right":
        case "rightarrow":
          return key.rightArrow === true;
        case "pageup":
          return key.pageUp === true;
        case "pagedown":
          return key.pageDown === true;
        case "home":
          return input === "\x1b[H" || input === "\x1b[1~";
        case "end":
          return input === "\x1b[F" || input === "\x1b[4~";
        default:
          return false;
      }
    }

    // Check regular key
    if (parsed.key) {
      // For modified keys, check the input matches
      if (parsed.modifiers.ctrl || parsed.modifiers.meta) {
        return input === parsed.key.toLowerCase();
      }
      // For unmodified keys, exact match
      return input === parsed.key;
    }

    return false;
  }

  /**
   * Parse a key pattern string into components
   */
  private parsePattern(pattern: string): ParsedPattern {
    const parts = pattern.split("+");
    const result: ParsedPattern = {
      modifiers: {},
    };

    for (let i = 0; i < parts.length; i++) {
      const partRaw = parts[i];
      if (!partRaw) {
        continue;
      }

      const part = partRaw.trim().toLowerCase();

      // Last part is the key
      if (i === parts.length - 1) {
        // Check if it's a special key
        const specialKeys = [
          "enter",
          "return",
          "escape",
          "esc",
          "backspace",
          "delete",
          "del",
          "tab",
          "up",
          "down",
          "left",
          "right",
          "pageup",
          "pagedown",
          "home",
          "end",
          "uparrow",
          "downarrow",
          "leftarrow",
          "rightarrow",
        ];

        if (specialKeys.includes(part)) {
          result.specialKey = part;
        } else {
          result.key = partRaw.trim(); // Keep original case for regular keys
        }
      } else {
        // It's a modifier
        switch (part) {
          case "ctrl":
          case "control":
            result.modifiers.ctrl = true;
            break;
          case "alt":
            result.modifiers.alt = true;
            break;
          case "meta":
          case "cmd":
          case "command":
            result.modifiers.meta = true;
            break;
          case "shift":
            result.modifiers.shift = true;
            break;
          case "option":
          case "opt":
            result.modifiers.option = true;
            break;
          default:
            // Unknown modifier, ignore
            break;
        }
      }
    }

    return result;
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
