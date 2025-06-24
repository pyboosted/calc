import clipboardy from "clipboardy";
import { Box, Text, useInput } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import { formatResultWithUnit } from "../evaluator/unit-formatter";
import type { CalculatedValue } from "../types";
import { InputLine } from "./input-line";

interface InputWithResultProps {
  value: string;
  cursorPosition?: number;
  result: CalculatedValue | null;
  error: string | null;
  isComment?: boolean;
  onChange?: (value: string, cursorPosition: number) => void;
  onNewLine?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onBackspaceOnEmptyLine?: () => void;
  isActive: boolean;
}

export const InputWithResult: React.FC<InputWithResultProps> = ({
  value,
  cursorPosition,
  result,
  error,
  isComment,
  onChange,
  onNewLine,
  onArrowUp,
  onArrowDown,
  onBackspaceOnEmptyLine,
  isActive,
}) => {
  const [copyHighlight, setCopyHighlight] = useState<"result" | "full" | null>(
    null
  );

  useEffect(() => {
    if (copyHighlight) {
      const timer = setTimeout(() => {
        setCopyHighlight(null);
      }, 300); // Highlight for 300ms
      return () => clearTimeout(timer);
    }
  }, [copyHighlight]);

  useInput(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: thats totally fine
    (input, key) => {
      if (!(isActive && onChange)) {
        return;
      }

      if (key.return) {
        onNewLine?.();
        return;
      }

      if (key.upArrow) {
        onArrowUp?.();
        return;
      }

      if (key.downArrow) {
        onArrowDown?.();
        return;
      }

      if (key.leftArrow) {
        if (cursorPosition !== undefined && cursorPosition > 0) {
          onChange(value, cursorPosition - 1);
        }
        return;
      }

      if (key.rightArrow) {
        if (cursorPosition !== undefined && cursorPosition < value.length) {
          onChange(value, cursorPosition + 1);
        }
        return;
      }

      if (key.backspace || key.delete) {
        if (cursorPosition === 0) {
          // Backspace at beginning of line (empty or non-empty)
          onBackspaceOnEmptyLine?.();
        } else if (cursorPosition !== undefined && cursorPosition > 0) {
          const newValue =
            value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
          onChange(newValue, cursorPosition - 1);
        }
        return;
      }

      // Handle Ctrl+Y for copying result
      if (key.ctrl && input === "y" && !key.shift) {
        if (result && !error) {
          const resultToCopy = formatResultWithUnit(result);
          clipboardy.writeSync(resultToCopy);
          setCopyHighlight("result");
        }
        return;
      }

      // Handle Ctrl+U or Ctrl+Shift+Y for copying full line
      if (key.ctrl && (input === "u" || (input === "y" && key.shift))) {
        if (result && !error) {
          const resultToCopy = formatResultWithUnit(result);
          const fullLine = `${value} = ${resultToCopy}`;
          clipboardy.writeSync(fullLine);
          setCopyHighlight("full");
        }
        return;
      }

      // Regular character input
      if (input && !key.ctrl && !key.meta && cursorPosition !== undefined) {
        const newValue =
          value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
        onChange(newValue, cursorPosition + input.length);
      }
    },
    { isActive }
  );

  // Format result
  let resultText = "";
  if (error) {
    resultText = `Error: ${error}`;
  } else if (result) {
    resultText = formatResultWithUnit(result);
  }

  return (
    <Box justifyContent="space-between" width="100%">
      <Box flexGrow={1}>
        {(() => {
          if (value === "" && !isActive) {
            // Render empty lines with a space to ensure they take up height
            return <Text> </Text>;
          }
          if (isComment && !isActive) {
            return (
              <Text
                backgroundColor={
                  copyHighlight === "full" ? "yellow" : undefined
                }
                color={copyHighlight === "full" ? "black" : undefined}
                dimColor={copyHighlight !== "full"}
              >
                {value}
              </Text>
            );
          }
          if (copyHighlight === "full") {
            return (
              <Text backgroundColor="yellow" color="black">
                {value}
              </Text>
            );
          }
          return (
            <InputLine
              cursorPosition={isActive ? cursorPosition : undefined}
              dimColor={isComment}
              text={value}
            />
          );
        })()}
      </Box>
      {resultText && !isComment && (
        <Box marginLeft={copyHighlight === "full" ? 1 : 2}>
          <Text
            backgroundColor={
              copyHighlight === "result" || copyHighlight === "full"
                ? "yellow"
                : undefined
            }
            bold={!error}
            color={(() => {
              if (copyHighlight === "result" || copyHighlight === "full") {
                return "black";
              }
              return error ? "red" : "green";
            })()}
          >
            {copyHighlight === "full" ? " = " : "= "}
            {resultText}
          </Text>
        </Box>
      )}
    </Box>
  );
};
