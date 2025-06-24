import type { TextSelection } from "./calculator-state";
import type { CharPart } from "./input-line-helpers";
import { getSelectionDirection } from "./input-line-helpers";

interface HighlightedPart {
  text: string;
  color?: string;
}

// Build parts for a single highlighted part when cursor is within it
export function buildPartsForCursorInPart(
  part: HighlightedPart,
  charIndex: number,
  cursorPosition: number,
  selectionRange: { start: number; end: number } | null,
  selection: TextSelection | null,
  _lineIndex: number | undefined,
  isAtSelectionEdge: (charPos: number) => boolean
): CharPart[] {
  const parts: CharPart[] = [];
  const relPos = cursorPosition - charIndex;

  // Before cursor
  if (relPos > 0) {
    const beforeCursor = part.text.slice(0, relPos);
    for (let i = 0; i < beforeCursor.length; i++) {
      const charPos = charIndex + i;
      const isSelected =
        selectionRange &&
        charPos >= selectionRange.start &&
        charPos < selectionRange.end;
      const isSelectionEnd = isAtSelectionEdge(charPos);
      parts.push({
        text: beforeCursor[i] || "",
        color: part.color,
        selected: !!isSelected,
        selectionEnd: !!isSelectionEnd,
        selectionDirection: isSelectionEnd
          ? getSelectionDirection(selection)
          : undefined,
      });
    }
  }

  // Character at cursor position
  const charAtCursor = part.text[relPos] || " ";
  const charPos = charIndex + relPos;
  const isSelected =
    selectionRange &&
    charPos >= selectionRange.start &&
    charPos < selectionRange.end;
  const isSelectionEnd = isAtSelectionEdge(charPos);
  parts.push({
    text: charAtCursor,
    color: part.color,
    selected: !!isSelected,
    selectionEnd: !!isSelectionEnd,
    selectionDirection: isSelectionEnd
      ? getSelectionDirection(selection)
      : undefined,
    inverse: !selection, // Only show cursor when no selection
  });

  // After cursor
  if (relPos < part.text.length - 1) {
    const afterCursor = part.text.slice(relPos + 1);
    for (let i = 0; i < afterCursor.length; i++) {
      const afterCharPos = charIndex + relPos + 1 + i;
      const afterIsSelected =
        selectionRange &&
        afterCharPos >= selectionRange.start &&
        afterCharPos < selectionRange.end;
      const afterIsSelectionEnd = isAtSelectionEdge(afterCharPos);
      parts.push({
        text: afterCursor[i] || "",
        color: part.color,
        selected: !!afterIsSelected,
        selectionEnd: !!afterIsSelectionEnd,
        selectionDirection: afterIsSelectionEnd
          ? getSelectionDirection(selection)
          : undefined,
      });
    }
  }

  return parts;
}

// Build parts for text at end of line (cursor at end)
export function buildPartsForEndOfLine(
  part: HighlightedPart,
  charIndex: number,
  textLength: number,
  selectionRange: { start: number; end: number } | null,
  selection: TextSelection | null,
  showLineEndIndicator: boolean,
  isAtSelectionEdge: (charPos: number) => boolean
): CharPart[] {
  const parts: CharPart[] = [];

  // Check selection for each character in this part
  for (let i = 0; i < part.text.length; i++) {
    const charPos = charIndex + i;
    const isSelected =
      selectionRange &&
      charPos >= selectionRange.start &&
      charPos < selectionRange.end;
    const isSelectionEnd = isAtSelectionEdge(charPos);
    parts.push({
      text: part.text[i] || "",
      color: part.color,
      selected: !!isSelected,
      selectionEnd: !!isSelectionEnd,
      selectionDirection: isSelectionEnd
        ? getSelectionDirection(selection)
        : undefined,
    });
  }

  // Add space with cursor at end of line (only if no line ending indicator)
  if (!showLineEndIndicator) {
    const isSelected =
      selectionRange &&
      textLength >= selectionRange.start &&
      textLength < selectionRange.end;
    const isSelectionEnd = isAtSelectionEdge(textLength);
    parts.push({
      text: " ",
      inverse: !selection, // Only show cursor when no selection
      selected: !!isSelected,
      selectionEnd: !!isSelectionEnd,
      selectionDirection: isSelectionEnd
        ? getSelectionDirection(selection)
        : undefined,
    });
  }

  return parts;
}

// Build parts for regular text (no cursor in this part)
export function buildPartsForRegularText(
  part: HighlightedPart,
  charIndex: number,
  selectionRange: { start: number; end: number } | null,
  selection: TextSelection | null,
  isAtSelectionEdge: (charPos: number) => boolean
): CharPart[] {
  const parts: CharPart[] = [];

  for (let i = 0; i < part.text.length; i++) {
    const charPos = charIndex + i;
    const isSelected =
      selectionRange &&
      charPos >= selectionRange.start &&
      charPos < selectionRange.end;
    const isSelectionEnd = isAtSelectionEdge(charPos);
    parts.push({
      text: part.text[i] || "",
      color: part.color,
      selected: !!isSelected,
      selectionEnd: !!isSelectionEnd,
      selectionDirection: isSelectionEnd
        ? getSelectionDirection(selection)
        : undefined,
    });
  }

  return parts;
}
