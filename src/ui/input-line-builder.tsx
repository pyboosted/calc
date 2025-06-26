import type { TextSelection } from "./calculator-state";
import {
  buildPartsForCursorInPart,
  buildPartsForEndOfLine,
  buildPartsForRegularText,
} from "./input-line-cursor";
import type { CharPart } from "./input-line-helpers";
import {
  getSelectionDirection,
  isLineEndSelectionEdge,
  LINE_END_CHAR,
} from "./input-line-helpers";
import { getHighlightedParts } from "./input-line-syntax";

interface BuildCharacterPartsOptions {
  text: string;
  cursorPosition?: number;
  selection: TextSelection | null;
  selectionRange: { start: number; end: number } | null;
  showLineEndIndicator: boolean;
  lineIndex: number | undefined;
  isAtSelectionEdge: (charPos: number) => boolean;
  inactiveCursor?: boolean;
}

export function buildCharacterParts({
  text,
  cursorPosition,
  selection,
  selectionRange,
  showLineEndIndicator,
  lineIndex,
  isAtSelectionEdge,
  inactiveCursor,
}: BuildCharacterPartsOptions): CharPart[] {
  const parts: CharPart[] = [];

  if (text === "" && cursorPosition !== undefined) {
    parts.push({
      text: " ",
      inverse: true,
      color: inactiveCursor ? "gray" : undefined,
    });
  } else {
    // Get highlighted parts for the entire text
    const highlightedParts = getHighlightedParts(text);

    // Now split these parts around the cursor and selection
    let charIndex = 0;
    for (const part of highlightedParts) {
      const partEnd = charIndex + part.text.length;

      if (
        cursorPosition !== undefined &&
        cursorPosition >= charIndex &&
        cursorPosition < partEnd
      ) {
        // Cursor is within this part
        parts.push(
          ...buildPartsForCursorInPart(
            part,
            charIndex,
            cursorPosition,
            selectionRange,
            selection,
            lineIndex,
            isAtSelectionEdge,
            inactiveCursor
          )
        );
      } else if (
        cursorPosition !== undefined &&
        cursorPosition === partEnd &&
        partEnd === text.length
      ) {
        // Cursor is exactly at the end of text
        parts.push(
          ...buildPartsForEndOfLine(
            part,
            charIndex,
            text.length,
            selectionRange,
            selection,
            showLineEndIndicator,
            isAtSelectionEdge,
            inactiveCursor
          )
        );
      } else {
        // Cursor is not in this part
        parts.push(
          ...buildPartsForRegularText(
            part,
            charIndex,
            selectionRange,
            selection,
            isAtSelectionEdge
          )
        );
      }

      charIndex = partEnd;
    }

    // Handle cursor past end of text (edge case)
    if (
      cursorPosition !== undefined &&
      cursorPosition > text.length &&
      !showLineEndIndicator
    ) {
      // Add a space with cursor
      parts.push({
        text: " ",
        inverse: true,
        color: inactiveCursor ? "gray" : undefined,
      });
    }

    // Add line ending indicator if needed
    if (showLineEndIndicator) {
      parts.push(
        buildLineEndingPart(
          text,
          selection,
          selectionRange,
          lineIndex,
          cursorPosition
        )
      );
    }
  }

  return parts;
}

function buildLineEndingPart(
  text: string,
  selection: TextSelection | null,
  selectionRange: { start: number; end: number } | null,
  lineIndex: number | undefined,
  cursorPosition?: number
): CharPart {
  // Line ending is selected when selection extends past the text length
  const isLineEndSelected = selectionRange && text.length < selectionRange.end;

  // Check if cursor is at the line ending position
  const isLineEndSelectionEdgeValue = isLineEndSelectionEdge(
    selection,
    lineIndex,
    text.length
  );

  return {
    text: LINE_END_CHAR,
    color: "dim", // Always set as dim, the rendering logic will override if needed
    selected: !!isLineEndSelected,
    selectionEnd: !!isLineEndSelectionEdgeValue,
    selectionDirection: isLineEndSelectionEdgeValue
      ? (() => {
          // For line endings, we need to determine direction based on where cursor is
          if (!selection) {
            return;
          }

          // If cursor wrapped to next line, it's a left-to-right selection
          if (
            lineIndex !== undefined &&
            lineIndex === selection.to.line - 1 &&
            selection.to.char === 0
          ) {
            return "right";
          }

          return getSelectionDirection(selection);
        })()
      : undefined,
    inverse: cursorPosition === text.length && !selection, // Show cursor when at end of line
  };
}
