import { Box, Text } from "ink";
import type React from "react";
import type { TextSelection } from "./calculator-state";

interface StatusBarProps {
  filename: string | null;
  isModified: boolean;
  isFilenamePrompt: boolean;
  isRenamingFile: boolean;
  promptInput: string;
  promptCursorPosition: number;
  promptSelection: TextSelection | null;
  isNewFile: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  filename,
  isModified,
  isFilenamePrompt,
  isRenamingFile,
  promptInput,
  promptCursorPosition,
  promptSelection,
  isNewFile,
}) => {
  if (isFilenamePrompt) {
    // Handle selection rendering
    if (promptSelection) {
      const { from, to } = promptSelection;
      // Since filename prompt is single line, we only care about char positions
      const selStart = Math.min(from.char, to.char);
      const selEnd = Math.max(from.char, to.char);

      const parts: Array<{
        text: string;
        selected?: boolean;
        cursor?: boolean;
      }> = [];

      for (let i = 0; i <= promptInput.length; i++) {
        const char = promptInput[i] || " ";
        const selected = i >= selStart && i < selEnd;
        const cursor = i === promptCursorPosition;
        parts.push({ text: char, selected, cursor });
      }

      return (
        <Box borderColor="white" borderStyle="round" paddingX={1}>
          <Text>{isRenamingFile ? "Rename to: " : "Save as: "}</Text>
          {parts.map((part, i) => {
            if (part.cursor && !part.selected) {
              return (
                <Text color="cyan" inverse key={`char-${i}-${part.text}`}>
                  {part.text}
                </Text>
              );
            }
            if (part.selected) {
              return (
                <Text
                  backgroundColor="blue"
                  color="black"
                  key={`char-${i}-${part.text}`}
                >
                  {part.text}
                </Text>
              );
            }
            return (
              <Text color="cyan" key={`char-${i}-${part.text}`}>
                {part.text}
              </Text>
            );
          })}
        </Box>
      );
    }

    // No selection - render with simple cursor
    const beforeCursor = promptInput.slice(0, promptCursorPosition);
    const atCursor = promptInput[promptCursorPosition] || " ";
    const afterCursor = promptInput.slice(promptCursorPosition + 1);

    return (
      <Box borderColor="white" borderStyle="round" paddingX={1}>
        <Text>{isRenamingFile ? "Rename to: " : "Save as: "}</Text>
        <Text color="cyan">{beforeCursor}</Text>
        <Text inverse>{atCursor}</Text>
        <Text color="cyan">{afterCursor}</Text>
      </Box>
    );
  }

  const displayName = filename || "Untitled";
  const modifiedIndicator = isModified ? " *" : "";

  // Show rename hint only for existing files (not new files that don't exist yet)
  const showRenameHint = !isNewFile && filename;

  return (
    <Box borderColor="gray" borderStyle="round" paddingX={1}>
      <Text>
        <Text color="gray">File: </Text>
        <Text color="cyan">{displayName}</Text>
        <Text color="yellow">{modifiedIndicator}</Text>
        {isModified && (
          <>
            <Text color="gray"> | </Text>
            <Text color="gray">Ctrl+S to save</Text>
          </>
        )}
        {showRenameHint && (
          <>
            <Text color="gray"> | </Text>
            <Text color="gray">Ctrl+R to rename</Text>
          </>
        )}
      </Text>
    </Box>
  );
};
