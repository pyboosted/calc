import clipboardy from "clipboardy";
import { Box, Text, useApp } from "ink";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatResultWithUnit } from "../evaluator/unit-formatter";
import { useRawInput } from "../hooks/use-raw-input";
import { debugLog, isDebugMode, setDebugMode } from "../utils/debug";
import { HotkeyManager } from "../utils/hotkey-manager";
import { keyEventToString } from "../utils/key-event";
import { getVersion } from "../utils/version";
import { CalculatorStateManager } from "./calculator-state";
import { InputWithResult } from "./input-with-result";
import { StatusBar } from "./status-bar";

interface CalculatorProps {
  initialContent?: string;
  debugMode?: boolean;
  markdownMode?: boolean;
  filename?: string;
  isNewFile?: boolean;
  stdinData?: string;
  cliArg?: string;
}

export const Calculator: React.FC<CalculatorProps> = ({
  initialContent,
  debugMode = false,
  markdownMode = false,
  filename,
  isNewFile = false,
  stdinData,
  cliArg,
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
      debugMode,
      markdownMode,
      filename,
      isNewFile,
      stdinData,
      cliArg
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
        filename: null,
        isModified: false,
        isFilenamePrompt: false,
        promptInput: "",
        promptCursorPosition: 0,
        promptSelection: null,
        isRenamingFile: false,
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

  // Create hotkey manager for app-specific commands only
  const hotkeyManager = useMemo(() => {
    const hk = new HotkeyManager();
    const manager = () => stateManagerRef.current;

    // Exit shortcuts (but handle prompt and selection first)
    hk.bind(
      "Escape,\\x1b",
      () => {
        const m = manager();
        // Check if we're in filename prompt mode
        if (m?.getIsFilenamePrompt()) {
          m.cancelFilenamePrompt();
          return true;
        }
        // Check if there's a selection to cancel
        if (m?.handleSelectionEscape()) {
          return true; // Selection was cancelled
        }
        // Otherwise exit the app
        process.exit(0);
      },
      { description: "Cancel prompt/selection or exit calculator" }
    );
    hk.bind(
      "Ctrl+C",
      () => {
        process.exit(0);
      },
      { description: "Exit calculator" }
    );

    // App-specific commands only - text editing is handled by TextEditor

    // App-specific commands
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
    hk.bind(
      "Ctrl+S",
      () => {
        manager()?.saveFile();
        return true;
      },
      { description: "Save file" }
    );
    hk.bind(
      "Ctrl+R",
      () => {
        return manager()?.handleRename() ?? false;
      },
      { description: "Rename file" }
    );

    // Line manipulation (not standard text editing)
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

  // Handle all input through our raw input system
  useRawInput((input, key) => {
    const manager = stateManagerRef.current;
    if (!manager) {
      return;
    }

    // Log keypress in debug mode
    if (isDebugMode()) {
      debugLog("KEYEVENT", `Key: ${keyEventToString(key)}`, {
        key: key.key,
        input: input || "(empty)",
        sequence: key.sequence,
        sequenceHex: key.sequence
          .split("")
          .map((c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
        ctrl: key.ctrl,
        alt: key.alt,
        shift: key.shift,
        meta: key.meta,
      });
    }

    // Try app-specific hotkeys first
    if (hotkeyManager.handle(key, input)) {
      return;
    }

    // Then let the TextEditor handle standard text editing
    manager.handleKeyInput(key, input);
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
              inactiveCursor={state.isFilenamePrompt}
              isActive={index === state.currentLineIndex}
              isComment={line.isComment}
              key={line.id || `line-${index}`}
              lineIndex={index}
              result={line.result}
              selection={state.selection}
              value={line.content}
            />
          );
        })}
      </Box>

      <Box marginTop={1}>
        <StatusBar
          filename={state.filename}
          isFilenamePrompt={state.isFilenamePrompt}
          isModified={state.isModified}
          isNewFile={isNewFile}
          isRenamingFile={state.isRenamingFile}
          promptCursorPosition={state.promptCursorPosition}
          promptInput={state.promptInput}
          promptSelection={state.promptSelection}
        />
      </Box>
    </Box>
  );
};
