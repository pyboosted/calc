import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { InputWithResult } from './InputWithResult';
import { evaluate } from '../evaluator/evaluate';
import type { CalculatorState, CalculatedValue } from '../types';

import { writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';

interface CalculatorProps {
  initialContent?: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ initialContent }) => {
  const { exit } = useApp();
  const [state, setState] = useState<CalculatorState>(() => ({
    input: initialContent ? initialContent.split('\n')[0] || '' : '',
    result: null,
    error: null,
    history: [],
    cursorPosition: 0,
    variables: new Map()
  }));

  const [lines, setLines] = useState<string[]>(() => {
    if (initialContent) {
      const contentLines = initialContent.split('\n');
      return contentLines.length === 0 ? [''] : contentLines;
    }
    return [''];
  });
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [lineResults, setLineResults] = useState<Map<number, { result: CalculatedValue | null; error: string | null; isComment?: boolean }>>(new Map());

  useInput((input, key) => {
    if (key.escape) {
      process.exit(0);
    }
    
    if (key.ctrl && input === 'c') {
      process.exit(0);
    }
    
    if (key.ctrl && input === 'l') {
      setLines(['']);
      setCurrentLineIndex(0);
      setLineResults(new Map());
      setState(prev => ({ ...prev, input: '', result: null, error: null, cursorPosition: 0 }));
    }
    
    if (key.ctrl && input === 'e') {
      openInEditor();
    }
  });

  // Evaluate all lines
  useEffect(() => {
    const newLineResults = new Map<number, { result: CalculatedValue | null; error: string | null; isComment?: boolean }>();
    const cumulativeVariables = new Map(state.variables);
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        newLineResults.set(index, { result: null, error: null, isComment: false });
        if (index === currentLineIndex) {
          setState(prev => ({ ...prev, result: null, error: null }));
        }
        return;
      }
      
      // Find the previous line's result for 'prev' variable
      let prevValue: CalculatedValue | undefined;
      for (let i = index - 1; i >= 0; i--) {
        const prevLineResult = newLineResults.get(i);
        if (prevLineResult && prevLineResult.result && !prevLineResult.isComment) {
          prevValue = prevLineResult.result;
          break;
        }
      }
      
      // Create variables map for this line with current 'prev' value
      const lineVariables = new Map(cumulativeVariables);
      if (prevValue) {
        lineVariables.set('prev', prevValue);
      } else {
        lineVariables.delete('prev');
      }
      
      try {
        // Collect previous results for aggregate operations
        const previousResults: CalculatedValue[] = [];
        for (let i = index - 1; i >= 0; i--) {
          const prevResult = newLineResults.get(i);
          if (!prevResult || prevResult.isComment || !prevResult.result) {
            // Stop at empty line or comment
            break;
          }
          previousResults.unshift(prevResult.result);
        }
        
        const result = evaluate(line, lineVariables, { previousResults });
        newLineResults.set(index, { result, error: null, isComment: false });
        
        // Copy any new variable assignments back to cumulative variables (except 'prev')
        lineVariables.forEach((value, key) => {
          if (key !== 'prev') {
            cumulativeVariables.set(key, value);
          }
        });
        
        // Update current state if this is the current line
        if (index === currentLineIndex) {
          setState(prev => ({ 
            ...prev, 
            result, 
            error: null,
            variables: new Map(cumulativeVariables)
          }));
        }
      } catch (error) {
        // Treat invalid expressions as comments (gray text)
        newLineResults.set(index, { result: null, error: null, isComment: true });
        
        // Update current state if this is the current line
        if (index === currentLineIndex) {
          setState(prev => ({ ...prev, result: null, error: null }));
        }
      }
    });
    
    setLineResults(newLineResults);
  }, [lines, currentLineIndex]);

  const handleInputChange = (value: string, cursorPosition: number) => {
    const newLines = [...lines];
    newLines[currentLineIndex] = value;
    setLines(newLines);
    setState(prev => ({ ...prev, input: value, cursorPosition }));
  };

  const handleBackspaceAtLineStart = () => {
    if (currentLineIndex > 0) {
      const currentLine = lines[currentLineIndex];
      const prevLineIndex = currentLineIndex - 1;
      const prevLine = lines[prevLineIndex];
      
      // Merge current line with previous line
      const mergedLine = prevLine + currentLine;
      const newCursorPosition = prevLine.length;
      
      // Update lines array
      const newLines = [...lines];
      newLines[prevLineIndex] = mergedLine;
      newLines.splice(currentLineIndex, 1);
      
      setLines(newLines);
      setCurrentLineIndex(prevLineIndex);
      setState(prev => ({ 
        ...prev, 
        input: mergedLine, 
        cursorPosition: newCursorPosition,
        result: null,
        error: null
      }));
    }
  };

  const handleNewLine = () => {
    const currentLine = lines[currentLineIndex];
    const beforeCursor = currentLine.slice(0, state.cursorPosition);
    const afterCursor = currentLine.slice(state.cursorPosition);
    
    // Update current line with text before cursor
    const newLines = [...lines];
    newLines[currentLineIndex] = beforeCursor;
    
    // Insert new line with text after cursor
    newLines.splice(currentLineIndex + 1, 0, afterCursor);
    
    setLines(newLines);
    setCurrentLineIndex(currentLineIndex + 1);
    setState(prev => ({ 
      ...prev, 
      input: afterCursor, 
      cursorPosition: 0, 
      result: null, 
      error: null 
    }));
  };

  const handleArrowUp = () => {
    if (currentLineIndex > 0) {
      const targetIndex = currentLineIndex - 1;
      const targetLine = lines[targetIndex];
      const newCursorPosition = Math.min(state.cursorPosition, targetLine.length);
      
      setCurrentLineIndex(targetIndex);
      setState(prev => ({ 
        ...prev, 
        input: targetLine, 
        cursorPosition: newCursorPosition 
      }));
    }
  };

  const handleArrowDown = () => {
    if (currentLineIndex < lines.length - 1) {
      const targetIndex = currentLineIndex + 1;
      const targetLine = lines[targetIndex];
      const newCursorPosition = Math.min(state.cursorPosition, targetLine.length);
      
      setCurrentLineIndex(targetIndex);
      setState(prev => ({ 
        ...prev, 
        input: targetLine, 
        cursorPosition: newCursorPosition 
      }));
    }
  };

  const openInEditor = () => {
    const editor = process.env.EDITOR || 'nano';
    const tempFile = join(tmpdir(), `calc-${Date.now()}.txt`);
    
    // Write current content to temp file
    const content = lines.join('\n');
    writeFileSync(tempFile, content);
    
    try {
      // Open editor and wait for it to close
      execSync(`${editor} ${tempFile}`, { stdio: 'inherit' });
      
      // Read the edited content
      const editedContent = readFileSync(tempFile, 'utf-8');
      const newLines = editedContent.split('\n');
      
      // Update the calculator with new content
      setLines(newLines.length === 0 ? [''] : newLines);
      setCurrentLineIndex(0);
      setState(prev => ({ 
        ...prev, 
        input: newLines[0] || '', 
        cursorPosition: 0,
        result: null,
        error: null
      }));
    } catch (error) {
      // If editor fails, just return without changes
      console.error('Failed to open editor:', error);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Boosted Calculator</Text>
      </Box>
      
      <Box flexDirection="column">
        {lines.map((line, index) => {
          const lineResult = lineResults.get(index);
          return (
            <InputWithResult
              key={index}
              value={line}
              cursorPosition={index === currentLineIndex ? state.cursorPosition : undefined}
              result={lineResult?.result || null}
              error={lineResult?.error || null}
              isComment={lineResult?.isComment || false}
              onChange={index === currentLineIndex ? handleInputChange : undefined}
              onNewLine={index === currentLineIndex ? handleNewLine : undefined}
              onArrowUp={index === currentLineIndex ? handleArrowUp : undefined}
              onArrowDown={index === currentLineIndex ? handleArrowDown : undefined}
              onBackspaceOnEmptyLine={index === currentLineIndex ? handleBackspaceAtLineStart : undefined}
              isActive={index === currentLineIndex}
            />
          );
        })}
      </Box>
      
    </Box>
  );
};