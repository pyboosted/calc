import { Text } from "ink";
import type React from "react";
import type { TextSelection } from "./calculator-state";

export const LINE_END_CHAR = "•"; // Middle dot indicator

export interface CharPart {
  text: string;
  inverse?: boolean;
  color?: string;
  selected?: boolean;
  selectionEnd?: boolean;
  selectionDirection?: "left" | "right";
}

export interface CharRenderProps {
  dimColor?: boolean;
  copyHighlight?: "result" | "full" | "selection" | null;
}

// Helper function to normalize selection (ensure from is before to)
export function normalizeSelection(selection: TextSelection): TextSelection {
  const { from, to } = selection;
  if (from.line > to.line || (from.line === to.line && from.char > to.char)) {
    return { from: to, to: from };
  }
  return { from, to };
}

// Helper function to get selection range for current line
export function getLineSelectionRange(
  selection: TextSelection | null | undefined,
  lineIndex: number | undefined
): { start: number; end: number } | null {
  if (!selection || lineIndex === undefined) {
    return null;
  }

  const normalized = normalizeSelection(selection);
  const { from, to } = normalized;

  // Check if this line is within the selection
  if (lineIndex < from.line || lineIndex > to.line) {
    return null;
  }

  let start = 0;
  let end = Number.POSITIVE_INFINITY;

  if (lineIndex === from.line) {
    start = from.char;
  }
  if (lineIndex === to.line) {
    end = to.char;
  }

  return { start, end };
}

export function shouldShowLineEndIndicator(
  selection: TextSelection | null | undefined,
  lineIndex: number | undefined
): boolean {
  if (!selection || lineIndex === undefined) {
    return false;
  }

  const normalized = normalizeSelection(selection);
  const { from, to } = normalized;

  // Show indicator if:
  // 1. This line is part of a multi-line selection
  // 2. This is not the last line of the selection
  // 3. The selection extends to or past the end of this line
  if (lineIndex >= from.line && lineIndex < to.line) {
    return true;
  }

  return false;
}

export function isLineEndSelectionEdge(
  selection: TextSelection | null | undefined,
  lineIndex: number | undefined,
  textLength: number
): boolean {
  if (!selection || lineIndex === undefined) {
    return false;
  }

  return (
    // Forward selection: cursor wrapped to next line
    (lineIndex === selection.to.line - 1 && selection.to.char === 0) ||
    // Backward selection: cursor at end of current line
    (lineIndex === selection.to.line && selection.to.char === textLength)
  );
}

export function getSelectionDirection(
  selection: TextSelection | null
): "left" | "right" {
  if (!selection) {
    return "right";
  }
  // If selecting left (cursor at start)
  if (
    selection.from.line === selection.to.line &&
    selection.from.char > selection.to.char
  ) {
    return "left";
  }
  // Otherwise selecting right
  return "right";
}

export function renderCharPart(
  part: CharPart,
  key: string,
  { dimColor, copyHighlight }: CharRenderProps
): React.ReactElement {
  const textProps = (() => {
    // Handle selection end (last character of selection)
    if (part.selectionEnd) {
      if (copyHighlight === "selection") {
        return {
          backgroundColor: "yellow",
          color: "black",
          underline: true,
        };
      }
      // Use cyan background for selection edge cursor
      return {
        backgroundColor: "cyan",
        color: "black",
      };
    }
    // Handle regular selection
    if (part.selected) {
      const selectionProps: Record<string, unknown> = {};
      if (copyHighlight === "selection") {
        selectionProps.backgroundColor = "yellow";
        selectionProps.color = "black";
      } else {
        selectionProps.backgroundColor = "blue";
        selectionProps.color = "black";
      }
      return selectionProps;
    }
    // Handle non-selected parts
    const props: Record<string, unknown> = {};
    // For line ending characters, we need to show them as dim when not selected
    if (part.text === LINE_END_CHAR && !part.selected && !part.selectionEnd) {
      props.dimColor = true;
    } else if (dimColor) {
      props.dimColor = true;
    } else if (part.color) {
      // Always apply the color, even if it's "dim"
      if (part.color === "dim") {
        props.dimColor = true;
      } else {
        props.color = part.color;
      }
    }
    if (part.inverse) {
      props.inverse = true;
    }
    return props;
  })();

  return (
    <Text {...textProps} key={key}>
      {part.text}
    </Text>
  );
}
