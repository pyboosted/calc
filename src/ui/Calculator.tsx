import clipboardy from "clipboardy";
import { Box, Text, useApp, useInput } from "ink";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatResultWithUnit } from "../evaluator/unit-formatter";
import { debugKeypress, setDebugMode } from "../utils/debug";
import { HotkeyManager } from "../utils/hotkey-manager";
import { getVersion } from "../utils/version";
import { CalculatorStateManager } from "./calculator-state";
import { InputWithResult } from "./input-with-result";

interface CalculatorProps {
  initialContent?: string;
  debugMode?: boolean;
}

export const Calculator: React.FC<CalculatorProps> = ({
  initialContent,
  debugMode = false,
}) => {
  useApp(); // Keep app context available

  // Initialize debug mode
  useEffect(() => {
    setDebugMode(debugMode);
  }, [debugMode]);

  // Create state manager outside of React
  const stateManagerRef = useRef<CalculatorStateManager | null>(null);
  if (!stateManagerRef.current) {
    stateManagerRef.current = new CalculatorStateManager(
      initialContent,
      debugMode
    );
  }

  const [state, setState] = useState(() => {
    return (
      stateManagerRef.current?.getState() || {
        lines: [],
        currentLineIndex: 0,
        cursorPosition: 0,
        copyHighlight: null,
        selection: null,
      }
    );
  });

  // Listen for state changes
  useEffect(() => {
    const manager = stateManagerRef.current;
    if (!manager) {
      return;
    }

    const handleStateChange = () => {
      setState(manager.getState());
    };

    manager.on("stateChanged", handleStateChange);
    return () => {
      manager.removeListener("stateChanged", handleStateChange);
    };
  }, []);

  const handleCopyResult = useCallback(() => {
    const manager = stateManagerRef.current;
    if (!manager) {
      return;
    }
    const currentLine = manager.getCurrentLine();
    if (currentLine?.result && !currentLine.error) {
      const resultToCopy = formatResultWithUnit(currentLine.result);
      clipboardy.writeSync(resultToCopy);
      manager.setCopyHighlight("result");
    }
  }, []);

  // Create hotkey manager with all keyboard shortcuts
  const hotkeyManager = useMemo(() => {
    const hk = new HotkeyManager();
    const manager = () => stateManagerRef.current;

    // Exit shortcuts (but handle selection first)
    hk.bind(
      "Escape",
      () => {
        const m = manager();
        if (m?.handleSelectionEscape()) {
          return true; // Selection was cancelled
        }
        process.exit(0);
      },
      { description: "Cancel selection or exit calculator" }
    );
    hk.bind(
      "Ctrl+C",
      (key, input) => {
        if (key.ctrl && input === "c") {
          process.exit(0);
        }
        return false;
      },
      { description: "Exit calculator" }
    );

    // Navigation
    hk.bind(
      "Enter",
      () => {
        manager()?.handleNewLine();
        return true;
      },
      { description: "New line" }
    );

    // Selection-aware word navigation with Shift - BIND FIRST
    hk.bind(
      "Shift+Alt+Left,Shift+Meta+Left,Shift+Option+Left",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleMoveWordLeft(), true, "word-left");
        return true;
      },
      { description: "Extend selection word left" }
    );
    hk.bind(
      "Shift+Alt+Right,Shift+Meta+Right,Shift+Option+Right",
      () => {
        const m = manager();
        m?.handleNavigationKey(
          () => m.handleMoveWordRight(),
          true,
          "word-right"
        );
        return true;
      },
      { description: "Extend selection word right" }
    );

    // Selection-aware line start/end with Shift - BIND FIRST
    hk.bind(
      "Shift+Ctrl+Left,Shift+Home,Shift+Ctrl+A",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleMoveToLineStart(), true);
        return true;
      },
      { description: "Extend selection to line start" }
    );
    hk.bind(
      "Shift+Ctrl+Right,Shift+End,Shift+Ctrl+E",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleMoveToLineEnd(), true);
        return true;
      },
      { description: "Extend selection to line end" }
    );

    // Word navigation - bind these AFTER Shift versions
    hk.bind(
      "Alt+Left,Meta+Left,Option+Left,\\\\x1bb,Esc b,Meta+B",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleMoveWordLeft(), false);
        return true;
      },
      { description: "Move word left" }
    );
    hk.bind(
      "Alt+Right,Meta+Right,Option+Right,\\\\x1bf,Esc f,Meta+F",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleMoveWordRight(), false);
        return true;
      },
      { description: "Move word right" }
    );

    // Line start/end - bind after Shift versions
    hk.bind(
      "Ctrl+Left,Home,\\\\x1b[H,\\\\x1b[1~,Ctrl+A",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleMoveToLineStart(), false);
        return true;
      },
      { description: "Move to line start" }
    );
    hk.bind(
      "Ctrl+Right,End,\\\\x1b[F,\\\\x1b[4~,Ctrl+E",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleMoveToLineEnd(), false);
        return true;
      },
      { description: "Move to line end" }
    );

    hk.bind(
      "Alt+Shift+Up,Meta+Shift+Up,Option+Shift+Up",
      () => {
        const m = manager();
        // Disable in selection mode
        if (m?.hasSelection()) {
          return false;
        }
        m?.handleCopyLineUp();
        return true;
      },
      { description: "Copy line up" }
    );
    hk.bind(
      "Alt+Shift+Down,Meta+Shift+Down,Option+Shift+Down",
      () => {
        const m = manager();
        // Disable in selection mode
        if (m?.hasSelection()) {
          return false;
        }
        m?.handleCopyLineDown();
        return true;
      },
      { description: "Copy line down" }
    );

    // Line manipulation
    hk.bind(
      "Alt+Up,Meta+Up,Option+Up",
      () => {
        const m = manager();
        // Disable in selection mode
        if (m?.hasSelection()) {
          return false;
        }
        m?.handleSwapLineUp();
        return true;
      },
      { description: "Swap line up" }
    );
    hk.bind(
      "Alt+Down,Meta+Down,Option+Down",
      () => {
        const m = manager();
        // Disable in selection mode
        if (m?.hasSelection()) {
          return false;
        }
        m?.handleSwapLineDown();
        return true;
      },
      { description: "Swap line down" }
    );

    // Selection extensions with Shift+navigation keys
    hk.bind(
      "Shift+Left",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleArrowLeft(), true, "left");
        return true;
      },
      { description: "Extend selection left" }
    );
    hk.bind(
      "Shift+Right",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleArrowRight(), true, "right");
        return true;
      },
      { description: "Extend selection right" }
    );
    hk.bind(
      "Shift+Up",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleArrowUp(), true);
        return true;
      },
      { description: "Extend selection up" }
    );
    hk.bind(
      "Shift+Down",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleArrowDown(), true);
        return true;
      },
      { description: "Extend selection down" }
    );

    // Plain arrow keys - bind these AFTER modified versions
    hk.bind(
      "Up",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleArrowUp(), false);
        return true;
      },
      { description: "Navigate up" }
    );
    hk.bind(
      "Down",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleArrowDown(), false);
        return true;
      },
      { description: "Navigate down" }
    );
    hk.bind(
      "Left",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleArrowLeft(), false, "left");
        return true;
      },
      { description: "Move cursor left" }
    );
    hk.bind(
      "Right",
      () => {
        const m = manager();
        m?.handleNavigationKey(() => m.handleArrowRight(), false, "right");
        return true;
      },
      { description: "Move cursor right" }
    );

    // Deletion - bind modified keys BEFORE plain keys
    hk.bind(
      "Alt+Backspace,Meta+Backspace,Option+Backspace,Alt+Delete,Meta+Delete,Option+Delete,\\\\x17,\\\\x1b\\\\x7f,\\\\x1b\\\\x08,Ctrl+W",
      () => {
        manager()?.handleDeleteWord();
        return true;
      },
      { description: "Delete word" }
    );

    hk.bind(
      "Backspace,Delete",
      () => {
        const m = manager();
        if (m) {
          m.handleBackspace();
          return true;
        }
        return false;
      },
      { description: "Delete character backward" }
    );
    hk.bind(
      "Ctrl+K",
      () => {
        manager()?.handleDeleteToLineEnd();
        return true;
      },
      { description: "Delete to line end" }
    );
    hk.bind(
      "Ctrl+U",
      () => {
        manager()?.handleDeleteToLineStart();
        return true;
      },
      { description: "Delete to line start" }
    );

    // Commands
    hk.bind(
      "Ctrl+L",
      () => {
        manager()?.clearAll();
        return true;
      },
      { description: "Clear all" }
    );
    hk.bind(
      "Ctrl+Y",
      () => {
        handleCopyResult();
        return true;
      },
      { description: "Copy result" }
    );

    // Selection mode keybinds (only work when selection is active)
    hk.bind(
      "c,C,y,Y",
      () => {
        return manager()?.handleSelectionCopy();
      },
      { description: "Copy selection to clipboard" }
    );
    hk.bind(
      "p,P",
      () => {
        return manager()?.handleSelectionPaste();
      },
      { description: "Paste clipboard content replacing selection" }
    );
    hk.bind(
      "d,D",
      () => {
        return manager()?.handleSelectionDelete();
      },
      { description: "Delete selection" }
    );
    hk.bind(
      "x,X",
      () => {
        return manager()?.handleSelectionCut();
      },
      { description: "Cut selection to clipboard" }
    );
    hk.bind(
      "e,E",
      () => {
        return manager()?.handleSelectionExpand();
      },
      { description: "Expand selection to full lines" }
    );

    return hk;
  }, [handleCopyResult]);

  // Handle all input through the state manager
  useInput((input, key) => {
    const manager = stateManagerRef.current;
    if (!manager) {
      return;
    }

    // Log keypress in debug mode
    if (debugMode) {
      debugKeypress(input, key);
    }

    // Let hotkey manager handle it first
    if (hotkeyManager.handle(key, input)) {
      return;
    }

    // Regular character input (if not handled by hotkeys and not in selection mode)
    if (input && !key.ctrl && !key.meta) {
      // Don't allow regular character input in selection mode
      if (manager.hasSelection()) {
        return; // Selection mode - only special keybinds work
      }
      manager.handleCharacterInput(input);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Boosted Calculator
        </Text>
        <Text color="gray"> v{getVersion()}</Text>
        {debugMode && <Text color="yellow"> [DEBUG]</Text>}
      </Box>

      {debugMode && (
        <Box marginBottom={1}>
          <Text color="gray">
            {state.selection ? (
              <>
                Selection: ({state.selection.from.line}:
                {state.selection.from.char}) to ({state.selection.to.line}:
                {state.selection.to.char}) |
              </>
            ) : (
              ""
            )}
            Cursor: Line {state.currentLineIndex}, Char {state.cursorPosition}
          </Text>
        </Box>
      )}

      <Box flexDirection="column">
        {state.lines.map((line, index) => {
          return (
            <InputWithResult
              copyHighlight={(() => {
                if (index === state.currentLineIndex) {
                  return state.copyHighlight;
                }
                if (state.copyHighlight === "selection") {
                  return state.copyHighlight;
                }
                return null;
              })()}
              cursorPosition={
                index === state.currentLineIndex
                  ? state.cursorPosition
                  : undefined
              }
              error={line.error}
              isActive={index === state.currentLineIndex}
              isComment={line.isComment}
              // biome-ignore lint/suspicious/noArrayIndexKey: Order of lines is stable in our calculator
              key={`line-${index}`}
              lineIndex={index}
              result={line.result}
              selection={state.selection}
              value={line.content}
            />
          );
        })}
      </Box>
    </Box>
  );
};
