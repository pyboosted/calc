import { Text } from "ink";
import type React from "react";
import type { TextSelection } from "./calculator-state";
import { buildCharacterParts } from "./input-line-builder";
import {
  getLineSelectionRange,
  isLineEndSelectionEdge,
  LINE_END_CHAR,
  normalizeSelection,
  renderCharPart,
  shouldShowLineEndIndicator,
} from "./input-line-helpers";
import { getHighlightedParts } from "./input-line-syntax";

interface InputLineProps {
  text: string;
  cursorPosition?: number;
  dimColor?: boolean;
  selection?: TextSelection | null;
  lineIndex?: number;
  copyHighlight?: "result" | "full" | "selection" | null;
  inactiveCursor?: boolean;
}

// Component for empty line with cursor
const EmptyLineWithCursor: React.FC<{
  selection: TextSelection | null;
  selectionRange: { start: number; end: number } | null;
  lineIndex: number | undefined;
  showLineEndIndicator: boolean;
  copyHighlight?: "result" | "full" | "selection" | null;
}> = ({
  selection,
  selectionRange,
  lineIndex,
  showLineEndIndicator,
  copyHighlight,
}) => {
  // In selection mode, check if this line should show anything
  if (selectionRange) {
    // Show the line end indicator with appropriate styling
    const hasEdge = isAtSelectionEdge(0, selection, lineIndex);
    const isSelected = selectionRange.start <= 0 && selectionRange.end > 0;

    if (hasEdge) {
      return (
        <Text backgroundColor="cyan" color="black">
          {showLineEndIndicator ? LINE_END_CHAR : " "}
        </Text>
      );
    }
    if (isSelected) {
      return (
        <Text
          backgroundColor={copyHighlight === "selection" ? "yellow" : "blue"}
          color="black"
        >
          {showLineEndIndicator ? LINE_END_CHAR : " "}
        </Text>
      );
    }
    if (showLineEndIndicator) {
      return <Text color="dim">{LINE_END_CHAR}</Text>;
    }
  }
  // In selection mode but this line is not selected - don't show cursor
  return <Text> </Text>;
};

// Component for rendering empty lines with selection
const EmptyLineWithSelection: React.FC<{
  showLineEndIndicator: boolean;
  selectionRange: { start: number; end: number } | null;
  selection: TextSelection | null;
  lineIndex: number | undefined;
  copyHighlight?: "result" | "full" | "selection" | null;
}> = ({
  showLineEndIndicator,
  selectionRange,
  selection,
  lineIndex,
  copyHighlight,
}) => {
  if (!showLineEndIndicator) {
    return null;
  }

  const isLineEndSelected = selectionRange && selectionRange.end > 0;
  const hasEdge = isLineEndSelectionEdge(selection, lineIndex, 0);

  if (hasEdge) {
    return (
      <Text>
        <Text backgroundColor="cyan" color="black">
          {LINE_END_CHAR}
        </Text>
      </Text>
    );
  }
  if (isLineEndSelected) {
    return (
      <Text>
        <Text
          backgroundColor={copyHighlight === "selection" ? "yellow" : "blue"}
          color="black"
        >
          {LINE_END_CHAR}
        </Text>
      </Text>
    );
  }
  return (
    <Text>
      <Text color="dim">{LINE_END_CHAR}</Text>
    </Text>
  );
};

// Helper to check if a character position is at the selection edge near cursor
function isAtSelectionEdge(
  charPos: number,
  selection: TextSelection | null,
  lineIndex: number | undefined
): boolean {
  if (!selection || lineIndex === undefined) {
    return false;
  }

  // For regular characters, only check if we're on the line with the cursor
  // Line endings are handled separately by isLineEndSelectionEdge
  if (lineIndex !== selection.to.line) {
    return false;
  }

  const cursorPos = selection.to.char;

  // During selection, show cyan cursor at the active selection position
  if (selection.from.line === selection.to.line) {
    // Single line selection
    if (selection.from.char < selection.to.char) {
      // Selecting right: cursor is just after the last selected char
      return charPos === cursorPos - 1;
    }
    if (selection.from.char > selection.to.char) {
      // Selecting left: cursor is at the start of selection
      return charPos === cursorPos;
    }
  } else {
    // Multi-line selection
    const normalized = normalizeSelection(selection);
    if (
      selection.to.line === normalized.to.line &&
      selection.to.char === normalized.to.char
    ) {
      // Cursor at end (selecting down/right)
      // When cursor is at position 0 on next line, no character on this line should have edge
      if (cursorPos === 0) {
        return false;
      }
      return charPos === cursorPos - 1;
    }
    // Cursor at start (selecting up/left)
    return charPos === cursorPos;
  }

  return false;
}

export const InputLine: React.FC<InputLineProps> = ({
  text,
  cursorPosition,
  dimColor,
  selection,
  lineIndex,
  copyHighlight,
  inactiveCursor,
}) => {
  // Get selection range for this line
  const selectionRange = getLineSelectionRange(selection, lineIndex);
  const showLineEndIndicator = shouldShowLineEndIndicator(selection, lineIndex);

  // For empty input with cursor at position 0
  if (text === "" && cursorPosition === 0) {
    // Check if we're in selection mode
    if (selection) {
      return (
        <EmptyLineWithCursor
          copyHighlight={copyHighlight}
          lineIndex={lineIndex}
          selection={selection}
          selectionRange={selectionRange}
          showLineEndIndicator={showLineEndIndicator}
        />
      );
    }
    // Normal cursor (no selection)
    if (inactiveCursor) {
      return (
        <Text backgroundColor="gray" color="black">
          {" "}
        </Text>
      );
    }
    return <Text inverse> </Text>;
  }

  if (cursorPosition === undefined) {
    // No cursor on this line, just render highlighted text
    return (
      <HighlightedText
        copyHighlight={copyHighlight}
        dimColor={dimColor}
        lineIndex={lineIndex}
        selection={selection}
        selectionRange={selectionRange}
        showLineEndIndicator={showLineEndIndicator}
        text={text}
      />
    );
  }

  // Build the character parts for rendering
  const parts = buildCharacterParts({
    text,
    cursorPosition,
    selection: selection ?? null,
    selectionRange,
    showLineEndIndicator,
    lineIndex,
    isAtSelectionEdge: (charPos) =>
      isAtSelectionEdge(charPos, selection ?? null, lineIndex),
    inactiveCursor,
  });

  // Render all parts in a single Text component
  // Create cumulative position for unique keys
  let cumulativePosition = 0;

  return (
    <Text>
      {parts.map((part, _i) => {
        const startPos = cumulativePosition;
        cumulativePosition += part.text.length;

        // Create a unique key based on absolute position and content
        const key = `part-${startPos}-${cumulativePosition}-${part.color || "def"}-${part.inverse ? "inv" : "norm"}-${part.selected ? "sel" : "unsel"}`;

        return renderCharPart(part, key, { dimColor, copyHighlight });
      })}
    </Text>
  );
};

const HighlightedText: React.FC<{
  text: string;
  selectionRange?: { start: number; end: number } | null;
  dimColor?: boolean;
  copyHighlight?: "result" | "full" | "selection" | null;
  showLineEndIndicator?: boolean;
  selection?: TextSelection | null;
  lineIndex?: number;
}> = ({
  text,
  selectionRange,
  dimColor,
  copyHighlight,
  showLineEndIndicator,
  selection,
  lineIndex,
}) => {
  // Handle empty lines - they should still show selection indicator
  if (!text) {
    const isSelected =
      selectionRange && selectionRange.start <= 0 && selectionRange.end > 0;
    if (!(isSelected || showLineEndIndicator)) {
      return null;
    }
    return (
      <EmptyLineWithSelection
        copyHighlight={copyHighlight}
        lineIndex={lineIndex}
        selection={selection || null}
        selectionRange={selectionRange || null}
        showLineEndIndicator={!!(isSelected || showLineEndIndicator)}
      />
    );
  }

  const parts = getHighlightedParts(text);

  // If there's no selection, render normally
  if (!selectionRange) {
    // Create cumulative position for unique keys
    let cumulativePosition = 0;

    return (
      <Text>
        {parts.map((part, _i) => {
          const startPos = cumulativePosition;
          cumulativePosition += part.text.length;

          // Create a unique key based on absolute position in text
          const key = `hl-${startPos}-${cumulativePosition}-${part.color || "def"}`;

          return (
            <Text
              color={dimColor || part.color === "dim" ? undefined : part.color}
              dimColor={dimColor || part.color === "dim"}
              key={key}
            >
              {part.text}
            </Text>
          );
        })}
        {showLineEndIndicator &&
          (() => {
            // Check if line ending has selection edge
            const hasEdge =
              selection &&
              lineIndex !== undefined &&
              // Forward selection: cursor wrapped to next line
              ((lineIndex === selection.to.line - 1 &&
                selection.to.char === 0) ||
                // Backward selection: cursor at end of current line
                (lineIndex === selection.to.line &&
                  selection.to.char === text.length));

            if (hasEdge) {
              return (
                <Text backgroundColor="cyan" color="black">
                  {LINE_END_CHAR}
                </Text>
              );
            }
            return <Text color="dim">{LINE_END_CHAR}</Text>;
          })()}
      </Text>
    );
  }

  // Render with syntax highlighting AND selection highlighting
  // We need to combine both syntax colors and selection state
  const syntaxParts = getHighlightedParts(text);
  const combinedParts: Array<{
    text: string;
    selected: boolean;
    color?: string;
    hasEdge?: boolean;
  }> = [];

  // Split syntax parts by selection boundaries
  let charIndex = 0;
  for (const syntaxPart of syntaxParts) {
    let partIndex = 0;
    while (partIndex < syntaxPart.text.length) {
      const globalCharIndex = charIndex + partIndex;
      const isSelected =
        globalCharIndex >= selectionRange.start &&
        globalCharIndex < selectionRange.end;

      // Find the end of this selection state within this syntax part
      let groupEnd = partIndex + 1;
      while (groupEnd < syntaxPart.text.length) {
        const nextGlobalIndex = charIndex + groupEnd;
        const nextIsSelected =
          nextGlobalIndex >= selectionRange.start &&
          nextGlobalIndex < selectionRange.end;

        if (nextIsSelected === isSelected) {
          groupEnd++;
        } else {
          break;
        }
      }

      combinedParts.push({
        text: syntaxPart.text.slice(partIndex, groupEnd),
        selected: isSelected,
        color: syntaxPart.color,
      });

      partIndex = groupEnd;
    }
    charIndex += syntaxPart.text.length;
  }

  // Add line ending indicator if needed
  if (showLineEndIndicator) {
    const isLineEndSelected =
      selectionRange && text.length < selectionRange.end;

    // Check if line ending has selection edge
    const hasEdge =
      selection &&
      lineIndex !== undefined &&
      // Forward selection: cursor wrapped to next line
      ((lineIndex === selection.to.line - 1 && selection.to.char === 0) ||
        // Backward selection: cursor at end of current line
        (lineIndex === selection.to.line && selection.to.char === text.length));

    combinedParts.push({
      text: LINE_END_CHAR,
      selected: isLineEndSelected,
      color: "dim",
      hasEdge: hasEdge || undefined,
    });
  }

  return (
    <Text>
      {combinedParts.map((part, i) => {
        // Check if this part has selection edge
        if (part.hasEdge) {
          return (
            <Text
              backgroundColor="cyan"
              color="black"
              key={`combined-${i}-edge-${part.color || "def"}`}
            >
              {part.text}
            </Text>
          );
        }

        return (
          <Text
            {...(part.selected
              ? (() => {
                  const selectionProps: Record<string, unknown> = {};
                  if (copyHighlight === "selection") {
                    selectionProps.backgroundColor = "yellow";
                    selectionProps.color = "black";
                  } else {
                    selectionProps.backgroundColor = "blue";
                    selectionProps.color = "black";
                  }
                  return selectionProps;
                })()
              : (() => {
                  const props: Record<string, unknown> = {};
                  if (dimColor) {
                    props.dimColor = true;
                  } else if (part.color && part.color !== "dim") {
                    props.color = part.color;
                  } else if (
                    part.color === "dim" ||
                    part.text === LINE_END_CHAR
                  ) {
                    props.dimColor = true;
                  }
                  return props;
                })())}
            key={`combined-${i}-${part.selected ? "sel" : "unsel"}-${part.color || "def"}`}
          >
            {part.text}
          </Text>
        );
      })}
    </Text>
  );
};
