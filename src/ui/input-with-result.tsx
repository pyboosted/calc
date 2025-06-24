import { Box, Text } from "ink";
import type React from "react";
import { formatResultWithUnit } from "../evaluator/unit-formatter";
import type { CalculatedValue } from "../types";
import { InputLine } from "./input-line";

interface InputWithResultProps {
  value: string;
  cursorPosition?: number;
  result: CalculatedValue | null;
  error: string | null;
  isComment?: boolean;
  isActive: boolean;
  copyHighlight: "result" | "full" | null;
}

export const InputWithResult: React.FC<InputWithResultProps> = ({
  value,
  cursorPosition,
  result,
  error,
  isComment,
  isActive,
  copyHighlight,
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
