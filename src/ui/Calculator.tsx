import clipboardy from "clipboardy";
import { Box, type Key, Text, useApp, useInput } from "ink";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { formatResultWithUnit } from "../evaluator/unit-formatter";
import { getVersion } from "../utils/version";
import { CalculatorStateManager } from "./calculator-state";
import { InputWithResult } from "./input-with-result";

interface CalculatorProps {
  initialContent?: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ initialContent }) => {
  useApp(); // Keep app context available

  // Create state manager outside of React
  const stateManagerRef = useRef<CalculatorStateManager | null>(null);
  if (!stateManagerRef.current) {
    stateManagerRef.current = new CalculatorStateManager(initialContent);
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

  const handleCopyResult = () => {
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
  };

  const handleSpecialKeys = (
    key: Key,
    input: string,
    manager: CalculatorStateManager
  ) => {
    // Handle special terminal sequences for word navigation
    // Option+Left: can be meta+b, ESC+b or specific sequences
    if (
      input === "\x1bb" ||
      (key.escape && input === "b") ||
      (key.meta && input === "b")
    ) {
      manager.handleMoveWordLeft();
      return true;
    }
    // Option+Right: can be meta+f, ESC+f or specific sequences
    if (
      input === "\x1bf" ||
      (key.escape && input === "f") ||
      (key.meta && input === "f")
    ) {
      manager.handleMoveWordRight();
      return true;
    }

    // Option+Backspace sequences (for word deletion)
    if (input === "\x17" || input === "\x1b\x7f" || input === "\x1b\x08") {
      manager.handleDeleteWord();
      return true;
    }

    // Check for Cmd+Arrow keys (if your terminal sends meta for Cmd)
    if (key.meta && key.leftArrow) {
      manager.handleMoveToLineStart();
      return true;
    }
    if (key.meta && key.rightArrow) {
      manager.handleMoveToLineEnd();
      return true;
    }

    // Meta+Backspace - check if it's Cmd+Backspace (delete to line start) or Option+Backspace (delete word)
    if (key.meta && (key.backspace || key.delete)) {
      // In most terminals, Cmd+Backspace would delete to line start
      // but Option+Backspace would delete word.
      // Since we can't distinguish, let's use delete word as it's more common
      manager.handleDeleteWord();
      return true;
    }

    return false;
  };

  const handleCtrlKeys = (input: string, manager: CalculatorStateManager) => {
    switch (input) {
      case "a": // Beginning of line
        manager.handleMoveToLineStart();
        return true;
      case "e": // End of line
        manager.handleMoveToLineEnd();
        return true;
      case "w": // Delete word backwards (also sent by Option+Backspace on some terminals)
        manager.handleDeleteWord();
        return true;
      case "k": // Delete to end of line
        manager.handleDeleteToLineEnd();
        return true;
      case "u": // Delete to beginning of line (also sent by Cmd+Backspace on some terminals)
        manager.handleDeleteToLineStart();
        return true;
      default:
        return false;
    }
  };

  const handleNavigation = (key: Key, input: string) => {
    const manager = stateManagerRef.current;
    if (!manager) {
      return false;
    }

    // Basic navigation
    if (key.return) {
      manager.handleNewLine();
      return true;
    }
    if (key.upArrow) {
      manager.handleArrowUp();
      return true;
    }
    if (key.downArrow) {
      manager.handleArrowDown();
      return true;
    }
    if (key.leftArrow) {
      manager.handleArrowLeft();
      return true;
    }
    if (key.rightArrow) {
      manager.handleArrowRight();
      return true;
    }

    // Ctrl key combinations
    if (key.ctrl && !key.meta) {
      return handleCtrlKeys(input, manager);
    }

    // Special sequences (Option keys, etc)
    if (handleSpecialKeys(key, input, manager)) {
      return true;
    }

    // Regular backspace (not with modifiers)
    if (
      (key.backspace || key.delete) &&
      !key.meta &&
      input !== "\x17" &&
      input !== "\x1b\x7f" &&
      input !== "\x1b\x08"
    ) {
      manager.handleBackspace();
      return true;
    }

    return false;
  };

  // Handle all input through the state manager
  useInput((input, key) => {
    const manager = stateManagerRef.current;
    if (!manager) {
      return;
    }

    // Exit handling
    if (key.escape || (key.ctrl && input === "c")) {
      process.exit(0);
    }

    // Ctrl commands
    if (key.ctrl) {
      if (input === "l") {
        manager.clearAll();
        return;
      }
      if (input === "y" && !key.shift) {
        handleCopyResult();
        return;
      }
    }

    // Navigation and editing
    if (!handleNavigation(key, input) && input && !key.ctrl && !key.meta) {
      // Regular character input
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
