import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Box, Text, useApp, useInput } from "ink";
import type React from "react";
import { useRef, useState } from "react";
import { CalculatorEngine } from "./CalculatorEngine";
import { InputWithResult } from "./InputWithResult";

// Get package version
const __dirname = dirname(fileURLToPath(import.meta.url));
let version = "";
const possiblePaths = [
  join(__dirname, "..", "..", "package.json"),
  join(__dirname, "..", "package.json"),
];
for (const path of possiblePaths) {
  if (existsSync(path)) {
    const pkg = JSON.parse(readFileSync(path, "utf-8"));
    version = pkg.version;
    break;
  }
}

interface CalculatorProps {
  initialContent?: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ initialContent }) => {
  useApp(); // Keep app context available
  const engineRef = useRef(new CalculatorEngine(initialContent));
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [, forceUpdate] = useState({});

  const engine = engineRef.current;
  const lines = engine.getLines();
  const _currentLine = lines[currentLineIndex] || {
    content: "",
    result: null,
    error: null,
    isComment: false,
  };

  useInput((input, key) => {
    if (key.escape) {
      process.exit(0);
    }

    if (key.ctrl && input === "c") {
      process.exit(0);
    }

    if (key.ctrl && input === "l") {
      engineRef.current = new CalculatorEngine();
      setCurrentLineIndex(0);
      setCursorPosition(0);
      forceUpdate({});
    }

    if (key.ctrl && input === "e") {
      openInEditor();
    }
  });

  const handleInputChange = (value: string, newCursorPosition: number) => {
    engine.updateLine(currentLineIndex, value);
    setCursorPosition(newCursorPosition);
    forceUpdate({});
  };

  const handleBackspaceAtLineStart = () => {
    if (currentLineIndex > 0) {
      const currentLine = lines[currentLineIndex];
      const prevLineIndex = currentLineIndex - 1;
      const prevLine = lines[prevLineIndex];

      if (!currentLine || !prevLine) return;

      const currentContent = currentLine.content;
      const prevContent = prevLine.content;

      // Merge current line with previous line
      const mergedLine = prevContent + currentContent;
      const newCursorPosition = prevContent.length;

      // Update the previous line with merged content
      engine.updateLine(prevLineIndex, mergedLine);
      // Delete the current line
      engine.deleteLine(currentLineIndex);

      setCurrentLineIndex(prevLineIndex);
      setCursorPosition(newCursorPosition);
      forceUpdate({});
    }
  };

  const handleNewLine = () => {
    const currentContent = lines[currentLineIndex]?.content || "";
    const beforeCursor = currentContent.slice(0, cursorPosition);
    const afterCursor = currentContent.slice(cursorPosition);

    // Update current line with text before cursor
    engine.updateLine(currentLineIndex, beforeCursor);

    // Insert new line with text after cursor
    engine.insertLine(currentLineIndex + 1);
    engine.updateLine(currentLineIndex + 1, afterCursor);

    setCurrentLineIndex(currentLineIndex + 1);
    setCursorPosition(0);
    forceUpdate({});
  };

  const handleArrowUp = () => {
    if (currentLineIndex > 0) {
      const targetIndex = currentLineIndex - 1;
      const targetLine = lines[targetIndex];
      if (!targetLine) return;
      const targetContent = targetLine.content;
      const newCursorPosition = Math.min(cursorPosition, targetContent.length);

      setCurrentLineIndex(targetIndex);
      setCursorPosition(newCursorPosition);
    }
  };

  const handleArrowDown = () => {
    if (currentLineIndex < lines.length - 1) {
      const targetIndex = currentLineIndex + 1;
      const targetLine = lines[targetIndex];
      if (!targetLine) return;
      const targetContent = targetLine.content;
      const newCursorPosition = Math.min(cursorPosition, targetContent.length);

      setCurrentLineIndex(targetIndex);
      setCursorPosition(newCursorPosition);
    }
  };

  const openInEditor = () => {
    const editor = process.env.EDITOR || "nano";
    const tempFile = join(tmpdir(), `calc-${Date.now()}.txt`);

    // Write current content to temp file
    const content = lines.map((l) => l.content).join("\n");
    writeFileSync(tempFile, content);

    try {
      // Open editor and wait for it to close
      execSync(`${editor} ${tempFile}`, { stdio: "inherit" });

      // Read the edited content
      const editedContent = readFileSync(tempFile, "utf-8");

      // Create a new engine with the edited content
      engineRef.current = new CalculatorEngine(editedContent);
      setCurrentLineIndex(0);
      setCursorPosition(0);
      forceUpdate({});
    } catch (error) {
      // If editor fails, just return without changes
      console.error("Failed to open editor:", error);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Boosted Calculator
        </Text>
        {version && <Text color="gray"> v{version}</Text>}
      </Box>

      <Box flexDirection="column">
        {lines.map((line, index) => {
          return (
            <InputWithResult
              key={line.id}
              value={line.content}
              cursorPosition={index === currentLineIndex ? cursorPosition : undefined}
              result={line.result}
              error={line.error}
              isComment={line.isComment}
              onChange={index === currentLineIndex ? handleInputChange : undefined}
              onNewLine={index === currentLineIndex ? handleNewLine : undefined}
              onArrowUp={index === currentLineIndex ? handleArrowUp : undefined}
              onArrowDown={index === currentLineIndex ? handleArrowDown : undefined}
              onBackspaceOnEmptyLine={
                index === currentLineIndex ? handleBackspaceAtLineStart : undefined
              }
              isActive={index === currentLineIndex}
            />
          );
        })}
      </Box>
    </Box>
  );
};
