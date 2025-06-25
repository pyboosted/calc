import { Box, Text } from "ink";
import type React from "react";
import { formatResultWithUnit } from "../evaluator/unit-formatter";
import type { CalculatedValue } from "../types";
import type { TextSelection } from "./calculator-state";
import { InputLine } from "./input-line";

interface InputWithResultProps {
  value: string;
  cursorPosition?: number;
  result: CalculatedValue | null;
  error: string | null;
  isComment?: boolean;
  isActive: boolean;
  copyHighlight: "result" | "full" | "selection" | null;
  selection?: TextSelection | null;
  lineIndex?: number;
  inactiveCursor?: boolean;
}

export const InputWithResult: React.FC<InputWithResultProps> = ({
  value,
  cursorPosition,
  result,
  error,
  isComment,
  isActive,
  copyHighlight,
  selection,
  lineIndex,
  inactiveCursor,
}) => {
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
            // Check if this empty line is part of the selection
            const isLineSelected =
              selection &&
              lineIndex !== undefined &&
              (() => {
                const normalizedSelection = (() => {
                  const { from, to } = selection;
                  if (
                    from.line > to.line ||
                    (from.line === to.line && from.char > to.char)
                  ) {
                    return { from: to, to: from };
                  }
                  return { from, to };
                })();
                return (
                  lineIndex >= normalizedSelection.from.line &&
                  lineIndex <= normalizedSelection.to.line
                );
              })();

            if (!isLineSelected) {
              // Render empty lines with a space to ensure they take up height
              return <Text> </Text>;
            }
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
              copyHighlight={copyHighlight}
              cursorPosition={isActive ? cursorPosition : undefined}
              dimColor={isComment}
              inactiveCursor={inactiveCursor}
              lineIndex={lineIndex}
              selection={selection}
              text={value}
            />
          );
        })()}
      </Box>
      {resultText && (!isComment || error) && (
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
