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

    // Exit shortcuts
    hk.bind(
      "Escape",
      () => {
        process.exit(0);
        return true;
      },
      { description: "Exit calculator" }
    );
    hk.bind(
      "Ctrl+C",
      (key, input) => {
        if (key.ctrl && input === "c") {
          process.exit(0);
          return true;
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

    // Word navigation - bind these BEFORE plain arrow keys
    hk.bind(
      "Alt+Left,Meta+Left,Option+Left,\\\\x1bb,Esc b,Meta+B",
      () => {
        manager()?.handleMoveWordLeft();
        return true;
      },
      { description: "Move word left" }
    );
    hk.bind(
      "Alt+Right,Meta+Right,Option+Right,\\\\x1bf,Esc f,Meta+F",
      () => {
        manager()?.handleMoveWordRight();
        return true;
      },
      { description: "Move word right" }
    );

    // Line start/end - also before plain arrow keys
    hk.bind(
      "Ctrl+Left,Home,\\\\x1b[H,\\\\x1b[1~,Ctrl+A",
      () => {
        manager()?.handleMoveToLineStart();
        return true;
      },
      { description: "Move to line start" }
    );
    hk.bind(
      "Ctrl+Right,End,\\\\x1b[F,\\\\x1b[4~,Ctrl+E",
      () => {
        manager()?.handleMoveToLineEnd();
        return true;
      },
      { description: "Move to line end" }
    );

    // Plain arrow keys - bind these AFTER modified versions
    hk.bind(
      "Up",
      () => {
        manager()?.handleArrowUp();
        return true;
      },
      { description: "Navigate up" }
    );
    hk.bind(
      "Down",
      () => {
        manager()?.handleArrowDown();
        return true;
      },
      { description: "Navigate down" }
    );
    hk.bind(
      "Left",
      () => {
        manager()?.handleArrowLeft();
        return true;
      },
      { description: "Move cursor left" }
    );
    hk.bind(
      "Right",
      () => {
        manager()?.handleArrowRight();
        return true;
      },
      { description: "Move cursor right" }
    );

    // Deletion - bind modified keys BEFORE plain keys
    hk.bind(
      "Alt+Backspace,Meta+Backspace,Option+Backspace,\\\\x17,\\\\x1b\\\\x7f,\\\\x1b\\\\x08,Ctrl+W",
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

    // Regular character input (if not handled by hotkeys)
    if (input && !key.ctrl && !key.meta) {
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
      </Box>

      <Box flexDirection="column">
        {state.lines.map((line, index) => {
          return (
            <InputWithResult
              copyHighlight={
                index === state.currentLineIndex ? state.copyHighlight : null
              }
              cursorPosition={
                index === state.currentLineIndex
                  ? state.cursorPosition
                  : undefined
              }
              error={line.error}
              isActive={index === state.currentLineIndex}
              isComment={line.isComment}
              key={line.id}
              result={line.result}
              value={line.content}
            />
          );
        })}
      </Box>
    </Box>
  );
};
