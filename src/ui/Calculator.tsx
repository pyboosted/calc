import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  const openInEditor = () => {
    const editor = process.env.EDITOR || "nano";
    const tempFile = join(tmpdir(), `calc-${Date.now()}.txt`);
    const manager = stateManagerRef.current;
    if (!manager) {
      return;
    }

    // Write current content to temp file
    writeFileSync(tempFile, manager.getContent());

    try {
      // Open editor and wait for it to close
      execSync(`${editor} ${tempFile}`, { stdio: "inherit" });

      // Read the edited content
      const editedContent = readFileSync(tempFile, "utf-8");

      // Update the state manager
      manager.setContent(editedContent);
    } catch (error) {
      // If editor fails, just return without changes
      console.error("Failed to open editor:", error);
    }
  };

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

  const handleCopyFull = () => {
    const manager = stateManagerRef.current;
    if (!manager) {
      return;
    }
    const currentLine = manager.getCurrentLine();
    if (currentLine?.result && !currentLine.error) {
      const resultToCopy = formatResultWithUnit(currentLine.result);
      const fullLine = `${currentLine.content} = ${resultToCopy}`;
      clipboardy.writeSync(fullLine);
      manager.setCopyHighlight("full");
    }
  };

  const handleNavigation = (key: Key) => {
    const manager = stateManagerRef.current;
    if (!manager) {
      return false;
    }

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
    if (key.backspace || key.delete) {
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
      if (input === "e") {
        openInEditor();
        return;
      }
      if (input === "y" && !key.shift) {
        handleCopyResult();
        return;
      }
      if (input === "u" || (input === "y" && key.shift)) {
        handleCopyFull();
        return;
      }
    }

    // Navigation and editing
    if (!handleNavigation(key) && input && !key.ctrl && !key.meta) {
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
