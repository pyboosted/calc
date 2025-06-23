import { Box, useInput } from "ink";
import type React from "react";
import { useState } from "react";
import type { HistoryEntry } from "../types";
import { InputLine } from "./InputLine";

interface InputProps {
  value: string;
  cursorPosition: number;
  onChange: (value: string, cursorPosition: number) => void;
  history: HistoryEntry[];
}

export const Input: React.FC<InputProps> = ({ value, cursorPosition, onChange, history }) => {
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [tempValue, setTempValue] = useState<string>("");

  useInput((input, key) => {
    if (key.return) {
      onChange(`${value}\n`, cursorPosition + 1);
      return;
    }

    if (key.upArrow) {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const historyEntry = history[history.length - 1 - newIndex];
        if (historyEntry) {
          if (historyIndex === -1) {
            setTempValue(value);
          }
          setHistoryIndex(newIndex);
          onChange(historyEntry.input, historyEntry.input.length);
        }
      }
      return;
    }

    if (key.downArrow) {
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        if (newIndex === -1) {
          onChange(tempValue, tempValue.length);
        } else {
          const historyEntry = history[history.length - 1 - newIndex];
          if (historyEntry) {
            onChange(historyEntry.input, historyEntry.input.length);
          }
        }
      }
      return;
    }

    if (key.leftArrow) {
      if (cursorPosition > 0) {
        onChange(value, cursorPosition - 1);
      }
      return;
    }

    if (key.rightArrow) {
      if (cursorPosition < value.length) {
        onChange(value, cursorPosition + 1);
      }
      return;
    }

    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
        onChange(newValue, cursorPosition - 1);
      }
      return;
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      const newValue = value.slice(0, cursorPosition) + input + value.slice(cursorPosition);
      onChange(newValue, cursorPosition + input.length);
      setHistoryIndex(-1);
    }
  });

  const lines = value.split("\n");
  let currentPos = 0;

  return (
    <Box flexDirection="column">
      {lines.length === 0 || (lines.length === 1 && lines[0] === "") ? (
        <Box>
          <InputLine text="" cursorPosition={0} />
        </Box>
      ) : (
        lines.map((line, index) => {
          const lineStartPos = currentPos;
          const lineEndPos = lineStartPos + line.length;
          currentPos = lineEndPos + 1; // +1 for newline

          const isLastLine = index === lines.length - 1;
          const cursorOnThisLine =
            isLastLine && cursorPosition >= lineStartPos && cursorPosition <= lineEndPos;

          // Create a stable key based on line content and position
          const lineKey = `${index}-${line.length}-${line.slice(0, 10)}`;
          return (
            <Box key={lineKey}>
              <InputLine
                text={line}
                cursorPosition={cursorOnThisLine ? cursorPosition - lineStartPos : undefined}
              />
            </Box>
          );
        })
      )}
    </Box>
  );
};
