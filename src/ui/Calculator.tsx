import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { InputWithResult } from './InputWithResult';
import { evaluate } from '../evaluator/evaluate';
import type { CalculatorState, CalculatedValue } from '../types';

export const Calculator: React.FC = () => {
  const { exit } = useApp();
  const [state, setState] = useState<CalculatorState>({
    input: '',
    result: null,
    error: null,
    history: [],
    cursorPosition: 0,
    variables: new Map([['prev', { value: 0 }]])
  });

  const [lines, setLines] = useState<string[]>(['']);
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
  });

  // Evaluate all lines
  useEffect(() => {
    const newLineResults = new Map<number, { result: CalculatedValue | null; error: string | null; isComment?: boolean }>();
    
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
      
      try {
        const result = evaluate(line, state.variables);
        newLineResults.set(index, { result, error: null, isComment: false });
        
        // Update current state if this is the current line
        if (index === currentLineIndex) {
          setState(prev => ({ ...prev, result, error: null }));
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
  }, [lines, currentLineIndex, state.variables]);

  const handleInputChange = (value: string, cursorPosition: number) => {
    const newLines = [...lines];
    newLines[currentLineIndex] = value;
    setLines(newLines);
    setState(prev => ({ ...prev, input: value, cursorPosition }));
  };

  const handleBackspaceOnEmptyLine = () => {
    if (currentLineIndex > 0 && lines[currentLineIndex] === '') {
      // Remove current empty line
      const newLines = lines.filter((_, index) => index !== currentLineIndex);
      setLines(newLines);
      
      // Move to end of previous line
      const prevLineIndex = currentLineIndex - 1;
      const prevLine = lines[prevLineIndex];
      setCurrentLineIndex(prevLineIndex);
      setState(prev => ({ 
        ...prev, 
        input: prevLine, 
        cursorPosition: prevLine.length,
        result: null,
        error: null
      }));
    }
  };

  const handleNewLine = () => {
    // Update prev variable only if we have a valid result
    if (state.result && !state.error) {
      setState(prev => {
        const newVariables = new Map(prev.variables);
        newVariables.set('prev', prev.result!);
        return { ...prev, variables: newVariables };
      });
    }
    
    // Always allow adding a new line
    const newLines = [...lines, ''];
    setLines(newLines);
    setCurrentLineIndex(currentLineIndex + 1);
    setState(prev => ({ ...prev, input: '', cursorPosition: 0, result: null, error: null }));
  };

  const handleArrowUp = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(currentLineIndex - 1);
      const newLine = lines[currentLineIndex - 1];
      setState(prev => ({ ...prev, input: newLine, cursorPosition: newLine.length }));
    }
  };

  const handleArrowDown = () => {
    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex(currentLineIndex + 1);
      const newLine = lines[currentLineIndex + 1];
      setState(prev => ({ ...prev, input: newLine, cursorPosition: newLine.length }));
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
              onBackspaceOnEmptyLine={index === currentLineIndex ? handleBackspaceOnEmptyLine : undefined}
              isActive={index === currentLineIndex}
            />
          );
        })}
      </Box>
    </Box>
  );
};